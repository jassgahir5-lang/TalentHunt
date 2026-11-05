-- TalentHunt - Online Talent Hunt & Competition Management Platform
-- Database Schema for MySQL 8.x / MariaDB / Apache Tomcat Project

CREATE DATABASE IF NOT EXISTS talenthunt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE talenthunt_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(64) NOT NULL,
    role ENUM('admin', 'judge', 'participant') NOT NULL DEFAULT 'participant',
    status ENUM('approved', 'pending') NOT NULL DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Competitions Table
CREATE TABLE IF NOT EXISTS competitions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    rules TEXT NOT NULL,
    reg_deadline DATE NOT NULL,
    sub_deadline DATE NOT NULL,
    status ENUM('Open', 'Closed', 'Published') NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Competition Judges Assignment Junction Table
CREATE TABLE IF NOT EXISTS competition_judges (
    competition_id VARCHAR(64) NOT NULL,
    judge_id VARCHAR(64) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (competition_id, judge_id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(64) NOT NULL,
    participant_id VARCHAR(64) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_comp_participant (competition_id, participant_id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Submissions / Entries Table
CREATE TABLE IF NOT EXISTS entries (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(64) NOT NULL,
    participant_id VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    link VARCHAR(500) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_entry_comp_participant (competition_id, participant_id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Judge Scores Table
CREATE TABLE IF NOT EXISTS scores (
    id VARCHAR(64) PRIMARY KEY,
    entry_id VARCHAR(64) NOT NULL,
    judge_id VARCHAR(64) NOT NULL,
    creativity DECIMAL(3, 1) NOT NULL CHECK (creativity >= 0 AND creativity <= 10),
    skill DECIMAL(3, 1) NOT NULL CHECK (skill >= 0 AND skill <= 10),
    presentation DECIMAL(3, 1) NOT NULL CHECK (presentation >= 0 AND presentation <= 10),
    total DECIMAL(4, 1) NOT NULL CHECK (total >= 0 AND total <= 30),
    comments TEXT,
    scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_entry_judge_score (entry_id, judge_id),
    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
    FOREIGN KEY (judge_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Platform Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(120) NOT NULL,
    priority ENUM('normal', 'high') NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Password Reset Codes Table (10-minute validity)
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    code CHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_code (email, code)
);

-- Seed Data (Pre-hashed with SHA-256)
-- Admin123! -> 92837bc9d9685e9668d2b270a68d0bbd609db22a00c6d57cc142f15e8da8d70a
-- Judge123! -> c3cb81a6021f1deba68ce0db50b3e51f87968ff26775d7870a4409395ee54c0e
-- Pass123!  -> 724b17bf4bfca03f26ae6df7496ab3f68d60e653da2dfcb766d034268ea8e63a

INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('u_admin', 'System Admin', 'admin@talenthunt.edu', '92837bc9d9685e9668d2b270a68d0bbd609db22a00c6d57cc142f15e8da8d70a', 'admin', 'approved'),
('u_judge_1', 'Riya Sharma', 'riya@talenthunt.edu', 'c3cb81a6021f1deba68ce0db50b3e51f87968ff26775d7870a4409395ee54c0e', 'judge', 'approved'),
('u_judge_2', 'Karan Mehta', 'karan@talenthunt.edu', 'c3cb81a6021f1deba68ce0db50b3e51f87968ff26775d7870a4409395ee54c0e', 'judge', 'approved'),
('u_part_demo', 'Demo Participant', 'demo@talenthunt.edu', '724b17bf4bfca03f26ae6df7496ab3f68d60e653da2dfcb766d034268ea8e63a', 'participant', 'approved'),
('u_part_aman', 'Aman Verma', 'aman@talenthunt.edu', '724b17bf4bfca03f26ae6df7496ab3f68d60e653da2dfcb766d034268ea8e63a', 'participant', 'approved'),
('u_part_simran', 'Simran Kaur', 'simran@talenthunt.edu', '724b17bf4bfca03f26ae6df7496ab3f68d60e653da2dfcb766d034268ea8e63a', 'participant', 'approved'),
('u_part_rohan', 'Rohan Gupta', 'rohan@talenthunt.edu', '724b17bf4bfca03f26ae6df7496ab3f68d60e653da2dfcb766d034268ea8e63a', 'participant', 'approved');

INSERT INTO competitions (id, title, category, description, rules, reg_deadline, sub_deadline, status) VALUES
('c_singing', 'Singing Star 2026', 'Singing', 'Showcase your vocal range, pitch perfection, and stage charisma in this solo singing extravaganza.', '1. Video or audio performance between 2 to 4 minutes.\n2. Both classical and contemporary genres welcome.', DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY), 'Open'),
('c_coding', 'Code Sprint Hackathon', 'Coding', 'Solve real-world challenges through creative programming and algorithms.', '1. Public repository link required.\n2. Must include project walkthrough video.', DATE_ADD(CURDATE(), INTERVAL 12 DAY), DATE_ADD(CURDATE(), INTERVAL 25 DAY), 'Open'),
('c_art', 'Canvas Colours Exhibition', 'Art & Design', 'Digital art, traditional sketches, and UI/UX design showcase.', '1. High-res image link required.\n2. Concept note (100-300 words).', DATE_ADD(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Open'),
('c_dance', 'Dance Fever Championship', 'Dancing', 'High energy solo dance showdown across classical, hip-hop, and freestyle.', '1. Routine duration between 90s to 3m.\n2. Judged on creativity, technique, and presentation.', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Published');

INSERT INTO competition_judges (competition_id, judge_id) VALUES
('c_singing', 'u_judge_1'), ('c_singing', 'u_judge_2'),
('c_coding', 'u_judge_1'), ('c_coding', 'u_judge_2'),
('c_art', 'u_judge_1'), ('c_art', 'u_judge_2'),
('c_dance', 'u_judge_1'), ('c_dance', 'u_judge_2');

INSERT INTO registrations (id, competition_id, participant_id) VALUES
('reg_d1', 'c_dance', 'u_part_simran'),
('reg_d2', 'c_dance', 'u_part_aman'),
('reg_d3', 'c_dance', 'u_part_rohan');

INSERT INTO entries (id, competition_id, participant_id, title, description, link) VALUES
('e_dance_simran', 'c_dance', 'u_part_simran', 'Classical Fusion Odyssey', 'A seamless blend of classical Bharatanatyam mudras and ambient beats.', 'https://youtube.com/watch?v=dance-simran-simulated'),
('e_dance_aman', 'c_dance', 'u_part_aman', 'Urban Street Hip-Hop Groove', 'Fast-paced street isolation routine with popping and locking.', 'https://youtube.com/watch?v=dance-aman-simulated'),
('e_dance_rohan', 'c_dance', 'u_part_rohan', 'Contemporary Soul Express', 'An emotive lyrical contemporary performance depicting resilience.', 'https://youtube.com/watch?v=dance-rohan-simulated');

INSERT INTO scores (id, entry_id, judge_id, creativity, skill, presentation, total, comments) VALUES
('sc_simran_1', 'e_dance_simran', 'u_judge_1', 9.0, 9.0, 10.0, 28.0, 'Phenomenal expressive balance and rhythm control.'),
('sc_simran_2', 'e_dance_simran', 'u_judge_2', 9.0, 9.0, 9.0, 27.0, 'Graceful posture and flawless transition.'),
('sc_aman_1', 'e_dance_aman', 'u_judge_1', 9.0, 8.0, 9.0, 26.0, 'Electrifying stage presence and musicality.'),
('sc_aman_2', 'e_dance_aman', 'u_judge_2', 8.0, 9.0, 8.0, 25.0, 'Impressive technique and synchronization.'),
('sc_rohan_1', 'e_dance_rohan', 'u_judge_1', 8.0, 7.0, 8.0, 23.0, 'Very emotive storytelling with nice floorwork.'),
('sc_rohan_2', 'e_dance_rohan', 'u_judge_2', 7.0, 8.0, 7.0, 22.0, 'Good choreography and control.');

INSERT INTO announcements (id, title, content, author_name, priority) VALUES
('ann_1', 'Welcome to TalentHunt Annual Cultural & Technical Extravaganza 2026!', 'We are thrilled to launch the online competition management platform. Check out active events and submit before deadlines!', 'System Admin', 'high'),
('ann_2', 'Dance Fever Final Results Officially Published - Congratulations to the Winners!', 'The panel of judges has finalized their evaluations. Visit the Leaderboard to view podium winners.', 'System Admin', 'normal');
