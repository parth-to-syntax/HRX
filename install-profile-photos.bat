@echo off
echo ========================================
echo Installing Profile Photo Dependencies
echo ========================================
echo.

cd backend

echo Installing multer for file uploads...
call npm install multer

echo.
echo Creating avatars directory...
if not exist "public\avatars" mkdir "public\avatars"

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start your backend: npm start
echo 2. Start your frontend: npm run dev
echo.
echo 3. Test profile photo upload:
echo    - Navigate to Profile page
echo    - Click camera icon on avatar
echo    - Upload an image
echo    - Photo should appear everywhere instantly!
echo.
echo 4. Verify persistence:
echo    - Refresh the page
echo    - Navigate to other pages
echo    - Check Navbar, Profile, and Directory
echo.
echo ========================================
echo Files created/updated:
echo ========================================
echo Backend:
echo - backend/routes/upload.js (upload endpoint)
echo - backend/public/avatars/ (storage folder)
echo - backend/index.js (registered routes)
echo.
echo Frontend:
echo - frontend/src/components/ui/UserAvatar.jsx (reusable component)
echo - frontend/src/api/upload.js (API calls)
echo - frontend/src/redux/slices/userSlice.js (avatar state)
echo - frontend/src/pages/ProfilePage.jsx (upload handler)
echo - frontend/src/components/layout/Navbar.jsx (display avatar)
echo.
echo Documentation:
echo - PROFILE_PHOTO_IMPLEMENTATION.md (complete guide)
echo.
pause
