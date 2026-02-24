@echo off
title User_side Backend (Flask :5000)
cd /d "%~dp0backend"

if not exist venv (
    echo Creating virtual environment...
    py -m venv venv
)

echo Installing dependencies...
call venv\Scripts\python.exe -m pip install --quiet -r requirements.txt

echo.
echo Starting User_side Flask backend on http://127.0.0.1:5000
echo.
venv\Scripts\python.exe -m flask --app app:create_app run --host=127.0.0.1 --port=5000 --debug
pause
