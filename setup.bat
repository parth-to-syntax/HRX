@echo off
echo ========================================
echo HRX ODOO - Quick Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL is not installed!
    echo Please install PostgreSQL from https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo [OK] Prerequisites check passed
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist node_modules (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies
        pause
        exit /b 1
    )
)
echo [OK] Backend dependencies installed
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
if not exist node_modules (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)
echo [OK] Frontend dependencies installed
echo.

REM Check for .env files
cd ..\backend
if not exist .env (
    echo [WARNING] Backend .env file not found!
    echo Please create backend/.env file with database credentials
    echo See DEPLOYMENT_GUIDE.md for template
    echo.
)

cd ..\frontend
if not exist .env (
    echo [WARNING] Frontend .env file not found!
    echo Please create frontend/.env file with API URL
    echo See DEPLOYMENT_GUIDE.md for template
    echo.
)

cd ..

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Create .env files (if not done)
echo 2. Create database: CREATE DATABASE hrx_odoo;
echo 3. Run schema: psql -U postgres -d hrx_odoo -f backend/schema.sql
echo 4. Seed database: node backend/scripts/seedDatabase.js
echo 5. Start application: start-all.bat
echo.
echo See DEPLOYMENT_GUIDE.md for detailed instructions
echo.
pause
