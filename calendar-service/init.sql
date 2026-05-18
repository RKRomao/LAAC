-- --- CALENDAR SYSTEM ---

CREATE TABLE semesters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester_number INT,
  academic_year VARCHAR(50),
  start_date DATE,
  end_date DATE
);

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id INT, -- Reference to subjects table in academic-service
  location_id INT,
  type VARCHAR(50),
  weekday INT,
  start_time TIME,
  end_time TIME
);

CREATE TABLE schedule_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  class_id INT,
  subject_name VARCHAR(255),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Initial data for semesters
INSERT INTO semesters (semester_number, academic_year, start_date, end_date) VALUES 
(1, '2025/2026', '2025-09-15', '2026-01-31'),
(2, '2025/2026', '2026-02-16', '2026-06-30');
