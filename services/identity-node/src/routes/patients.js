const express = require('express');
const router = express.Router();
const db = require('../config/db');
const memoryStore = require('../config/memoryStore');
const { authenticateToken } = require('../middleware/auth');

// POST /api/patients - Register or record a patient (walk-in or online)
router.post('/', async (req, res) => {
  try {
    const { fullName, phone, age, gender, userId = null } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Patient full name and phone number are required' });
    }

    const cleanPhone = String(phone).trim();
    const cleanName = String(fullName).trim();
    const parsedAge = parseInt(age, 10) || 30;
    const cleanGender = gender ? gender.toUpperCase() : 'OTHER';

    if (db.isPostgresConnected()) {
      // Check if patient with same phone already exists
      const existing = await db.query('SELECT * FROM patients WHERE phone = $1', [cleanPhone]);
      if (existing.rows.length > 0) {
        // Return existing patient to avoid duplicates
        return res.json(existing.rows[0]);
      }

      const result = await db.query(
        'INSERT INTO patients (user_id, full_name, phone, age, gender) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, cleanName, cleanPhone, parsedAge, cleanGender]
      );
      return res.status(201).json(result.rows[0]);
    } else {
      const existing = memoryStore.patients.find((p) => p.phone === cleanPhone);
      if (existing) {
        return res.json(existing);
      }

      const newPatient = {
        id: memoryStore.patients.length + 1,
        user_id: userId,
        full_name: cleanName,
        phone: cleanPhone,
        age: parsedAge,
        gender: cleanGender,
        created_at: new Date(),
      };
      memoryStore.patients.push(newPatient);
      return res.status(201).json(newPatient);
    }
  } catch (err) {
    console.error('Create patient error:', err);
    return res.status(500).json({ error: 'Failed to create patient', details: err.message });
  }
});

// GET /api/patients/by-phone/:phone - Fast lookup for reception desk
router.get('/by-phone/:phone', async (req, res) => {
  const phone = req.params.phone.trim();
  try {
    if (db.isPostgresConnected()) {
      const result = await db.query('SELECT * FROM patients WHERE phone = $1', [phone]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      return res.json(result.rows[0]);
    } else {
      const patient = memoryStore.patients.find((p) => p.phone === phone);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      return res.json(patient);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error querying patient' });
  }
});

// GET /api/patients/:id - Fetch by ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    if (db.isPostgresConnected()) {
      const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
      return res.json(result.rows[0]);
    } else {
      const patient = memoryStore.patients.find((p) => p.id === id);
      if (!patient) return res.status(404).json({ error: 'Patient not found' });
      return res.json(patient);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error fetching patient' });
  }
});

// GET /api/patients - List patients (for staff)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (db.isPostgresConnected()) {
      const result = await db.query('SELECT * FROM patients ORDER BY created_at DESC LIMIT 50');
      return res.json(result.rows);
    } else {
      return res.json(memoryStore.patients);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list patients' });
  }
});

module.exports = router;
