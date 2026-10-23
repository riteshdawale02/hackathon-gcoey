-- PulseQueue Identity Database Seed SQL Script
-- Run this against identity_db

-- Clean existing data
TRUNCATE TABLE patients, doctors, departments, users RESTART IDENTITY CASCADE;

-- Insert Users (Password: Password123!)
-- Hash generated with bcrypt cost factor 10
INSERT INTO users (email, password_hash, role) VALUES
('admin@pulsequeue.com', '$2a$10$w3HkUoX7oWwU9a6bUjE6a.cvyC7o4e9JqQ1e0n1g9uR0z0w9x8yza', 'ADMIN'),
('reception@pulsequeue.com', '$2a$10$w3HkUoX7oWwU9a6bUjE6a.cvyC7o4e9JqQ1e0n1g9uR0z0w9x8yza', 'RECEPTIONIST'),
('dr.sharma@pulsequeue.com', '$2a$10$w3HkUoX7oWwU9a6bUjE6a.cvyC7o4e9JqQ1e0n1g9uR0z0w9x8yza', 'DOCTOR'),
('dr.chen@pulsequeue.com', '$2a$10$w3HkUoX7oWwU9a6bUjE6a.cvyC7o4e9JqQ1e0n1g9uR0z0w9x8yza', 'DOCTOR'),
('dr.patel@pulsequeue.com', '$2a$10$w3HkUoX7oWwU9a6bUjE6a.cvyC7o4e9JqQ1e0n1g9uR0z0w9x8yza', 'DOCTOR'),
('patient@example.com', '$2a$10$w3HkUoX7oWwU9a6bUjE6a.cvyC7o4e9JqQ1e0n1g9uR0z0w9x8yza', 'PATIENT');

-- Insert Departments
INSERT INTO departments (code, name, description, is_active) VALUES
('GEN', 'General Medicine', 'Primary consultations, fever, diagnostics & routine checks', TRUE),
('CARD', 'Cardiology', 'ECG, heart screening, blood pressure & cardiovascular care', TRUE),
('ORTH', 'Orthopedics', 'Joint pain, fractures, spine and musculoskeletal care', TRUE),
('PED', 'Pediatrics', 'Infant and child wellness, vaccination, adolescent care', TRUE);

-- Insert Doctors
INSERT INTO doctors (user_id, department_id, full_name, room_number, is_available) VALUES
(3, 2, 'Dr. Rajesh Sharma', 'Room 101', TRUE),
(4, 1, 'Dr. Emily Chen', 'Room 203', TRUE),
(5, 3, 'Dr. Marcus Vance', 'Room 105', TRUE);

-- Insert Sample Patients
INSERT INTO patients (user_id, full_name, phone, age, gender) VALUES
(6, 'John Doe', '9876543210', 34, 'MALE'),
(NULL, 'Sarah Connor', '9123456780', 42, 'FEMALE'),
(NULL, 'Robert Davis', '9234567890', 68, 'MALE'),
(NULL, 'Aisha Khan', '9345678901', 27, 'FEMALE');
