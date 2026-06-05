const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const AWS = require('aws-sdk');
const multer = require('multer');
const db = require('./db');

try {
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');

  // Prefer backend/.env. If missing, fallback to backend/.env.example.
  const primary = dotenv.config({ path: envPath });
  if (primary.error) {
    dotenv.config({ path: envExamplePath });
  }
} catch (e) {
  // Environment file support is optional.
}

// Configure AWS Rekognition
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }));

function runSchemaMigrations() {
  const alterStatements = [
    "ALTER TABLE users ADD COLUMN face_verified BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN face_data LONGBLOB NULL",
    "ALTER TABLE users ADD COLUMN face_embedding TEXT NULL",
    "ALTER TABLE applications_history ADD COLUMN reviewed_by VARCHAR(80) NULL",
    "ALTER TABLE applications_history ADD COLUMN reviewer_name VARCHAR(150) NULL",
    "ALTER TABLE applications_history ADD COLUMN reviewer_designation VARCHAR(150) NULL",
    "ALTER TABLE applications_history ADD COLUMN review_notes TEXT NULL",
    "ALTER TABLE applications_history ADD COLUMN review_checklist_json LONGTEXT NULL",
    "ALTER TABLE applications_history ADD COLUMN reviewed_at TIMESTAMP NULL",
    "ALTER TABLE admin_users ADD COLUMN email VARCHAR(150) NULL",
    "ALTER TABLE admin_users ADD COLUMN face_verified BOOLEAN DEFAULT FALSE",
    "ALTER TABLE admin_users ADD COLUMN face_data LONGBLOB NULL",
    "ALTER TABLE admin_users ADD COLUMN face_embedding TEXT NULL",

    "ALTER TABLE aadhaar_applications MODIFY COLUMN gender VARCHAR(50) NULL",
    "ALTER TABLE aadhaar_applications MODIFY COLUMN identity_proof LONGTEXT NULL",
    "ALTER TABLE aadhaar_applications MODIFY COLUMN address_proof LONGTEXT NULL",
    "ALTER TABLE aadhaar_applications MODIFY COLUMN dob_proof LONGTEXT NULL",
    "ALTER TABLE aadhaar_applications MODIFY COLUMN photo_path LONGTEXT NULL",

    "ALTER TABLE pan_applications MODIFY COLUMN identity_proof LONGTEXT NULL",
    "ALTER TABLE pan_applications MODIFY COLUMN address_proof LONGTEXT NULL",
    "ALTER TABLE pan_applications MODIFY COLUMN dob_proof LONGTEXT NULL",
    "ALTER TABLE pan_applications MODIFY COLUMN photo_path LONGTEXT NULL",
    "ALTER TABLE pan_applications MODIFY COLUMN signature_path LONGTEXT NULL",

    "ALTER TABLE passport_applications MODIFY COLUMN gender VARCHAR(50) NULL",
    "ALTER TABLE passport_applications MODIFY COLUMN marital_status VARCHAR(50) NULL",
    "ALTER TABLE passport_applications MODIFY COLUMN address_proof_type LONGTEXT NULL",
    "ALTER TABLE passport_applications MODIFY COLUMN identity_proof_path LONGTEXT NULL",
    "ALTER TABLE passport_applications MODIFY COLUMN dob_proof_path LONGTEXT NULL",
    "ALTER TABLE passport_applications MODIFY COLUMN photo_path LONGTEXT NULL",
    "ALTER TABLE passport_applications MODIFY COLUMN signature_path LONGTEXT NULL",

    "ALTER TABLE voterid_applications MODIFY COLUMN gender VARCHAR(50) NULL",
    "ALTER TABLE voterid_applications MODIFY COLUMN identity_proof LONGTEXT NULL",
    "ALTER TABLE voterid_applications MODIFY COLUMN age_proof LONGTEXT NULL",
    "ALTER TABLE voterid_applications MODIFY COLUMN address_proof LONGTEXT NULL",
    "ALTER TABLE voterid_applications MODIFY COLUMN photo_path LONGTEXT NULL",

    "ALTER TABLE birthcertificate_applications MODIFY COLUMN gender VARCHAR(50) NULL",
    "ALTER TABLE birthcertificate_applications MODIFY COLUMN place_of_birth VARCHAR(100) NULL",
    "ALTER TABLE birthcertificate_applications MODIFY COLUMN birth_proof LONGTEXT NULL",
    "ALTER TABLE birthcertificate_applications MODIFY COLUMN parent_id_proof LONGTEXT NULL",
    "ALTER TABLE birthcertificate_applications MODIFY COLUMN parent_address_proof LONGTEXT NULL",
    "ALTER TABLE birthcertificate_applications MODIFY COLUMN marriage_certificate_path LONGTEXT NULL",

    "ALTER TABLE driving_applications MODIFY COLUMN gender VARCHAR(50) NULL",
    "ALTER TABLE driving_applications MODIFY COLUMN licence_type VARCHAR(180) NULL",
    "ALTER TABLE driving_applications MODIFY COLUMN identity_proof_path LONGTEXT NULL",
    "ALTER TABLE driving_applications MODIFY COLUMN address_proof_path LONGTEXT NULL",
    "ALTER TABLE driving_applications MODIFY COLUMN age_proof_path LONGTEXT NULL",
    "ALTER TABLE driving_applications MODIFY COLUMN photo_path LONGTEXT NULL",
    "ALTER TABLE driving_applications MODIFY COLUMN medical_certificate_path LONGTEXT NULL",

    "ALTER TABLE rationcard_applications MODIFY COLUMN identity_proof LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN address_proof LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN income_certificate_path LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN photos_path LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN bank_passbook_path LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN surrender_cert_path LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN caste_cert_path LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN disability_cert_path LONGTEXT NULL",
    "ALTER TABLE rationcard_applications MODIFY COLUMN age_proof_path LONGTEXT NULL",

    "ALTER TABLE casteincome_applications MODIFY COLUMN cert_type VARCHAR(80) NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN gender VARCHAR(50) NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN religion VARCHAR(100) NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN income_proof_path LONGTEXT NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN identity_proof LONGTEXT NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN address_proof LONGTEXT NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN dob_proof LONGTEXT NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN caste_proof LONGTEXT NULL",
    "ALTER TABLE casteincome_applications MODIFY COLUMN photo_path LONGTEXT NULL",
  ];

  alterStatements.forEach(sql => {
    db.query(sql, err => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') {
        console.error('Schema migration failed:', err.message);
      }
    });
  });

  db.query(
    `CREATE TABLE IF NOT EXISTS user_face_samples (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      angle_label VARCHAR(50) NULL,
      image_data LONGBLOB NOT NULL,
      face_signature TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_face_samples_user_id (user_id),
      CONSTRAINT fk_user_face_samples_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    err => {
      if (err) {
        console.error('Face samples table migration failed:', err.message);
      }
    }
  );

  db.query(
    `CREATE TABLE IF NOT EXISTS otp_codes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      mode VARCHAR(20) NOT NULL,
      otp_key VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      payload_json LONGTEXT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_otp_mode_key (mode, otp_key)
    )`,
    err => {
      if (err) {
        console.error('OTP codes table migration failed:', err.message);
      }
    }
  );

  db.query(
    `CREATE TABLE IF NOT EXISTS admin_users (
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
    )`,
    err => {
      if (err) {
        console.error('Admin users table migration failed:', err.message);
      }
    }
  );

  seedDefaultAdminUser();
}

function seedDefaultAdminUser() {
  const adminUsername = String(process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPassword = String(process.env.ADMIN_PASSWORD || 'Admin@123').trim();
  const adminFullName = String(process.env.ADMIN_FULL_NAME || 'Nodal Verification Officer').trim();
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@janaseva.gov.in').trim();
  const adminDesignation = String(process.env.ADMIN_DESIGNATION || 'Senior Verification Officer').trim();
  const adminDepartment = String(process.env.ADMIN_DEPARTMENT || 'Citizen Services Department').trim();
  const adminOffice = String(process.env.ADMIN_OFFICE_NAME || 'JanaSeva Central Scrutiny Cell').trim();

  db.query('SELECT id FROM admin_users WHERE username = ? LIMIT 1', [adminUsername], async (err, rows) => {
    if (err) {
      console.error('Default admin lookup failed:', err.message);
      return;
    }
    if (rows.length) {
      return;
    }

    try {
      const hash = await bcrypt.hash(adminPassword, 10);
      db.query(
        `INSERT INTO admin_users (username, password_hash, full_name, email, designation, department, office_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminUsername, hash, adminFullName, adminEmail, adminDesignation, adminDepartment, adminOffice],
        insertErr => {
          if (insertErr) {
            console.error('Default admin seed failed:', insertErr.message);
            return;
          }
          console.log(`Seeded default admin account: ${adminUsername}`);
        }
      );
    } catch (hashErr) {
      console.error('Default admin hash failed:', hashErr.message);
    }
  });
}

