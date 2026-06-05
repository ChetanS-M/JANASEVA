# Backend for GovSERVICE

This folder contains a Node/Express backend that connects to a MySQL database.

## Setup

1. Install Node.js (v14+).
2. Open a terminal in the `backend` directory and run:
   ```powershell
   npm install
   ```
3. Configure SMS OTP provider key for registration OTPs:
   - Create a `.env` file in `backend` (you can copy from `.env.example`).
   - Add:
     ```env
     MSG91_AUTH_KEY=your_msg91_auth_key_here
     MSG91_SENDER_ID=JANASE
     MSG91_ROUTE=4
     # Optional (recommended for India DLT compliance)
     # MSG91_DLT_TE_ID=your_dlt_template_id
     ```
4. Create a MySQL database and a users table:
   ```sql
   CREATE DATABASE govservice;
   USE govservice;

   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     username VARCHAR(255) NOT NULL UNIQUE,
     email VARCHAR(255),
     phone VARCHAR(20),
     address TEXT,
     password VARCHAR(255) NOT NULL
   );
   ```
   The connection configuration in `db.js` assumes the server is `localhost` with username `root` and password `root`.

5. Start the server:
   ```powershell
   npm start
   ```
   or, if you have `nodemon` installed:
   ```powershell
   npm run dev
   ```

## Endpoints

- `POST /api/register/request-otp` - sends registration OTP SMS to the submitted phone number.
- `POST /api/register/verify-otp` - verifies OTP and creates user account.
- `POST /api/login` - accepts `{ username, password }`, returns the user row when credentials match.
- `GET /api/health` - simple health check.
- `POST /api/apply/:type` - submit an application of a given type. Supported types:
  `aadhaar`, `pan`, `passport`, `voterid`, `birthcertificate`, `driving`, `ration`, `casteincome`.

  The route will automatically create a record in `applications_history` and insert the detailed row in the
  matching table. The request body should contain the fields defined in the respective table (see the SQL schema
  above). A JSON response includes `application_number`.

## Notes

- Frontend pages (e.g. `login.html`, `register.html`) are updated to post form data to these endpoints.
- CORS is enabled so you can serve the frontend from the file system or another server.
- Adjust database settings in `db.js` if your credentials or host differ.
