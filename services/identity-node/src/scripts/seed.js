const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function runSeed() {
  console.log('🌱 Starting Identity & Patient Service database seed...');
  try {
    await db.initDb();

    if (!db.isPostgresConnected()) {
      console.log('ℹ️  PostgreSQL not connected; in-memory store already contains seed data for quick demo.');
      process.exit(0);
    }

    const client = await db.pool.connect();
    const hash = await bcrypt.hash('Password123!', 10);

    // Truncate
    await client.query('TRUNCATE TABLE patients, doctors, departments, users RESTART IDENTITY CASCADE;');

    // Users
    await client.query(`
      INSERT INTO users (email, password_hash, role) VALUES
      ('admin@pulsequeue.com', $1, 'ADMIN'),
      ('reception@pulsequeue.com', $1, 'RECEPTIONIST'),
      ('dr.sharma@pulsequeue.com', $1, 'DOCTOR'),
      ('dr.chen@pulsequeue.com', $1, 'DOCTOR'),
      ('dr.patel@pulsequeue.com', $1, 'DOCTOR'),
      ('patient@example.com', $1, 'PATIENT')
    `, [hash]);

    // Departments
    await client.query(`
      INSERT INTO departments (code, name, description, is_active) VALUES
      ('GEN', 'General Medicine', 'Primary consultations, fever, diagnostics & routine checks', TRUE),
      ('CARD', 'Cardiology', 'ECG, heart screening, blood pressure & cardiovascular care', TRUE),
      ('ORTH', 'Orthopedics', 'Joint pain, fractures, spine and musculoskeletal care', TRUE),
      ('PED', 'Pediatrics', 'Infant and child wellness, vaccination, adolescent care', TRUE)
    `);

    // Doctors
    await client.query(`
      INSERT INTO doctors (user_id, department_id, full_name, room_number, is_available) VALUES
      (3, 2, 'Dr. Rajesh Sharma', 'Room 101', TRUE),
      (4, 1, 'Dr. Emily Chen', 'Room 203', TRUE),
      (5, 3, 'Dr. Marcus Vance', 'Room 105', TRUE)
    `);

    // Patients
    await client.query(`
      INSERT INTO patients (user_id, full_name, phone, age, gender) VALUES
      (6, 'John Doe', '9876543210', 34, 'MALE'),
      (NULL, 'Sarah Connor', '9123456780', 42, 'FEMALE'),
      (NULL, 'Robert Davis', '9234567890', 68, 'MALE'),
      (NULL, 'Aisha Khan', '9345678901', 27, 'FEMALE')
    `);

    client.release();
    console.log('✅ Identity database seeded successfully with users, departments, doctors, and patients!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
