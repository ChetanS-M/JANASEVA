const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'govservice',
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  acquireTimeout: 60000,
  connectTimeout: 60000,
});

pool.getConnection((err, connection) => {
  if (err) {
    if (err.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      console.error(
        'MySQL auth mode is not supported by the current setup. Install dependencies again and ensure mysql2 is used.'
      );
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('MySQL access denied. Check DB_USER / DB_PASSWORD in backend/db.js or environment.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('Database "govservice" not found. Create it and run your table schema SQL.');
    } else {
      console.error('Initial MySQL connection failed:', err.message);
    }
  } else {
    connection.release();
  }
});

pool.on('error', err => {
  console.error('MySQL pool error:', err.message);
});

module.exports = pool;
