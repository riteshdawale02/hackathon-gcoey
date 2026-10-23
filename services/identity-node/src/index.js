const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDb } = require('./config/db');

const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const patientRoutes = require('./routes/patients');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger for demo visibility
app.use((req, res, next) => {
  console.log(`[Identity-Node] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint (for K8s & Docker probes)
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'identity-node',
    timestamp: new Date().toISOString(),
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/patients', patientRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PulseQueue Identity & Patient Service running on port ${PORT}`);
    console.log(`👉 Health check: http://localhost:${PORT}/health`);
  });
}

start();

module.exports = app;