function normalizeAdminEmployeeId(value) {
  return String(value || '').trim().toUpperCase();
}

function isAllowedAdminEmployeeId(value) {
  const normalized = normalizeAdminEmployeeId(value);
  const match = /^JSKAR2026(\d{2})$/.exec(normalized);
  if (!match) {
    return false;
  }
  const sequence = Number(match[1]);
  return Number.isInteger(sequence) && sequence >= 1 && sequence <= 10;
}

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/user/login.html');
});

app.get('/user', (req, res) => {
  res.redirect('/user/login.html');
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/admin-login.html');
});

[
  ['/login.html', '/user/login.html'],
  ['/register.html', '/user/register.html'],
  ['/home.html', '/user/home.html'],
  ['/history.html', '/user/history.html'],
  ['/histroy.html', '/user/histroy.html'],
  ['/help.html', '/user/help.html'],
  ['/karnatakaNews.html', '/user/karnatakaNews.html'],
  ['/applicationView.html', '/user/applicationView.html'],
  ['/admin-login.html', '/admin/admin-login.html'],
  ['/admin-register.html', '/admin/admin-register.html'],
  ['/admin-dashboard.html', '/admin/admin-dashboard.html'],
  ['/admin-application.html', '/admin/admin-application.html'],
].forEach(([from, to]) => {
  app.get(from, (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(`${to}${query}`);
  });
});

[
  'aadhar',
  'pan',
  'passport',
  'voterid',
  'birthcertificate',
  'drivinglicense',
  'ration',
  'casteincome',
].forEach(section => {
  app.get(`/${section}/:page`, (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(`/user/${section}/${req.params.page}${query}`);
  });
});

// ----- API endpoints -------------------------------------------------

const OTP_TTL_MS = 5 * 60 * 1000;
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const adminSessions = new Map();

function sanitizeAdmin(adminRow) {
  return {
    id: adminRow.id,
    username: adminRow.username,
    full_name: adminRow.full_name,
    email: adminRow.email,
    designation: adminRow.designation,
    department: adminRow.department,
    office_name: adminRow.office_name,
  };
}

function issueAdminSession(adminRow) {
  const token = crypto.randomBytes(24).toString('hex');
  adminSessions.set(token, {
    admin: sanitizeAdmin(adminRow),
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS,
  });
  return token;
}

function readAdminSession(token) {
  const key = String(token || '').trim();
  if (!key) return null;
  const session = adminSessions.get(key);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(key);
    return null;
  }
  return session;
}

function requireAdminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  const session = readAdminSession(token);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Admin authorization required' });
  }
  req.adminSession = session;
  next();
}

function buildApplicationTypeConfig() {
  return {
    aadhaar: { table: 'aadhaar_applications' },
    pan: { table: 'pan_applications' },
    passport: { table: 'passport_applications' },
    voterid: { table: 'voterid_applications' },
    birthcertificate: { table: 'birthcertificate_applications' },
    driving: { table: 'driving_applications' },
    ration: { table: 'rationcard_applications' },
    casteincome: { table: 'casteincome_applications' },
  };
}

function loadApplicationRecord(applicationNumber, requestedType) {
  return new Promise((resolve, reject) => {
    const historySql = `
      SELECT
        application_number,
        applicant_name,
        application_type,
        application_date,
        status,
        reviewed_by,
        reviewer_name,
        reviewer_designation,
        review_notes,
        review_checklist_json,
        reviewed_at
      FROM applications_history
      WHERE application_number = ?
      LIMIT 1
    `;

    db.query(historySql, [applicationNumber], (historyErr, historyRows) => {
      if (historyErr) {
        return reject(historyErr);
      }
      if (!historyRows.length) {
        return resolve(null);
      }

      const history = historyRows[0];
      let checklist = [];
      try {
        checklist = JSON.parse(history.review_checklist_json || '[]');
      } catch (e) {
        checklist = [];
      }

      const type = String(requestedType || history.application_type || '').trim().toLowerCase();
      const config = buildApplicationTypeConfig()[type];
      if (!config) {
        history.review_checklist = checklist;
        delete history.review_checklist_json;
        return resolve({ application: history, details: null });
      }

      const detailSql = `SELECT * FROM ${config.table} WHERE application_number = ? LIMIT 1`;
      db.query(detailSql, [applicationNumber], (detailErr, detailRows) => {
        if (detailErr) {
          return reject(detailErr);
        }
        history.review_checklist = checklist;
        delete history.review_checklist_json;
        resolve({
          application: history,
          details: detailRows.length ? detailRows[0] : null,
        });
      });
    });
  });
}

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpKey(mode, username, email) {
  const base = String(username || '').trim().toLowerCase();
  if (mode === 'register') {
    return `${base}|${String(email || '').trim().toLowerCase()}`;
  }
  return base;
}

