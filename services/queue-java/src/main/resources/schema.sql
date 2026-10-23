-- Schema for queue_db
CREATE TABLE IF NOT EXISTS token_counters (
    id SERIAL PRIMARY KEY,
    department_code VARCHAR(10) NOT NULL,
    counter_date DATE NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_dept_date UNIQUE (department_code, counter_date)
);

CREATE TABLE IF NOT EXISTS tokens (
    id BIGSERIAL PRIMARY KEY,
    token_number VARCHAR(30) NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    department_id INT NOT NULL,
    patient_id INT NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    reason_for_visit TEXT,
    status VARCHAR(30) NOT NULL,
    is_priority BOOLEAN DEFAULT FALSE,
    doctor_id INT,
    doctor_name VARCHAR(150),
    room_number VARCHAR(50),
    token_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tokens_dept_status ON tokens(department_code, status);
CREATE INDEX IF NOT EXISTS idx_tokens_token_num ON tokens(token_number);
