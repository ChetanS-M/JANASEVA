-- MySQL Database Schema for GovSERVICE
-- Run this script in MySQL to create the database and tables

CREATE DATABASE IF NOT EXISTS govservice
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE govservice;

-- Users table (for register/login)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  face_verified BOOLEAN DEFAULT FALSE,
  face_data LONGBLOB,
  face_embedding TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_face_samples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  angle_label VARCHAR(50),
  image_data LONGBLOB NOT NULL,
  face_signature TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_face_samples_user_id (user_id),
  CONSTRAINT fk_user_face_samples_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  mode VARCHAR(20) NOT NULL,
  otp_key VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  payload_json LONGTEXT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_otp_mode_key (mode, otp_key)
);

-- Applications history (summary table)
CREATE TABLE IF NOT EXISTS applications_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  applicant_name VARCHAR(150) NOT NULL,
  application_type VARCHAR(100) NOT NULL,
  application_date DATE NOT NULL,
  status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  user_id INT NULL,
  reviewed_by VARCHAR(80) NULL,
  reviewer_name VARCHAR(150) NULL,
  reviewer_designation VARCHAR(150) NULL,
  review_notes TEXT NULL,
  review_checklist_json LONGTEXT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_application_date (application_date)
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NULL UNIQUE,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  designation VARCHAR(150) NOT NULL,
  department VARCHAR(150) NOT NULL,
  office_name VARCHAR(150) NOT NULL,
  face_verified BOOLEAN DEFAULT FALSE,
  face_data LONGBLOB NULL,
  face_embedding TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aadhaar applications
CREATE TABLE IF NOT EXISTS aadhaar_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  father_or_husband_name VARCHAR(150),
  dob DATE,
  gender VARCHAR(50),
  mobile VARCHAR(20),
  email VARCHAR(150),
  addr_line1 VARCHAR(255),
  locality VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pin_code VARCHAR(10),
  identity_proof LONGTEXT,
  address_proof LONGTEXT,
  dob_proof LONGTEXT,
  photo_path LONGTEXT,
  face_verified BOOLEAN DEFAULT FALSE,
  face_verification_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAN applications
CREATE TABLE IF NOT EXISTS pan_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150),
  dob DATE,
  aadhaar_number VARCHAR(20),
  mobile VARCHAR(20),
  email VARCHAR(150),
  identity_proof LONGTEXT,
  address_proof LONGTEXT,
  dob_proof LONGTEXT,
  photo_path LONGTEXT,
  signature_path LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passport applications
CREATE TABLE IF NOT EXISTS passport_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  dob DATE,
  gender VARCHAR(50),
  place_of_birth VARCHAR(100),
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  marital_status VARCHAR(50),
  spouse_name VARCHAR(150),
  mobile VARCHAR(20),
  email VARCHAR(150),
  present_address TEXT,
  permanent_address TEXT,
  address_proof_type LONGTEXT,
  identity_proof_path LONGTEXT,
  dob_proof_path LONGTEXT,
  photo_path LONGTEXT,
  signature_path LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voter ID applications
CREATE TABLE IF NOT EXISTS voterid_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  father_or_husband_name VARCHAR(150),
  dob DATE,
  gender VARCHAR(50),
  mobile VARCHAR(20),
  email VARCHAR(150),
  address_line1 VARCHAR(255),
  locality VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pin_code VARCHAR(10),
  identity_proof LONGTEXT,
  age_proof LONGTEXT,
  address_proof LONGTEXT,
  photo_path LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Birth Certificate applications
CREATE TABLE IF NOT EXISTS birthcertificate_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  child_name VARCHAR(150) NOT NULL,
  dob DATE,
  gender VARCHAR(50),
  place_of_birth VARCHAR(100),
  hospital_name VARCHAR(200),
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  parent_mobile VARCHAR(20),
  parent_email VARCHAR(150),
  birth_proof LONGTEXT,
  parent_id_proof LONGTEXT,
  parent_address_proof LONGTEXT,
  marriage_certificate_path LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driving License applications
CREATE TABLE IF NOT EXISTS driving_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150),
  dob DATE,
  gender VARCHAR(50),
  mobile VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  licence_type VARCHAR(180),
  ll_number VARCHAR(50),
  ll_issue_date DATE,
  identity_proof_path LONGTEXT,
  address_proof_path LONGTEXT,
  age_proof_path LONGTEXT,
  photo_path LONGTEXT,
  medical_certificate_path LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ration Card applications
CREATE TABLE IF NOT EXISTS rationcard_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  head_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  address TEXT,
  members_count INT,
  aadhaar_numbers TEXT,
  identity_proof LONGTEXT,
  address_proof LONGTEXT,
  income_certificate_path LONGTEXT,
  photos_path LONGTEXT,
  bank_passbook_path LONGTEXT,
  surrender_cert_path LONGTEXT,
  caste_cert_path LONGTEXT,
  disability_cert_path LONGTEXT,
  age_proof_path LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Caste & Income Certificate applications
CREATE TABLE IF NOT EXISTS casteincome_applications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_number VARCHAR(50) NOT NULL UNIQUE,
  cert_type VARCHAR(80),
  full_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150),
  mother_name VARCHAR(150),
  dob DATE,
  gender VARCHAR(50),
  religion VARCHAR(100),
  caste_name VARCHAR(100),
  sub_caste VARCHAR(100),
  perm_address TEXT,
  present_address TEXT,
  mobile VARCHAR(20),
  email VARCHAR(150),
  occupation VARCHAR(100),
  annual_income DECIMAL(15,2),
  income_source VARCHAR(200),
  income_proof_path LONGTEXT,
  identity_proof LONGTEXT,
  address_proof LONGTEXT,
  dob_proof LONGTEXT,
  caste_proof LONGTEXT,
  photo_path LONGTEXT,
  declaration BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
