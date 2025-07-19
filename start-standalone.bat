
@echo off
echo Starting AgisFL Federated Learning System...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
pip install flask flask-socketio psutil scapy pandas numpy scikit-learn

echo Building application...
call npm run build

echo Starting AgisFL...
echo.
echo Dashboard will be available at: http://localhost:5000
echo Default credentials: admin / password123
echo.

call npm start

pause
