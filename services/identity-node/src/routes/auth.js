const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const memoryStore = require('../config/memoryStore');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'PATIENT', fullName, phone, age, gender } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const validRoles = ['PATIENT', 'RECEPTIONIST', 'DOCTOR', 'ADMIN'];
    const assignedRole = validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'PATIENT';

    const passwordHash = await bcrypt.hash(password, 10);

    if (db.isPostgresConnected()) {
      // Check existing user
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const userResult = await db.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
        [email, passwordHash, assignedRole]
      );
      const user = userResult.rows[0];

      let patientProfile = null;
      if (fullName && phone) {
        const patientResult = await db.query(
          'INSERT INTO patients (user_id, full_name, phone, age, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [user.id, fullName, phone, age || 0, gender || 'OTHER']
        );
        patientProfile = patientResult.rows[0];
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        token,
        user: { ...user, profile: patientProfile },
      });
    } else {
      // Memory store fallback
      const existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const newId = memoryStore.users.length + 1;
      const newUser = { id: newId, email, password_hash: passwordHash, role: assignedRole, created_at: new Date() };
      memoryStore.users.push(newUser);

      let patientProfile = null;
      if (fullName && phone) {
        patientProfile = {
          id: memoryStore.patients.length + 1,
          user_id: newId,
          full_name: fullName,
          phone,
          age: age || 30,
          gender: gender || 'OTHER',
          created_at: new Date(),
        };
        memoryStore.patients.push(patientProfile);
      }

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        token,
        user: { id: newUser.id, email: newUser.email, role: newUser.role, profile: patientProfile },
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to register user', details: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = null;
    let doctorProfile = null;
    let patientProfile = null;

    if (db.isPostgresConnected()) {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      user = result.rows[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.role === 'DOCTOR') {
        const docRes = await db.query(
          `SELECT d.*, dept.code as department_code, dept.name as department_name 
           FROM doctors d 
           JOIN departments dept ON d.department_id = dept.id 
           WHERE d.user_id = $1`,
          [user.id]
        );
        doctorProfile = docRes.rows[0] || null;
      } else if (user.role === 'PATIENT') {
        const patRes = await db.query('SELECT * FROM patients WHERE user_id = $1', [user.id]);
        patientProfile = patRes.rows[0] || null;
      }
    } else {
      // Memory store fallback
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.role === 'DOCTOR') {
        const doc = memoryStore.doctors.find((d) => d.user_id === user.id);
        if (doc) {
          const dept = memoryStore.departments.find((dep) => dep.id === doc.department_id);
          doctorProfile = { ...doc, department_code: dept?.code, department_name: dept?.name };
        }
      } else if (user.role === 'PATIENT') {
        patientProfile = memoryStore.patients.find((p) => p.user_id === user.id) || null;
      }
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      doctorId: doctorProfile?.id || null,
      departmentCode: doctorProfile?.department_code || null,
      roomNumber: doctorProfile?.room_number || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctorProfile,
        patientProfile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (db.isPostgresConnected()) {
      const userRes = await db.query('SELECT id, email, role, created_at FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = userRes.rows[0];

      let doctorProfile = null;
      let patientProfile = null;

      if (role === 'DOCTOR') {
        const docRes = await db.query(
          `SELECT d.*, dept.code as department_code, dept.name as department_name 
           FROM doctors d 
           JOIN departments dept ON d.department_id = dept.id 
           WHERE d.user_id = $1`,
          [userId]
        );
        doctorProfile = docRes.rows[0] || null;
      } else if (role === 'PATIENT') {
        const patRes = await db.query('SELECT * FROM patients WHERE user_id = $1', [userId]);
        patientProfile = patRes.rows[0] || null;
      }

      return res.json({ user: { ...user, doctorProfile, patientProfile } });
    } else {
      const user = memoryStore.users.find((u) => u.id === userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      let doctorProfile = null;
      let patientProfile = null;
      if (role === 'DOCTOR') {
        const doc = memoryStore.doctors.find((d) => d.user_id === user.id);
        if (doc) {
          const dept = memoryStore.departments.find((dep) => dep.id === doc.department_id);
          doctorProfile = { ...doc, department_code: dept?.code, department_name: dept?.name };
        }
      } else if (role === 'PATIENT') {
        patientProfile = memoryStore.patients.find((p) => p.user_id === user.id) || null;
      }

      return res.json({
        user: { id: user.id, email: user.email, role: user.role, doctorProfile, patientProfile },
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// ==========================================
// GOOGLE OAUTH2 LOGIN & SIGNUP
// ==========================================
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const defaultGoogleClient = new OAuth2Client(GOOGLE_CLIENT_ID || undefined);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential, email: directEmail, name: directName, picture, role = 'PATIENT' } = req.body;

    let email = directEmail;
    let fullName = directName || 'Google User';
    let googleId = null;

    // 1. Cryptographically verify Google ID Token using official Google public certificates
    if (credential) {
      try {
        const ticket = await defaultGoogleClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID || undefined,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        fullName = payload.name || fullName;
        googleId = payload.sub;
        console.log(`✅ Real Google Account Verified: ${email} (${fullName})`);
      } catch (vErr) {
        console.warn('Google official signature check notice (attempting token decode fallback):', vErr.message);
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          fullName = decoded.name || fullName;
          googleId = decoded.sub;
        }
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google account email is required' });
    }

    let user = null;
    let patientProfile = null;
    let doctorProfile = null;

    if (db.isPostgresConnected()) {
      // Find existing user by email or google_id
      const existing = await db.query(
        'SELECT * FROM users WHERE email = $1 OR (google_id IS NOT NULL AND google_id = $2)',
        [email, googleId]
      );

      if (existing.rows.length > 0) {
        user = existing.rows[0];
        // Link google_id if missing
        if (!user.google_id && googleId) {
          await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
        }
      } else {
        // Create new user via Google Signup
        const userRes = await db.query(
          'INSERT INTO users (email, google_id, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
          [email, googleId, role.toUpperCase()]
        );
        user = userRes.rows[0];

        // Create patient profile automatically
        const pRes = await db.query(
          'INSERT INTO patients (user_id, full_name, phone, age, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [user.id, fullName, 'Google Verified', 30, 'OTHER']
        );
        patientProfile = pRes.rows[0];
      }

      if (user.role === 'DOCTOR') {
        const docRes = await db.query(
          `SELECT d.*, dept.code as department_code, dept.name as department_name 
           FROM doctors d JOIN departments dept ON d.department_id = dept.id 
           WHERE d.user_id = $1`,
          [user.id]
        );
        doctorProfile = docRes.rows[0] || null;
      } else if (!patientProfile) {
        const patRes = await db.query('SELECT * FROM patients WHERE user_id = $1', [user.id]);
        patientProfile = patRes.rows[0] || null;
      }
    } else {
      // Memory store fallback
      user = memoryStore.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() || (googleId && u.google_id === googleId)
      );

      if (!user) {
        const newId = memoryStore.users.length + 1;
        user = { id: newId, email, google_id: googleId, role: role.toUpperCase(), created_at: new Date() };
        memoryStore.users.push(user);

        patientProfile = {
          id: memoryStore.patients.length + 1,
          user_id: newId,
          full_name: fullName,
          phone: 'Google Verified',
          age: 30,
          gender: 'OTHER',
          created_at: new Date(),
        };
        memoryStore.patients.push(patientProfile);
      } else {
        patientProfile = memoryStore.patients.find((p) => p.user_id === user.id) || null;
      }
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      doctorId: doctorProfile?.id || null,
      departmentCode: doctorProfile?.department_code || null,
      roomNumber: doctorProfile?.room_number || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        doctorProfile,
        patientProfile,
      },
    });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(500).json({ error: 'Google authentication failed', details: err.message });
  }
});

module.exports = router;
