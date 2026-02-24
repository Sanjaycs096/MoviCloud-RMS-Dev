@echo off
echo ========================================
echo   MOVICLOUD RMS - Starting Frontend
echo ========================================
echo.

cd /d "%~dp0User_side"

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

echo.
echo ========================================
echo   Starting Development Server...
echo ========================================
echo.
echo The application will open at:
echo http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