function saveOtp(mode, key, payload) {
  const otp = makeOtp();
  const now = Date.now();
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO otp_codes (mode, otp_key, otp_code, payload_json, attempts, expires_at)
      VALUES (?, ?, ?, ?, 0, ?)
      ON DUPLICATE KEY UPDATE
        otp_code = VALUES(otp_code),
        payload_json = VALUES(payload_json),
        attempts = 0,
        expires_at = VALUES(expires_at)
    `;
    db.query(sql, [mode, key, otp, JSON.stringify(payload || {}), now + OTP_TTL_MS], err => {
      if (err) return reject(err);
      resolve(otp);
    });
  });
}

function verifyOtp(mode, key, otp) {
  return new Promise(resolve => {
    db.query(
      'SELECT id, otp_code, payload_json, attempts, expires_at FROM otp_codes WHERE mode = ? AND otp_key = ? LIMIT 1',
      [mode, key],
      (err, rows) => {
        if (err) {
          console.error('OTP lookup failed:', err);
          resolve({ ok: false, message: 'OTP verification failed due to a database error.' });
          return;
        }

        if (!rows.length) {
          resolve({ ok: false, message: 'OTP not requested. Please request OTP first.' });
          return;
        }

        const entry = rows[0];
        if (Date.now() > Number(entry.expires_at || 0)) {
          db.query('DELETE FROM otp_codes WHERE id = ?', [entry.id], () => {});
          resolve({ ok: false, message: 'OTP expired. Please request a new OTP.' });
          return;
        }

        if (String(entry.otp_code) !== String(otp || '').trim()) {
          const nextAttempts = Number(entry.attempts || 0) + 1;
          if (nextAttempts >= 5) {
            db.query('DELETE FROM otp_codes WHERE id = ?', [entry.id], () => {});
          } else {
            db.query('UPDATE otp_codes SET attempts = ? WHERE id = ?', [nextAttempts, entry.id], () => {});
          }
          resolve({ ok: false, message: 'Invalid OTP.' });
          return;
        }

        db.query('DELETE FROM otp_codes WHERE id = ?', [entry.id], () => {});

        let payload = {};
        try {
          payload = JSON.parse(entry.payload_json || '{}');
        } catch (e) {
          payload = {};
        }

        resolve({ ok: true, payload });
      }
    );
  });
}

function deleteOtp(mode, key) {
  db.query('DELETE FROM otp_codes WHERE mode = ? AND otp_key = ?', [mode, key], () => {});
}

function normalizeIndianMobile(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return '';
}

function normalizeFaceAngle(value) {
  return String(value || '').trim().toLowerCase().slice(0, 50);
}

function getUploadedFaceSamples(req) {
  const files = Array.isArray(req.files)
    ? req.files.filter(file => file && (file.fieldname === 'facePhotos' || file.fieldname === 'facePhoto'))
    : req.file
      ? [req.file]
      : [];
  const rawAngles = Array.isArray(req.body.faceAngles)
    ? req.body.faceAngles
    : req.body.faceAngles
      ? [req.body.faceAngles]
      : [];
  const rawSignatures = Array.isArray(req.body.faceSignatures)
    ? req.body.faceSignatures
    : req.body.faceSignatures
      ? [req.body.faceSignatures]
      : [];

  return files
    .map((file, index) => ({
      angle: normalizeFaceAngle(rawAngles[index] || file.originalname || `sample-${index + 1}`),
      buffer: file.buffer,
      signature: rawSignatures[index] || null,
    }))
    .filter(sample => sample.buffer);
}

function getVerificationPhotos(req) {
  const files = Array.isArray(req.files)
    ? req.files.filter(file => file && (file.fieldname === 'photos' || file.fieldname === 'photo'))
    : req.file
      ? [req.file]
      : [];
  const rawSignatures = Array.isArray(req.body.faceSignatures)
    ? req.body.faceSignatures
    : req.body.faceSignatures
      ? [req.body.faceSignatures]
      : [];

  return files
    .map((file, index) => ({
      frame: index + 1,
      buffer: file.buffer,
      signature: rawSignatures[index] || null,
    }))
    .filter(photo => photo.buffer);
}

function insertUserFaceSamples(userId, faceSamples) {
  return new Promise(resolve => {
    if (!userId || !Array.isArray(faceSamples) || !faceSamples.length) {
      resolve();
      return;
    }

    const values = faceSamples.map(sample => [userId, sample.angle || null, sample.buffer, sample.signature || null]);
    db.query(
      'INSERT INTO user_face_samples (user_id, angle_label, image_data, face_signature) VALUES ?',
      [values],
      err => {
        if (err) {
          console.error('Failed to save face samples:', err.message);
        }
        resolve();
      }
    );
  });
}

function parseSignature(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const values = Array.isArray(parsed)
      ? parsed
      : (parsed && Array.isArray(parsed.signature) ? parsed.signature : null);
    if (!Array.isArray(values) || !values.length) return null;
    return values.map(value => Number(value)).filter(value => Number.isFinite(value));
  } catch (error) {
    return null;
  }
}

function parseFaceProfile(raw) {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    const centroid = parseSignature(parsed.centroid);
    const samples = Array.isArray(parsed.samples)
      ? parsed.samples
          .map(sample => ({
            pose: String(sample.pose || 'neutral'),
            sequence: Number(sample.sequence || 0),
            embedding: parseSignature(sample.embedding),
          }))
          .filter(sample => sample.embedding && sample.embedding.length)
      : [];

    return {
      version: Number(parsed.version || 0),
      engine: String(parsed.engine || 'unknown'),
      sample_count: Number(parsed.sample_count || samples.length || 0),
      centroid,
      samples,
    };
  } catch (error) {
    return null;
  }
}

function compareFaceProfiles(storedProfile, liveProfile) {
  if (!storedProfile || !liveProfile) return null;
  const storedSamples = Array.isArray(storedProfile.samples) && storedProfile.samples.length
    ? storedProfile.samples
    : (storedProfile.centroid ? [{ pose: 'centroid', embedding: storedProfile.centroid }] : []);
  const liveSamples = Array.isArray(liveProfile.samples) && liveProfile.samples.length
    ? liveProfile.samples
    : (liveProfile.centroid ? [{ pose: 'live-centroid', embedding: liveProfile.centroid }] : []);

  if (!storedSamples.length || !liveSamples.length) return null;

  const liveScores = [];
  let bestPair = null;
  for (const liveSample of liveSamples) {
    let bestForLive = null;
    for (const storedSample of storedSamples) {
      const similarity = cosineSimilarity(storedSample.embedding, liveSample.embedding);
      if (!bestForLive || similarity > bestForLive.similarity) {
        bestForLive = {
          similarity,
          storedPose: storedSample.pose || 'stored',
          livePose: liveSample.pose || 'live'
        };
      }
    }
    if (bestForLive) {
      liveScores.push(bestForLive.similarity);
      if (!bestPair || bestForLive.similarity > bestPair.similarity) {
        bestPair = bestForLive;
      }
    }
  }

  const centroidSimilarity = cosineSimilarity(storedProfile.centroid, liveProfile.centroid);
  const averageBest = liveScores.length
    ? liveScores.reduce((sum, value) => sum + value, 0) / liveScores.length
    : 0;
  const combinedScore = ((averageBest * 0.75) + (centroidSimilarity * 0.25)) * 100;

  return {
    confidence: combinedScore,
    matched_angle: bestPair ? bestPair.storedPose : 'centroid',
    live_pose: bestPair ? bestPair.livePose : 'live',
    mode: 'tensorflow-profile'
  };
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function hasConfiguredAwsCredentials() {
  const accessKey = String(process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretKey = String(process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  const invalidAccess = !accessKey || accessKey === 'your_aws_access_key_here';
  const invalidSecret = !secretKey || secretKey === 'your_aws_secret_access_key_here';
  return !(invalidAccess || invalidSecret);
}

function postJson(url, headers, jsonBody) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(jsonBody);

    const req = https.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        path: parsed.pathname + (parsed.search || ''),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...headers,
        },
      },
      res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          if ((res.statusCode || 500) >= 400) {
            return reject(new Error(`SMS provider HTTP ${res.statusCode}`));
          }
          resolve(data);
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('SMS provider timeout')));
    req.write(body);
    req.end();
  });
}

async function sendOtpSms(mobile, otp) {
  const authKey = String(process.env.MSG91_AUTH_KEY || '').trim();
  const isPlaceholder = authKey === 'your_msg91_auth_key_here';
  if (!authKey || isPlaceholder) {
    return { mode: 'demo' };
  }
  const senderId = String(process.env.MSG91_SENDER_ID || 'JANASE').trim();
  const route = String(process.env.MSG91_ROUTE || '4').trim();
  const dltTemplateId = String(process.env.MSG91_DLT_TE_ID || '').trim();
  const message = `Your OTP for registration is ${otp}. It is valid for 5 minutes.`;

  const payload = {
    sender: senderId,
    route,
    country: '91',
    sms: [{ message, to: [mobile] }],
  };
  if (dltTemplateId) {
    payload.DLT_TE_ID = dltTemplateId;
  }

  const raw = await postJson(
    'https://api.msg91.com/api/v2/sendsms',
    {
      authkey: authKey,
      accept: 'application/json',
    },
    payload
  );

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // ignore parse failure and rely on raw response check
  }

  if (parsed && parsed.type && String(parsed.type).toLowerCase() === 'error') {
    const providerMessage = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    throw new Error(providerMessage || 'SMS provider rejected the request');
  }

  return { mode: 'sms' };
}

// Face verification endpoint
app.post('/api/verify-face', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const rekognition = new AWS.Rekognition();
    const photoBuffer = req.file.buffer;
    
    // For now, we'll implement a basic face detection
    // In production, you'd compare with stored photos
    const detectParams = {
      Image: {
        Bytes: photoBuffer
      },
      Attributes: ['ALL']
    };

    const result = await rekognition.detectFaces(detectParams).promise();
    
    if (result.FaceDetails && result.FaceDetails.length > 0) {
      const face = result.FaceDetails[0];
      const confidence = face.Confidence;
      
      // Simple verification: check if face is detected with high confidence
      const isVerified = confidence > 80;
      
      // Update user table if userId provided
      if (req.body.userId) {
        db.query('UPDATE users SET face_verified = ? WHERE id = ?', 
          [isVerified, req.body.userId], (err) => {
            if (err) console.error('Failed to update face verification status:', err.message);
          });
      }
      
      res.json({ 
        verified: isVerified, 
        confidence: confidence,
        message: isVerified ? 'Face verified successfully' : 'Face verification failed - low confidence'
      });
    } else {
      res.json({ 
        verified: false, 
        confidence: 0,
        message: 'No face detected in the image'
      });
    }
    
  } catch (error) {
    console.error('Face verification error:', error);
    if (error.code === 'InvalidAccessKeyId' || error.code === 'SignatureDoesNotMatch') {
      res.json({ 
        verified: true, 
        confidence: 95.0,
        message: 'Face verified (demo mode - AWS not configured)'
      });
    } else {
      res.status(500).json({ error: 'Face verification service unavailable' });
    }
  }
});

// 1. request OTP for registration
app.post('/api/register/request-otp', upload.any(), async (req, res) => {
  const { name, username, email, phone, address, password, faceProfile } = req.body;
  if (!name || !username || !password || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Name, username, email, phone and password are required' });
  }

  const mobile = normalizeIndianMobile(phone);
  if (!mobile) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit mobile number' });
  }

  // Store face data temporarily
  let faceData = null;
  let faceEmbedding = null;
  const faceSamples = getUploadedFaceSamples(req);
  const parsedFaceProfile = parseFaceProfile(faceProfile);

  if (faceSamples.length) {
    faceData = faceSamples[0].buffer;
  }

  if (parsedFaceProfile) {
    faceEmbedding = JSON.stringify(parsedFaceProfile);
  } else if (faceSamples.length) {
    try {
      if (hasConfiguredAwsCredentials()) {
        const rekognition = new AWS.Rekognition();
        const detectParams = {
          Image: { Bytes: faceData },
          Attributes: ['ALL']
        };

        const result = await rekognition.detectFaces(detectParams).promise();
        if (result.FaceDetails && result.FaceDetails.length > 0) {
          faceEmbedding = JSON.stringify({
            version: 2,
            sample_count: faceSamples.length,
            primary_angle: faceSamples[0].angle,
            primary_face_details: result.FaceDetails[0]
          });
        }
      }
    } catch (error) {
      console.error('Face processing failed:', error.message);
    }
  }

  const checkSql = 'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1';
  db.query(checkSql, [username, email], (err, rows) => {
    if (err) {
      console.error('DB error during registration otp request', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (rows.length) {
      return res.status(409).json({ success: false, message: 'Username or email already exists.' });
    }

    const key = otpKey('register', username, email);
    saveOtp('register', key, { name, username, email, phone: mobile, address, password, faceData, faceEmbedding, faceSamples })
      .then(otp => {
        return sendOtpSms(mobile, otp).then(result => ({ otp, result }));
      })
      .then(({ otp, result }) => {
        const mode = result && result.mode ? result.mode : 'sms';
        return res.json({
          success: true,
          message: mode === 'demo' ? 'OTP generated in demo mode.' : 'OTP sent to your mobile number.',
          delivery_mode: mode,
          otp: mode === 'demo' ? otp : undefined,
          expires_in_seconds: Math.floor(OTP_TTL_MS / 1000),
        });
      })
      .catch(sendErr => {
        deleteOtp('register', key);
        console.error('Failed to create/send registration OTP:', sendErr.message);
        return res.status(502).json({
          success: false,
          message: 'Failed to send OTP SMS. Please try again.',
          error: sendErr.message,
        });
      });
  });
});

// 2. verify OTP and create account
app.post('/api/register/verify-otp', async (req, res) => {
  const { username, email, otp } = req.body;
  const key = otpKey('register', username, email);
  const check = await verifyOtp('register', key, otp);
  if (!check.ok) {
    return res.status(400).json({ success: false, message: check.message });
  }

  try {
    const { name, phone, address, password, faceData, faceEmbedding, faceSamples } = check.payload;
    const hash = await bcrypt.hash(password, 10);
    
    let sql, params;
    if (faceData && faceEmbedding) {
      sql = 'INSERT INTO users (name, username, email, phone, address, password_hash, face_verified, face_data, face_embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      params = [name, username, email, phone, address, hash, true, faceData, faceEmbedding];
    } else {
      sql = 'INSERT INTO users (name, username, email, phone, address, password_hash) VALUES (?, ?, ?, ?, ?, ?)';
      params = [name, username, email, phone, address, hash];
    }
    db.query(sql, params, async (err, result) => {
      if (err) {
        console.error('DB error during registration', err);
        let errorMsg = 'Database error';
        if (err.code === 'ER_DUP_ENTRY') {
          errorMsg = 'Username already exists. Please choose another.';
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR') {
          errorMsg = 'Database connection failed. Please ensure MySQL is running and the database is created.';
        } else {
          errorMsg = err.message || 'Database error occurred';
        }
        return res.status(500).json({ success: false, message: errorMsg, error: err.message });
      }
      await insertUserFaceSamples(result.insertId, faceSamples);
      return res.json({ success: true, id: result.insertId });
    });
  } catch (e) {
    console.error('Hashing error', e);
    return res.status(500).json({ success: false, message: 'Registration failed: ' + (e.message || 'Unknown error') });
  }
});

app.post('/api/admin/register', upload.any(), async (req, res) => {
  const { employee_id, full_name, email, designation, department, office_name, password, faceProfile } = req.body;
  const normalizedEmployeeId = normalizeAdminEmployeeId(employee_id);
  const username = normalizedEmployeeId;

  if (!normalizedEmployeeId || !full_name || !email || !designation || !department || !office_name || !password) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID, full name, email, designation, department, office name and password are required'
    });
  }

  if (!isAllowedAdminEmployeeId(normalizedEmployeeId)) {
    return res.status(403).json({
      success: false,
      message: 'Only employees with Employee ID from JSKAR202601 to JSKAR202610 can create an admin account'
    });
  }

  const faceSamples = getUploadedFaceSamples(req);
  const parsedFaceProfile = parseFaceProfile(faceProfile);
  if (!parsedFaceProfile || !faceSamples.length || faceSamples.length < 12) {
    return res.status(400).json({
      success: false,
      message: 'Admin face enrollment is required with at least 12 clear face samples'
    });
  }

  const faceData = faceSamples[0].buffer;
  const faceEmbedding = JSON.stringify(parsedFaceProfile);
  const checkSql = 'SELECT id FROM admin_users WHERE employee_id = ? OR username = ? OR email = ? LIMIT 1';

  db.query(checkSql, [normalizedEmployeeId, username, email], async (err, rows) => {
    if (err) {
      console.error('Admin registration lookup failed', err);
      return res.status(500).json({ success: false, message: 'Unable to process admin registration' });
    }
    if (rows.length) {
      return res.status(409).json({ success: false, message: 'Employee ID or email already exists' });
    }

    try {
      const hash = await bcrypt.hash(password, 10);
      db.query(
        `INSERT INTO admin_users
          (employee_id, username, password_hash, full_name, email, designation, department, office_name, face_verified, face_data, face_embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [normalizedEmployeeId, username, hash, full_name, email, designation, department, office_name, true, faceData, faceEmbedding],
        (insertErr, result) => {
          if (insertErr) {
            console.error('Admin registration insert failed', insertErr);
            return res.status(500).json({ success: false, message: 'Unable to create admin account' });
          }
          return res.json({ success: true, id: result.insertId, message: 'Admin account registered successfully' });
        }
      );
    } catch (hashErr) {
      console.error('Admin registration hash failed', hashErr);
      return res.status(500).json({ success: false, message: 'Unable to create admin account' });
    }
  });
});

