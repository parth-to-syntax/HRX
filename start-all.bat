@echo off
echo ========================================
echo Face Recognition System - Quick Start
echo ========================================
echo.
echo This will start all three services:
echo 1. Python Face Recognition Service (port 5001)
echo 2. Node.js Backend (port 3000)
echo 3. React Frontend (port 5173)
echo.
pause

echo.
echo Starting services in separate windows...
echo.

REM Start Python service in new window
start "Python Face Service" cmd /k "cd python && venv\Scripts\activate && python faceRecognition.py"
timeout /t 2 /nobreak > nul

REM Start Node.js backend in new window
start "Node.js Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak > nul

REM Start React frontend in new window
start "React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Python Service: http://localhost:5001
echo Backend API:    http://localhost:3000
echo Frontend:       http://localhost:5173
echo.
echo Close this window to stop monitoring.
echo Close individual service windows to stop them.
echo.
pause
