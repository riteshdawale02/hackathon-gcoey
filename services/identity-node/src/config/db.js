const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'identity_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isPostgresConnected = false;

// Auto-initialize tables
async function initDb() {
  try {
    const client = await pool.connect();
    isPostgresConnected = true;
    console.log(' Connected to PostgreSQL (identity_db)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure google_id and nullable password_hash exist on existing schemas
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        department_id INT REFERENCES departments(id) ON DELETE CASCADE,
        full_name VARCHAR(150) NOT NULL,
        room_number VARCHAR(50) NOT NULL,
        is_available BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        full_name VARCHAR(150) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        age INT NOT NULL,
        gender VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log(' Identity tables verified / created successfully.');
  } catch (err) {
    console.warn('⚠️  PostgreSQL connection unavailable. Falling back to in-memory store for demo mode:', err.message);
    isPostgresConnected = false;
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb,
  isPostgresConnected: () => isPostgresConnected,
};