app.post('/api/admin/verify-face', upload.any(), async (req, res) => {
  try {
    const verificationPhotos = getVerificationPhotos(req);
    const { username, faceProfile } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Admin username required' });
    }
    if (!verificationPhotos.length && !faceProfile) {
      return res.status(400).json({ error: 'No face profile or photo provided' });
    }

    db.query(
      'SELECT id, face_data, face_embedding FROM admin_users WHERE username = ? AND face_verified = true LIMIT 1',
      [username],
      (err, results) => {
        if (err) {
          console.error('Admin face fetch failed:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!results.length || (!results[0].face_data && !results[0].face_embedding)) {
          return res.status(400).json({ verified: false, message: 'No face data registered for this admin account' });
        }

        const admin = results[0];
        const storedProfile = parseFaceProfile(admin.face_embedding);
        const liveProfile = parseFaceProfile(faceProfile);
        if (storedProfile && liveProfile) {
          const profileResult = compareFaceProfiles(storedProfile, liveProfile);
          if (profileResult) {
            const verified = profileResult.confidence >= 84;
            return res.json({
              verified,
              confidence: profileResult.confidence,
              matched_angle: profileResult.matched_angle,
              mode: profileResult.mode,
              message: verified ? 'Admin face verified successfully' : 'Face similarity below threshold'
            });
          }
        }

        const storedSignature = parseSignature(storedProfile ? storedProfile.centroid : admin.face_embedding);
        let bestConfidence = 0;
        verificationPhotos.forEach(photo => {
          const similarity = cosineSimilarity(storedSignature, parseSignature(photo.signature));
          if ((similarity * 100) > bestConfidence) {
            bestConfidence = similarity * 100;
          }
        });

        return res.json({
          verified: bestConfidence >= 92,
          confidence: bestConfidence,
          mode: 'signature',
          message: bestConfidence >= 92 ? 'Admin face verified successfully' : 'Face similarity below acceptance threshold'
        });
      }
    );
  } catch (error) {
    console.error('Admin face verification error:', error);
    return res.status(500).json({ error: 'Face verification service unavailable' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Admin username and password are required' });
  }

  db.query('SELECT * FROM admin_users WHERE username = ? LIMIT 1', [username], async (err, rows) => {
    if (err) {
      console.error('Admin login lookup failed', err);
      return res.status(500).json({ success: false, message: 'Unable to process admin login' });
    }
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const admin = rows[0];
    try {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
      }

      const token = issueAdminSession(admin);
      return res.json({
        success: true,
        token,
        admin: sanitizeAdmin(admin),
        session_expires_in_seconds: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
      });
    } catch (compareErr) {
      console.error('Admin login compare failed', compareErr);
      return res.status(500).json({ success: false, message: 'Unable to process admin login' });
    }
  });
});

app.get('/api/admin/session', requireAdminAuth, (req, res) => {
  res.json({ success: true, admin: req.adminSession.admin });
});

app.get('/api/admin/dashboard/summary', requireAdminAuth, (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN application_date = CURDATE() THEN 1 ELSE 0 END) AS today_count
    FROM applications_history
  `;

  db.query(sql, [], (err, rows) => {
    if (err) {
      console.error('Admin dashboard summary failed', err);
      return res.status(500).json({ success: false, message: 'Unable to load dashboard summary' });
    }
    const row = rows[0] || {};
    return res.json({
      success: true,
      summary: {
        total: Number(row.total || 0),
        pending_count: Number(row.pending_count || 0),
        approved_count: Number(row.approved_count || 0),
        rejected_count: Number(row.rejected_count || 0),
        today_count: Number(row.today_count || 0),
      },
      admin: req.adminSession.admin,
    });
  });
});

app.get('/api/admin/applications', requireAdminAuth, (req, res) => {
  const status = String(req.query.status || '').trim();
  const type = String(req.query.type || '').trim().toLowerCase();
  const search = String(req.query.search || '').trim();

  const filters = [];
  const values = [];

  if (status) {
    filters.push('status = ?');
    values.push(status);
  }
  if (type) {
    filters.push('LOWER(application_type) = ?');
    values.push(type);
  }
  if (search) {
    filters.push('(application_number LIKE ? OR applicant_name LIKE ? OR application_type LIKE ?)');
    const like = `%${search}%`;
    values.push(like, like, like);
  }

  const sql = `
    SELECT
      application_number,
      applicant_name,
      application_type,
      application_date,
      status,
      reviewed_by,
      reviewer_name,
      reviewer_designation,
      reviewed_at
    FROM applications_history
    ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
    ORDER BY
      CASE WHEN status = 'Pending' THEN 0 ELSE 1 END,
      application_date DESC,
      id DESC
  `;

  db.query(sql, values, (err, rows) => {
    if (err) {
      console.error('Admin applications listing failed', err);
      return res.status(500).json({ success: false, message: 'Unable to load applications' });
    }
    return res.json({ success: true, applications: rows });
  });
});

app.get('/api/admin/applications/:applicationNumber', requireAdminAuth, async (req, res) => {
  const applicationNumber = String(req.params.applicationNumber || '').trim();
  const requestedType = String(req.query.type || '').trim().toLowerCase();

  if (!applicationNumber) {
    return res.status(400).json({ success: false, message: 'Application number is required' });
  }

  try {
    const record = await loadApplicationRecord(applicationNumber, requestedType);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    return res.json({ success: true, ...record });
  } catch (error) {
    console.error('Admin application detail failed', error);
    return res.status(500).json({ success: false, message: 'Unable to load application details' });
  }
});

app.post('/api/admin/applications/:applicationNumber/review', requireAdminAuth, (req, res) => {
  const applicationNumber = String(req.params.applicationNumber || '').trim();
  const nextStatus = String(req.body.status || '').trim();
  const reviewNotes = String(req.body.review_notes || '').trim();
  const checklist = Array.isArray(req.body.review_checklist) ? req.body.review_checklist : [];
  const validStatuses = new Set(['Pending', 'Approved', 'Rejected']);

  if (!applicationNumber) {
    return res.status(400).json({ success: false, message: 'Application number is required' });
  }
  if (!validStatuses.has(nextStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid review status' });
  }
  if (!reviewNotes) {
    return res.status(400).json({ success: false, message: 'Review remarks are required' });
  }

  const admin = req.adminSession.admin;
  const safeChecklist = checklist
    .map(item => ({
      label: String(item.label || '').trim(),
      checked: Boolean(item.checked),
    }))
    .filter(item => item.label);

  const sql = `
    UPDATE applications_history
    SET
      status = ?,
      reviewed_by = ?,
      reviewer_name = ?,
      reviewer_designation = ?,
      review_notes = ?,
      review_checklist_json = ?,
      reviewed_at = CURRENT_TIMESTAMP
    WHERE application_number = ?
  `;

  db.query(
    sql,
    [
      nextStatus,
      admin.username,
      admin.full_name,
      admin.designation,
      reviewNotes,
      JSON.stringify(safeChecklist),
      applicationNumber,
    ],
    (err, result) => {
      if (err) {
        console.error('Application review update failed', err);
        return res.status(500).json({ success: false, message: 'Unable to save review decision' });
      }
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      return res.json({
        success: true,
        message: 'Review decision saved successfully',
        reviewed_by: admin.username,
      });
    }
  );
});

// 3. request OTP for login
app.post('/api/login/request-otp', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('DB error during login', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const key = otpKey('login', username);
    try {
      const otp = await saveOtp('login', key, {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      });
      return res.json({
        success: true,
        message: 'OTP generated. Verify to login.',
        otp,
        expires_in_seconds: Math.floor(OTP_TTL_MS / 1000),
      });
    } catch (otpErr) {
      console.error('Failed to store login OTP', otpErr);
      return res.status(500).json({ success: false, message: 'Unable to generate OTP' });
    }
  });
});

// standard login without OTP
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('DB error during login', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  });
});

// 4. verify OTP and login
app.post('/api/login/verify-otp', (req, res) => {
  const { username, otp } = req.body;
  const key = otpKey('login', username);
  verifyOtp('login', key, otp).then(check => {
  if (!check.ok) {
    return res.status(400).json({ success: false, message: check.message });
  }

    return res.json({ success: true, user: check.payload });
  });
});

// Face verification for login
app.post('/api/login/verify-face', upload.any(), async (req, res) => {
  try {
    const verificationPhotos = getVerificationPhotos(req);
    const { username, faceProfile } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    if (!verificationPhotos.length && !faceProfile) {
      return res.status(400).json({ error: 'No face profile or photo provided' });
    }

    // Get stored face data for user
    const sql = 'SELECT id, face_data, face_embedding FROM users WHERE username = ? AND face_verified = true';
    db.query(sql, [username], async (err, results) => {
      if (err) {
        console.error('DB error fetching face data:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0 || (!results[0].face_data && !results[0].face_embedding)) {
        return res.status(400).json({ verified: false, message: 'No face data registered for this user' });
      }

      const user = results[0];
      const storedProfile = parseFaceProfile(user.face_embedding);
      const liveProfile = parseFaceProfile(faceProfile);

      if (storedProfile && liveProfile) {
        const profileResult = compareFaceProfiles(storedProfile, liveProfile);
        if (profileResult) {
          const verified = profileResult.confidence >= 84;
          return res.json({
            verified,
            confidence: profileResult.confidence,
            matched_angle: profileResult.matched_angle,
            mode: profileResult.mode,
            message: verified ? 'Face verified successfully' : 'Face similarity below threshold'
          });
        }
      }

      try {
        const rekognition = hasConfiguredAwsCredentials() ? new AWS.Rekognition() : null;
        db.query(
          'SELECT angle_label, image_data, face_signature FROM user_face_samples WHERE user_id = ? ORDER BY id ASC',
          [user.id],
          async (sampleErr, sampleRows) => {
            if (sampleErr) {
              console.error('Face sample lookup failed:', sampleErr.message);
            }

            const sourceSamples = sampleRows && sampleRows.length
              ? sampleRows.map(row => ({ angle: row.angle_label, image: row.image_data, signature: parseSignature(row.face_signature) }))
              : [{ angle: 'front', image: user.face_data, signature: parseSignature(user.face_embedding) }];

            let bestMatch = null;
            const useAwsComparison = Boolean(rekognition);
            for (const sample of sourceSamples) {
              for (const livePhoto of verificationPhotos) {
                if (useAwsComparison) {
                  const compareParams = {
                    SourceImage: { Bytes: sample.image },
                    TargetImage: { Bytes: livePhoto.buffer },
                    SimilarityThreshold: 72
                  };

                  try {
                    const result = await rekognition.compareFaces(compareParams).promise();
                    if (result.FaceMatches && result.FaceMatches.length > 0) {
                      const match = result.FaceMatches[0];
                      if (!bestMatch || match.Similarity > bestMatch.confidence) {
                        bestMatch = {
                          confidence: match.Similarity,
                          angle: sample.angle || 'registered sample',
                          frame: livePhoto.frame,
                          mode: 'aws'
                        };
                      }
                    }
                    continue;
                  } catch (compareErr) {}
                }

                const storedSignature = parseSignature(sample.signature);
                const liveSignature = parseSignature(livePhoto.signature);
                const similarity = cosineSimilarity(storedSignature, liveSignature);
                if (!bestMatch || (similarity * 100) > bestMatch.confidence) {
                  bestMatch = {
                    confidence: similarity * 100,
                    angle: sample.angle || 'registered sample',
                    frame: livePhoto.frame,
                    mode: 'signature'
                  };
                }
              }
            }

            if (bestMatch) {
              const verified = bestMatch.mode === 'aws'
                ? bestMatch.confidence >= 78
                : bestMatch.confidence >= 92;
              return res.json({
                verified,
                confidence: bestMatch.confidence,
                matched_angle: bestMatch.angle,
                matched_frame: bestMatch.frame,
                message: verified ? 'Face verified successfully' : 'Face similarity below acceptance threshold',
                mode: bestMatch.mode
              });
            }

            return res.json({
              verified: false,
              confidence: 0,
              message: 'No matching face found'
            });
          }
        );
        return;
      } catch (error) {
        res.json({ 
          verified: true, 
          confidence: 95.0,
          message: 'Face verified (demo mode)'
        });
        return;
      }
    });
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ error: 'Face verification service unavailable' });
  }
});

// quick health endpoint
app.get('/api/health', (req, res) => res.json({ ok: true }));

// get applications history
app.get('/api/applications', (req, res) => {
  const sql = 'SELECT application_number, applicant_name, application_type, application_date, status FROM applications_history ORDER BY application_date DESC, id DESC';
  db.query(sql, [], (err, results) => {
    if (err) {
      console.error('DB error fetching applications', err);
      // Return empty array if DB is not available (fallback to localStorage on frontend)
      return res.json({ success: true, applications: [] });
    }
    res.json({ success: true, applications: results });
  });
});

app.get('/api/applications/:applicationNumber', (req, res) => {
  const applicationNumber = String(req.params.applicationNumber || '').trim();
  const requestedType = String(req.query.type || '').trim().toLowerCase();

  if (!applicationNumber) {
    return res.status(400).json({ success: false, message: 'Application number is required' });
  }

  loadApplicationRecord(applicationNumber, requestedType)
    .then(record => {
      if (!record) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }
      return res.json({ success: true, ...record });
    })
    .catch(error => {
      console.error('DB error fetching application details', error);
      return res.status(500).json({ success: false, message: 'Unable to load application details' });
    });
});

function fetchText(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
          'Accept-Language': 'en-IN,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      res => {
        const statusCode = res.statusCode || 0;
        const location = res.headers.location;

        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          location &&
          maxRedirects > 0
        ) {
          const nextUrl = new URL(location, url).toString();
          res.resume();
          return resolve(fetchText(nextUrl, maxRedirects - 1));
        }

        if (statusCode >= 400) {
          res.resume();
          return reject(new Error(`HTTP ${statusCode}`));
        }

        let raw = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          raw += chunk;
        });
        res.on('end', () => resolve(raw));
      }
    );

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function fetchBinary(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://vijaykarnataka.com/',
        },
      },
      res => {
        const statusCode = res.statusCode || 0;
        const location = res.headers.location;

        if ([301, 302, 303, 307, 308].includes(statusCode) && location && maxRedirects > 0) {
          const nextUrl = new URL(location, url).toString();
          res.resume();
          return resolve(fetchBinary(nextUrl, maxRedirects - 1));
        }

        if (statusCode >= 400) {
          res.resume();
          return reject(new Error(`HTTP ${statusCode}`));
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || 'image/jpeg',
          });
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timeout'));
    });
  });
}

function isBlockedHost(hostname) {
  const h = (hostname || '').toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.local')) return true;
  if (h === '127.0.0.1' || h === '::1') return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(h)) return true;
  return false;
}

function decodeHtmlEntities(text) {
  return (text || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(text) {
  return decodeHtmlEntities((text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function cleanText(text, maxLen) {
  const value = stripHtml(text);
  if (!maxLen || value.length <= maxLen) return value;
  return value.slice(0, maxLen - 3).trim() + '...';
}

function normalizeUrl(baseUrl, maybeUrl) {
  const value = (maybeUrl || '').trim();
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch (e) {
    return '';
  }
}

function getImageUrl(imageValue, baseUrl) {
  if (!imageValue) return '';
  if (typeof imageValue === 'string') return normalizeUrl(baseUrl, imageValue);
  if (Array.isArray(imageValue)) {
    for (const img of imageValue) {
      const resolved = getImageUrl(img, baseUrl);
      if (resolved) return resolved;
    }
    return '';
  }
  if (typeof imageValue === 'object') {
    return normalizeUrl(baseUrl, imageValue.url || imageValue.contentUrl || '');
  }
  return '';
}

function categoryFromText(title, summary) {
  const combined = `${title || ''} ${summary || ''}`.toLowerCase();
  if (/(scheme|yojana|grant|benefit|subsidy)/.test(combined)) return 'Scheme';
  if (/(rule|law|act|order|notification|guideline)/.test(combined)) return 'Rule';
  if (/(budget|tax|fare|price|economy|finance)/.test(combined)) return 'Economy';
  if (/(health|hospital|school|education|public)/.test(combined)) return 'Public Service';
  return 'Government Update';
}

function normalizeNewsItem(item, baseUrl) {
  const title = cleanText(item.title || item.headline || item.name || '', 180);
  const link = normalizeUrl(baseUrl, item.link || item.url || item.mainEntityOfPage || '');
  if (!title || !link) return null;

  const summary =
    cleanText(
      item.summary || item.description || item.abstract || item.articleBody || 'Open the article to read complete details.',
      260
    ) || 'Open the article to read complete details.';
  const pubDate = item.pubDate || item.datePublished || item.dateCreated || '';
  const image = getImageUrl(item.image, baseUrl);
  const source = item.source || 'vijaykarnataka.com';

  return {
    title,
    link,
    summary,
    pubDate,
    image,
    source,
    category: categoryFromText(title, summary),
  };
}

function extractFromJsonLd(html, baseUrl) {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const items = [];
  let match;

  function collect(node) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (typeof node !== 'object') return;
    if (node['@graph']) collect(node['@graph']);

    const nodeType = node['@type'];
    const typeString = Array.isArray(nodeType) ? nodeType.join(',') : String(nodeType || '');
    if (/NewsArticle|Article/i.test(typeString)) {
      const normalized = normalizeNewsItem(
        {
          title: node.headline || node.name,
          link: node.url || (node.mainEntityOfPage && node.mainEntityOfPage['@id']) || node.mainEntityOfPage,
          summary: node.description || node.articleBody,
          pubDate: node.datePublished || node.dateCreated,
          image: node.image,
          source: 'vijaykarnataka.com',
        },
        baseUrl
      );
      if (normalized) items.push(normalized);
    }
  }

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = (match[1] || '').trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      collect(parsed);
    } catch (e) {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return items;
}

function extractFromAnchors(html, baseUrl) {
  const results = [];
  const anchorRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = normalizeUrl(baseUrl, match[1]);
    const title = cleanText(match[2], 180);
    if (!href || !title) continue;
    if (!/vijaykarnataka\.com/i.test(href)) continue;
    if (!/(\/karnataka\/|\/news\/|\/state\/|\/bengaluru\/)/i.test(href)) continue;
    if (title.length < 25) continue;

    const normalized = normalizeNewsItem(
      {
        title,
        link: href,
        summary: 'Open the article to read complete details.',
        source: 'vijaykarnataka.com',
      },
      baseUrl
    );
    if (normalized) results.push(normalized);
    if (results.length >= 30) break;
  }

  return results;
}

function dedupeNews(items) {
  const seen = new Set();
  const deduped = [];
  for (const item of items) {
    const key = `${item.title}|${item.link}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

app.get('/api/karnataka-news', async (req, res) => {
  const sourceUrl = 'https://vijaykarnataka.com/#google_vignette';
  const crawlUrl = 'https://vijaykarnataka.com/';

  try {
    const html = await fetchText(crawlUrl);
    const jsonLdItems = extractFromJsonLd(html, crawlUrl);
    const anchorItems = extractFromAnchors(html, crawlUrl);
    const news = dedupeNews([...jsonLdItems, ...anchorItems]).slice(0, 12);

    return res.json({
      success: true,
      source: sourceUrl,
      fetched_at: new Date().toISOString(),
      news,
    });
  } catch (error) {
    console.error('Karnataka news fetch failed:', error.message);
    return res.status(502).json({
      success: false,
      source: sourceUrl,
      message: 'Unable to fetch news from source at the moment.',
      news: [],
    });
  }
});

app.get('/api/news-image', async (req, res) => {
  const imageUrl = String(req.query.url || '').trim();
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Missing image url' });
  }

  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid image url' });
  }

  if (!/^https?:$/i.test(parsed.protocol) || isBlockedHost(parsed.hostname)) {
    return res.status(400).json({ success: false, message: 'Blocked image host' });
  }

  try {
    const result = await fetchBinary(parsed.toString());
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(result.buffer);
  } catch (error) {
    return res.status(502).json({ success: false, message: 'Unable to fetch image' });
  }
});

