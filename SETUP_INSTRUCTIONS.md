# GovSERVICE Setup Instructions

## ✅ Completed
1. ✅ Backend server is running on `http://localhost:3000`
2. ✅ All frontend pages are connected to backend:
   - Login page → `/api/login`
   - Register page → `/api/register`
   - All service forms → `/api/apply/:type`
   - History page → `/api/applications`
3. ✅ Database schema file created: `database.sql`

## 📋 Next Steps - Database Setup

### 1. Install MySQL (if not already installed)
   - Download from: https://dev.mysql.com/downloads/mysql/
   - Install MySQL Server
   - Remember your root password

### 2. Create the Database
   Open MySQL Command Line or MySQL Workbench and run:

   ```sql
   -- Option 1: Run the entire SQL file
   source c:/Users/HP/OneDrive/Desktop/chetan/JanaSeva2026/database.sql;
   
   -- Option 2: Or copy-paste the contents of database.sql
   ```

### 3. Update Database Credentials (if needed)
   If your MySQL root password is not "root", edit `backend/db.js`:
   ```javascript
   password: 'your_mysql_password',
   ```

### 4. Test the Application
   1. Open `frontend/login.html` in your browser
   2. Register a new user or login
   3. Try submitting an application
   4. Check the History page to see applications from database

## 🔧 Backend Endpoints

- `GET /api/health` - Health check
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/applications` - Get all applications (for history page)
- `POST /api/apply/:type` - Submit application
  - Types: `aadhaar`, `pan`, `passport`, `voterid`, `birthcertificate`, `driving`, `ration`, `casteincome`

## 📁 Project Structure

```
JanaSeva2026/
├── backend/
│   ├── server.js          # Express server
│   ├── db.js              # MySQL connection
│   └── package.json       # Dependencies
├── frontend/
│   ├── login.html         # Login page (connected to backend)
│   ├── register.html      # Register page (connected to backend)
│   ├── home.html          # Home page
│   ├── histroy.html       # History page (connected to backend)
│   └── [service folders]/ # All service forms (connected to backend)
└── database.sql           # MySQL schema

```

## 🚀 Running the Application

1. **Backend** (already running):
   ```powershell
   cd backend
   npm start
   ```

2. **Frontend**:
   - Open `frontend/login.html` in your browser
   - Or use a local server:
     ```powershell
     cd frontend
     python -m http.server 8000
     # Then open: http://localhost:8000/login.html
     ```

## ⚠️ Important Notes

- The backend server is currently running in the background
- Make sure MySQL is running before using the application
- All forms will save to the database once MySQL is set up
- The history page fetches from the database (with localStorage fallback)
