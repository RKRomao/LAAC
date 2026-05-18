-- --- IDENTITY SYSTEM (AUTH & PROFILES) ---

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'aluno',
  phone VARCHAR(50),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  student_number VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  building VARCHAR(255),
  floor VARCHAR(50),
  room_code VARCHAR(50) UNIQUE,
  description VARCHAR(255),
  geojson TEXT
);

CREATE TABLE professors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE laac_staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  support_phone VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- --- LAAC STAFF DEPARTMENTS ---

CREATE TABLE devs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT UNIQUE NOT NULL,
  specialization VARCHAR(255),
  FOREIGN KEY (staff_id) REFERENCES laac_staff(id)
);

CREATE TABLE testers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT UNIQUE NOT NULL,
  test_type VARCHAR(255),
  FOREIGN KEY (staff_id) REFERENCES laac_staff(id)
);

CREATE TABLE marketing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT UNIQUE NOT NULL,
  focus_channel VARCHAR(255),
  FOREIGN KEY (staff_id) REFERENCES laac_staff(id)
);

CREATE TABLE frontdesk (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT UNIQUE NOT NULL,
  shift VARCHAR(255),
  FOREIGN KEY (staff_id) REFERENCES laac_staff(id)
);

-- --- ORGANIZATIONS AND COMMUNITY ---

CREATE TABLE organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  location_id INT,
  creation_date DATE,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE organization_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organization_id INT NOT NULL,
  user_id INT NOT NULL,
  role VARCHAR(100) DEFAULT 'Member',
  can_manage_events BOOLEAN DEFAULT FALSE,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- --- SOCIAL NETWORK AND COMMUNICATION ---

CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE post_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE post_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE direct_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE user_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  followed_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'accepted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (followed_id) REFERENCES users(id)
);

-- --- ACADEMIC STRUCTURE ---

CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  acronym VARCHAR(50)
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT,
  professor_id INT,
  name VARCHAR(255),
  code VARCHAR(50),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (professor_id) REFERENCES professors(id)
);

-- --- SEMESTERS are in CALENDAR SERVICE ---

-- --- CLASS LOGISTICS are in CALENDAR SERVICE ---

-- --- ENROLLMENTS ---

CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  course_id INT,
  class_id INT,
  semester_id INT,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- --- EVENTS ---

CREATE TABLE partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  discount_for_students VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP,
  organization_id INT NOT NULL,
  location_id INT,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE event_partners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  partner_id INT NOT NULL,
  sponsorship_details VARCHAR(255),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- --- ADDITIONAL SERVICES ---

CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT,
  path VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  access_restrictions VARCHAR(50) DEFAULT 'public',
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- --- TICKETS ---

CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type VARCHAR(50), -- 'bug', 'administrative', 'question', 'other'
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Resolved', 'Closed'
  assigned_team VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
