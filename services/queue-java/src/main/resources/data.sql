-- Seed data for queue_db
-- Insert today's initial tokens if table is empty
INSERT INTO token_counters (department_code, counter_date, last_sequence)
VALUES 
('CARD', CURRENT_DATE, 4),
('GEN', CURRENT_DATE, 2),
('ORTH', CURRENT_DATE, 1),
('PED', CURRENT_DATE, 3)
ON CONFLICT (department_code, counter_date) DO NOTHING;

INSERT INTO tokens (token_number, department_code, department_id, patient_id, patient_name, patient_phone, reason_for_visit, status, is_priority, doctor_id, doctor_name, room_number, token_date, created_at, called_at, completed_at)
VALUES
('CARD-001', 'CARD', 2, 3, 'Robert Davis', '9234567890', 'Routine BP & Cholesterol review', 'COMPLETED', FALSE, 1, 'Dr. Rajesh Sharma', 'Room 101', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '45 MINUTE', CURRENT_TIMESTAMP - INTERVAL '40 MINUTE', CURRENT_TIMESTAMP - INTERVAL '25 MINUTE'),
('CARD-002', 'CARD', 2, 1, 'John Doe', '9876543210', 'Chest tightness on exertion', 'IN_PROGRESS', FALSE, 1, 'Dr. Rajesh Sharma', 'Room 101', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '25 MINUTE', CURRENT_TIMESTAMP - INTERVAL '10 MINUTE', NULL),
('CARD-003', 'CARD', 2, 2, 'Sarah Connor', '9123456780', 'Arrhythmia & follow-up ECG', 'WAITING', FALSE, NULL, NULL, NULL, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '15 MINUTE', NULL, NULL),
('CARD-004', 'CARD', 2, 4, 'Aisha Khan', '9345678901', 'Severe palpitation & dizziness', 'WAITING', TRUE, NULL, NULL, NULL, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '5 MINUTE', NULL, NULL),
('GEN-001', 'GEN', 1, 2, 'Sarah Connor', '9123456780', 'Persistent high fever and cough', 'IN_PROGRESS', FALSE, 2, 'Dr. Emily Chen', 'Room 203', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '20 MINUTE', CURRENT_TIMESTAMP - INTERVAL '8 MINUTE', NULL),
('GEN-002', 'GEN', 1, 1, 'John Doe', '9876543210', 'Annual preventative health checkup', 'WAITING', FALSE, NULL, NULL, NULL, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '10 MINUTE', NULL, NULL),
('ORTH-001', 'ORTH', 3, 3, 'Robert Davis', '9234567890', 'Right knee swelling & acute pain', 'WAITING', FALSE, NULL, NULL, NULL, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '12 MINUTE', NULL, NULL),
('PED-001', 'PED', 4, 1, 'Aarav Sharma (Age 4)', '9876543210', 'High fever (103°F) & viral cough', 'WAITING', TRUE, NULL, NULL, NULL, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '8 MINUTE', NULL, NULL),
('PED-002', 'PED', 4, 2, 'Baby Leo (Age 1)', '9901234567', '6-month developmental vaccine review', 'WAITING', FALSE, NULL, NULL, NULL, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '15 MINUTE', NULL, NULL)
ON CONFLICT DO NOTHING;
