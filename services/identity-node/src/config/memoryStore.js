// In-memory fallback repository for instant demo resilience if PostgreSQL is offline
const bcrypt = require('bcryptjs');

const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

const memoryStore = {
  users: [
    { id: 1, email: 'admin@pulsequeue.com', password_hash: defaultPasswordHash, role: 'ADMIN', created_at: new Date() },
    { id: 2, email: 'reception@pulsequeue.com', password_hash: defaultPasswordHash, role: 'RECEPTIONIST', created_at: new Date() },
    { id: 3, email: 'dr.sharma@pulsequeue.com', password_hash: defaultPasswordHash, role: 'DOCTOR', created_at: new Date() },
    { id: 4, email: 'dr.chen@pulsequeue.com', password_hash: defaultPasswordHash, role: 'DOCTOR', created_at: new Date() },
    { id: 5, email: 'dr.patel@pulsequeue.com', password_hash: defaultPasswordHash, role: 'DOCTOR', created_at: new Date() },
    { id: 6, email: 'patient@example.com', password_hash: defaultPasswordHash, role: 'PATIENT', created_at: new Date() },
  ],
  departments: [
    { id: 1, code: 'GEN', name: 'General Medicine', description: 'Primary consultations and health checkups', is_active: true },
    { id: 2, code: 'CARD', name: 'Cardiology', description: 'Heart, vascular and hypertension care', is_active: true },
    { id: 3, code: 'ORTH', name: 'Orthopedics', description: 'Bone, joint and musculoskeletal care', is_active: true },
    { id: 4, code: 'PED', name: 'Pediatrics', description: 'Infant, child and adolescent health', is_active: true },
  ],
  doctors: [
    { id: 1, user_id: 3, department_id: 2, full_name: 'Dr. Rajesh Sharma', room_number: 'Room 101', is_available: true },
    { id: 2, user_id: 4, department_id: 1, full_name: 'Dr. Emily Chen', room_number: 'Room 203', is_available: true },
    { id: 3, user_id: 5, department_id: 3, full_name: 'Dr. Marcus Vance', room_number: 'Room 105', is_available: true },
  ],
  patients: [
    { id: 1, user_id: 6, full_name: 'John Doe', phone: '9876543210', age: 34, gender: 'MALE', created_at: new Date() },
    { id: 2, user_id: null, full_name: 'Sarah Connor', phone: '9123456780', age: 42, gender: 'FEMALE', created_at: new Date() },
    { id: 3, user_id: null, full_name: 'Robert Davis', phone: '9234567890', age: 68, gender: 'MALE', created_at: new Date() },
  ]
};

module.exports = memoryStore;
