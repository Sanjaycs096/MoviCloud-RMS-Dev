@echo off
title MOVICLOUD RMS - Full Stack
echo.
echo  =============================================
echo   MOVICLOUD RMS - Starting All Services
echo  =============================================
echo.
echo  Starting unified backend and frontend:
echo.
echo   Frontend: http://localhost:5174
echo   Backend:  http://127.0.0.1:8000
echo.
echo   User App:  http://localhost:5174/
echo   Admin App: http://localhost:5174/admin
echo.
echo   User API:  http://127.0.0.1:8000/api
echo   Admin API: http://127.0.0.1:8000/api/admin
echo  =============================================
echo.

echo Starting backend in new window...
start "MOVICLOUD RMS - Backend" cmd /k "%~dp0start-backend.bat"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo Starting frontend in new window...
start "MOVICLOUD RMS - Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo =============================================
echo Two windows have been opened:
echo   1. Backend (Unified Starlette/Flask/FastAPI)
echo   2. Frontend (Vite - User + Admin)
echo.
echo Keep both windows open while using the application.
echo Close the windows or press Ctrl+C in each to stop.
echo.
echo Your browser will open at: http://localhost:5174
echo.
echo This window can be closed now.
echo =============================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5174

pause
