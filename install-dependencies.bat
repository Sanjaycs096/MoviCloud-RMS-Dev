@echo off
echo ========================================
echo   MOVICLOUD RMS - Install Dependencies
echo ========================================
echo.
echo This will install all required dependencies
echo for both Frontend and Backend.
echo.
pause

REM Get the directory where the batch file is located
set "SCRIPT_DIR=%~dp0"

echo.
echo ========================================
echo   Installing Frontend Dependencies
echo ========================================
echo.
cd /d "%SCRIPT_DIR%User_side"
echo Current directory: %CD%
echo.
echo Installing Node.js packages...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installing Backend Dependencies
echo ========================================
echo.
cd /d "%SCRIPT_DIR%Admin_side\backend"
echo Current directory: %CD%
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv\" (
    echo Creating Python virtual environment...
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
echo Installing Python packages...
py -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Frontend dependencies installed in: User_side\node_modules
echo Backend dependencies installed in: Admin_side\backend\venv
echo.
echo You can now run the application using:
echo   - start-all.bat (starts both frontend and backend)
echo   - start-frontend.bat (starts only frontend)
echo   - start-backend.bat (starts only backend)
echo.

pause
