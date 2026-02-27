@echo off
echo ========================================
echo   MOVICLOUD RMS - Starting Backend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking for Python virtual environment...
if not exist "backend\venv\" (
    echo.
    echo Virtual environment not found. Creating one...
    py -m venv backend\venv
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create virtual environment!
        echo Please ensure Python is installed and in PATH.
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call backend\venv\Scripts\activate.bat

echo.
echo Installing/Updating dependencies...
py -m pip install --upgrade pip
pip install -r backend\requirements.txt

echo.
echo ========================================
echo   Building Frontend (local mode)...
echo ========================================
echo.
cd User_side
if not exist "node_modules\" (
    echo Installing User_side npm dependencies...
    call npm install
)
if not exist "..\Admin_side\frontend\node_modules\" (
    echo Installing Admin_side npm dependencies...
    call npm install --prefix ../Admin_side/frontend
)
echo Building frontend with local API config (same-origin calls)...
set VITE_API_BASE_URL=
set VITE_API_URL=/api/admin
call npm run build
cd ..
echo Frontend built into User_side/dist

echo.
echo ========================================
echo   Starting Unified Backend Server...
echo ========================================
echo.
echo User API (Flask) will be available at:
echo http://127.0.0.1:5000/api
echo.
echo Admin API (FastAPI) will be available at:
echo http://127.0.0.1:8000/api/admin
echo http://127.0.0.1:8000/api/admin/docs
echo.
echo Press Ctrl+C to stop the server
echo.

py -m uvicorn server:app --reload --reload-dir . --host 127.0.0.1 --port 8000

pause