// utility to generate application numbers
function makeAppNumber(prefix) {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix.toUpperCase()}${ts}${rand}`;
}

function normalizeChoiceValue(field, value) {
  if (typeof value !== 'string') return value;
  const choiceFields = new Set(['gender', 'marital_status', 'place_of_birth', 'licence_type']);
  if (!choiceFields.has(field)) return value;
  if (!value.includes('|')) return value.trim();
  return value.split('|').pop().trim();
}

// generic route for application submissions
app.post('/api/apply/:type', (req, res) => {
  const type = req.params.type.toLowerCase();
  // first insert into applications_history
  const appNo = makeAppNumber(type.slice(0,3));
  const historySql =
    'INSERT INTO applications_history (application_number, applicant_name, application_type, application_date, status) VALUES (?, ?, ?, CURDATE(), ?)';
  const applicantName = req.body.full_name || req.body.name || req.body.head_name || '';
    db.query(historySql, [appNo, applicantName, type, 'Pending'], err => {
      if (err) {
        console.error('history insert failed', err);
        let errorMsg = 'Database error';
        if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR') {
          errorMsg = 'Database connection failed. Please ensure MySQL is running and the database is created. Run database.sql to set up the database.';
        } else {
          errorMsg = err.message || 'Failed to save application';
        }
        return res.status(500).json({ success: false, message: errorMsg, error: err.message });
      }
    // build table-specific query
    let table, fields, placeholders;
    switch (type) {
      case 'aadhaar':
        table = 'aadhaar_applications';
        fields = [
          'application_number','full_name','father_or_husband_name','dob','gender','mobile','email',
          'addr_line1','locality','district','state','pin_code','identity_proof','address_proof','dob_proof','photo_path'
        ];
        break;
      case 'pan':
        table = 'pan_applications';
        fields = [
          'application_number','full_name','father_name','dob','aadhaar_number','mobile','email',
          'identity_proof','address_proof','dob_proof','photo_path','signature_path'
        ];
        break;
      case 'passport':
        table = 'passport_applications';
        fields = [
          'application_number','full_name','dob','gender','place_of_birth','father_name','mother_name','marital_status','spouse_name',
          'mobile','email','present_address','permanent_address','address_proof_type','identity_proof_path','dob_proof_path','photo_path','signature_path'
        ];
        break;
      case 'voterid':
        table = 'voterid_applications';
        fields = [
          'application_number','full_name','father_or_husband_name','dob','gender','mobile','email',
          'address_line1','locality','district','state','pin_code','identity_proof','age_proof','address_proof','photo_path'
        ];
        break;
      case 'birthcertificate':
        table = 'birthcertificate_applications';
        fields = [
          'application_number','child_name','dob','gender','place_of_birth','hospital_name','father_name','mother_name','parent_mobile','parent_email',
          'birth_proof','parent_id_proof','parent_address_proof','marriage_certificate_path'
        ];
        break;
      case 'driving':
        table = 'driving_applications';
        fields = [
          'application_number','full_name','father_name','dob','gender','mobile','email','address','licence_type','ll_number','ll_issue_date',
          'identity_proof_path','address_proof_path','age_proof_path','photo_path','medical_certificate_path'
        ];
        break;
      case 'ration':
        table = 'rationcard_applications';
        fields = [
          'application_number','head_name','phone','email','address','members_count','aadhaar_numbers','identity_proof','address_proof','income_certificate_path',
          'photos_path','bank_passbook_path','surrender_cert_path','caste_cert_path','disability_cert_path','age_proof_path'
        ];
        break;
      case 'casteincome':
        table = 'casteincome_applications';
        fields = [
          'application_number','cert_type','full_name','father_name','mother_name','dob','gender','religion','caste_name','sub_caste',
          'perm_address','present_address','mobile','email','occupation','annual_income','income_source','income_proof_path','identity_proof',
          'address_proof','dob_proof','caste_proof','photo_path','declaration'
        ];
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown application type' });
    }
    placeholders = fields.map(() => '?').join(',');
    const values = fields.map(f => normalizeChoiceValue(f, req.body[f]));
    const sql = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders})`;
    db.query(sql, [appNo, ...values.slice(1)], (err2, result) => {
      if (err2) {
        console.error('type insert failed', err2);
        let errorMsg = 'Database error';
        if (err2.code === 'ECONNREFUSED' || err2.code === 'ER_BAD_DB_ERROR') {
          errorMsg = 'Database connection failed. Please ensure MySQL is running and the database is created. Run database.sql to set up the database.';
        } else {
          errorMsg = err2.message || 'Failed to save application details';
        }
        return res.status(500).json({ success: false, message: errorMsg, error: err2.message });
      }
      res.json({ success: true, application_number: appNo });
    });
  });
});

// -------------------------------------------------------------

const basePort = Number(process.env.PORT) || 3000;
const maxPortAttempts = 10;

function startServer(port, attemptsLeft) {
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      return startServer(nextPort, attemptsLeft - 1);
    }

    if (err.code === 'EADDRINUSE') {
      console.error(
        `Could not start server: ports ${basePort} to ${basePort + maxPortAttempts} are in use.`
      );
    } else {
      console.error('Failed to start server:', err.message);
    }
    process.exit(1);
  });
}

startServer(basePort, maxPortAttempts);
runSchemaMigrations();
