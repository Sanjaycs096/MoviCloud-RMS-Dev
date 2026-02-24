@echo off
echo ========================================
echo   MOVICLOUD RMS - Starting Backend
echo ========================================
echo.

cd /d "%~dp0Admin_side\backend"

echo Checking for Python virtual environment...
if not exist "venv\" (
    echo.
    echo Virtual environment not found. Creating one...
    py -m venv venv
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create virtual environment!
        echo Please ensure Python is installed and in PATH.
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
py -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo ========================================
echo   Starting FastAPI Backend Server...
echo ========================================
echo.
echo API will be available at:
echo http://localhost:8000
echo.
echo API Documentation:
echo http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
