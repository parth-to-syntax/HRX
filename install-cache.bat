@echo off
echo ========================================
echo Installing node-cache for caching...
echo ========================================
echo.

cd backend

echo Installing node-cache package...
call npm install node-cache

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start your server: npm start
echo 2. Test cache endpoints: 
echo    - GET http://localhost:5000/cache/stats
echo.
echo 3. Add caching to your controllers:
echo    - See CACHE_EXAMPLES.md for ready-to-use code
echo    - Start with leaveController.js (easiest)
echo.
echo 4. Monitor performance:
echo    - Check /cache/stats for hit rates
echo    - Expect 50-90%% faster response times
echo.
echo ========================================
echo Files created:
echo ========================================
echo - backend/utils/cache.js (cache utility)
echo - backend/routes/cache.js (cache endpoints)
echo - CACHE_QUICKSTART.md (implementation guide)
echo - CACHE_EXAMPLES.md (controller examples)
echo - CACHING_GUIDE.md (complete documentation)
echo.
pause
