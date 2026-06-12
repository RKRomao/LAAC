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

CREATE TABLE user_profiles (
  email VARCHAR(255) PRIMARY KEY,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url VARCHAR(255),
  course VARCHAR(255),
  year INT DEFAULT 1,
  social_links TEXT,
  banner_url VARCHAR(255),
  privacy_settings TEXT,
  FOREIGN KEY (email) REFERENCES users(email)
);

CREATE TABLE user_follows (
  follower_id INT,
  followed_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followed_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (followed_id) REFERENCES users(id)
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
  avatar_url VARCHAR(255),
  banner_url VARCHAR(255),
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
  video_url VARCHAR(255),
  organization_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
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
  name VARCHAR(255),
  code VARCHAR(50),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

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

CREATE TABLE roles (
    role_name VARCHAR(50) PRIMARY KEY,
    description TEXT,
    permissions JSON -- Array de strings ex: ["view_admin", "manage_users", "manage_reports"]
);

INSERT INTO roles (role_name, description, permissions) VALUES 
('admin', 'Administrador total do sistema', '["view_admin", "manage_users", "manage_permissions", "manage_reports"]'),
('LAAC-staff:Dev-team', 'Equipa de desenvolvimento', '["view_admin", "manage_reports"]'),
('LAAC-staff:Response-team', 'Equipa de resposta a emergências', '["view_admin", "manage_emergencies"]'),
('aluno', 'Estudante UBI', '[]'),
('funcionarios-ubi', 'Funcionários da universidade', '[]');

-- --- CHALLENGES ---

CREATE TABLE IF NOT EXISTS challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  prize VARCHAR(255) NOT NULL,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'ended'
  winner_id INT NULL,
  winner_name VARCHAR(255) NULL,
  winner_photo_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT NOT NULL,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  caption TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'winner'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --- SEED DATA ---
INSERT INTO locations (id, building, floor, room_code, description) VALUES (999, 'Polo I', 'Piso 0', 'DEP-EI', 'Departamento de Engenharia Informática') ON DUPLICATE KEY UPDATE id=id;

INSERT INTO users (id, email, password_hash, role) VALUES (9999, 'admin@laac.pt', '$2b$12$R9h/lIPzMRFhBp1v86cEJuK.u8U1KEC93RkL/nUXBq1.O0Q6p2n/G', 'admin') ON DUPLICATE KEY UPDATE id=id;

INSERT INTO organizations (id, name, type, description, location_id, creation_date, avatar_url, banner_url) VALUES 
(1, 'AAUBI', 'aaubi', 'Associação Académica da Universidade da Beira Interior. Representamos todos os alunos da UBI.', 999, '2026-01-01', 'https://ui-avatars.com/api/?name=AAUBI&background=0D9488&color=fff', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60'),
(2, 'NEI', 'nucleo', 'Núcleo de Engenharia Informática da UBI. Organização de workshops, palestras e atividades de integração.', 999, '2026-01-01', 'https://ui-avatars.com/api/?name=NEI&background=2563EB&color=fff', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'),
(3, 'NUBI', 'nucleo', 'Núcleo de Bioengenharia da UBI. Conectamos estudantes e promovemos a investigação em bioengenharia.', 999, '2026-01-01', 'https://ui-avatars.com/api/?name=NUBI&background=16A34A&color=fff', 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800&auto=format&fit=crop&q=60')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO organization_members (organization_id, user_id, role, can_manage_events) VALUES
(1, 9999, 'Presidente', 1),
(2, 9999, 'Administrador', 1)
ON DUPLICATE KEY UPDATE id=id;


