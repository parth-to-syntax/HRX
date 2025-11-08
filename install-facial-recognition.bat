@echo off
echo ========================================
echo Facial Recognition System - Installation
echo ========================================
echo.

echo [1/4] Installing backend packages...
cd backend
call npm install cloudinary
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend packages
    pause
    exit /b 1
)
echo ✓ Backend packages installed
echo.

echo [2/4] Installing frontend packages...
cd ..\frontend
call npm install face-api.js @vladmandic/face-api
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend packages
    pause
    exit /b 1
)
echo ✓ Frontend packages installed
echo.

echo [3/4] Configuration check...
cd ..\backend
if not exist .env (
    echo WARNING: .env file not found!
    echo Please create backend\.env and add Cloudinary credentials
    echo See backend\.env.cloudinary.example for template
    echo.
) else (
    findstr /C:"CLOUDINARY_CLOUD_NAME" .env >nul
    if %errorlevel% neq 0 (
        echo WARNING: Cloudinary credentials not configured!
        echo Please add these to backend\.env:
        echo   CLOUDINARY_CLOUD_NAME=your_cloud_name
        echo   CLOUDINARY_API_KEY=your_api_key
        echo   CLOUDINARY_API_SECRET=your_api_secret
        echo.
    ) else (
        echo ✓ Cloudinary credentials found in .env
    )
)
echo.

echo [4/4] Database migration...
echo.
echo IMPORTANT: You need to run the database migration manually:
echo.
echo Option 1 - Using psql:
echo   psql -U your_username -d your_database -f backend\migrations\2025-11-09_facial_recognition.sql
echo.
echo Option 2 - Using database client:
echo   Open backend\migrations\2025-11-09_facial_recognition.sql
echo   Copy and paste SQL into pgAdmin/DBeaver/etc.
echo.

echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Configure Cloudinary credentials in backend\.env
echo 2. Run database migration (see above)
echo 3. Restart backend server: cd backend ^&^& npm run dev
echo 4. Follow integration guide in FACIAL_RECOGNITION_COMPLETE.md
echo.
echo Documentation:
echo - FACIAL_RECOGNITION_COMPLETE.md - Full guide
echo - FACIAL_RECOGNITION_SETUP.md - Setup instructions
echo.
pause
