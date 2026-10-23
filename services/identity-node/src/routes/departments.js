const express = require('express');
const router = express.Router();
const db = require('../config/db');
const memoryStore = require('../config/memoryStore');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/departments - list all active departments
router.get('/', async (req, res) => {
  try {
    if (db.isPostgresConnected()) {
      const result = await db.query('SELECT * FROM departments WHERE is_active = TRUE ORDER BY name ASC');
      return res.json(result.rows);
    } else {
      return res.json(memoryStore.departments.filter((d) => d.is_active));
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET /api/departments/:code - get department by code
router.get('/:code', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    if (db.isPostgresConnected()) {
      const result = await db.query('SELECT * FROM departments WHERE UPPER(code) = $1', [code]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Department not found' });
      return res.json(result.rows[0]);
    } else {
      const dept = memoryStore.departments.find((d) => d.code.toUpperCase() === code);
      if (!dept) return res.status(404).json({ error: 'Department not found' });
      return res.json(dept);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// GET /api/departments/:code/doctors - get doctors for a department
router.get('/:code/doctors', async (req, res) => {
  const code = req.params.code.toUpperCase();
  try {
    if (db.isPostgresConnected()) {
      const query = `
        SELECT doc.id, doc.full_name, doc.room_number, doc.is_available, dept.code as department_code, dept.name as department_name
        FROM doctors doc
        JOIN departments dept ON doc.department_id = dept.id
        WHERE UPPER(dept.code) = $1 AND doc.is_available = TRUE
      `;
      const result = await db.query(query, [code]);
      return res.json(result.rows);
    } else {
      const dept = memoryStore.departments.find((d) => d.code.toUpperCase() === code);
      if (!dept) return res.status(404).json({ error: 'Department not found' });
      const docs = memoryStore.doctors
        .filter((doc) => doc.department_id === dept.id && doc.is_available)
        .map((doc) => ({
          ...doc,
          department_code: dept.code,
          department_name: dept.name,
        }));
      return res.json(docs);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// POST /api/departments - add new department (Admin/Receptionist)
router.post('/', authenticateToken, requireRole('ADMIN', 'RECEPTIONIST'), async (req, res) => {
  const { code, name, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Department code and name are required' });
  }

  const deptCode = code.toUpperCase().trim();
  try {
    if (db.isPostgresConnected()) {
      const existing = await db.query('SELECT id FROM departments WHERE code = $1', [deptCode]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Department code already exists' });
      }
      const result = await db.query(
        'INSERT INTO departments (code, name, description, is_active) VALUES ($1, $2, $3, TRUE) RETURNING *',
        [deptCode, name, description || '']
      );
      return res.status(201).json(result.rows[0]);
    } else {
      const existing = memoryStore.departments.find((d) => d.code === deptCode);
      if (existing) {
        return res.status(400).json({ error: 'Department code already exists' });
      }
      const newDept = {
        id: memoryStore.departments.length + 1,
        code: deptCode,
        name,
        description: description || '',
        is_active: true,
      };
      memoryStore.departments.push(newDept);
      return res.status(201).json(newDept);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create department' });
  }
});

module.exports = router;
