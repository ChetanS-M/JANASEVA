@echo off
echo Starting GovSERVICE Server...
echo.
cd /d "%~dp0backend"
echo Starting backend server on http://localhost:3000
echo The login page will open automatically in your browser.
echo.
start http://localhost:3000
npm start
