@echo off
echo ========================================
echo   MOVICLOUD RMS - Starting Frontend
echo ========================================
echo.

cd /d "%~dp0User_side"

echo Writing correct local dev env variables...
(
echo VITE_API_BASE_URL=
echo VITE_API_URL=/api/admin
)> .env

echo Checking for node_modules...
if not exist "node_modules\" (
    echo.
    echo Node modules not found. Installing dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo Checking Admin dependencies...
if not exist "..\Admin_side\frontend\node_modules\" (
    echo.
    echo Installing Admin dependencies...
    call npm install --prefix ../Admin_side/frontend
)

echo.
echo ========================================
echo   Starting Development Server...
echo ========================================
echo.
echo User app will be available at:
echo http://localhost:5174
echo.
echo Admin app will be available at:
echo http://localhost:5174/admin
echo.
echo IMPORTANT: Make sure backend is running!
echo Run start-backend.bat in a separate window.
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev:frontend

pause
