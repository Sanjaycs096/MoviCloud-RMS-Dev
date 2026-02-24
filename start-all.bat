@echo off
title MOVICLOUD RMS - Full Stack
echo.
echo  =============================================
echo   MOVICLOUD RMS - Starting All Services
echo  =============================================
echo.
echo  All 4 services start with ONE command:
echo.
echo   user frontend  -^> http://localhost:5174
echo   admin frontend -^> http://localhost:5175  (served at /admin)
echo   user backend   -^> http://127.0.0.1:5000
echo   admin backend  -^> http://127.0.0.1:8000
echo.
echo  Open your browser at: http://localhost:5174
echo  =============================================
echo.

cd /d "%~dp0"
npm run dev

pause

echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Two new windows have been opened:
echo   1. Backend (FastAPI) - Admin API
echo   2. Frontend (Vite) - User Interface
echo.
echo Keep both windows open while using the application.
echo Close the windows or press Ctrl+C in each to stop the servers.
echo.
echo This window can be closed.
echo.

pause
