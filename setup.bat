@echo off
echo 🚀 Setting up AgisFL - Federated Learning Intrusion Detection System
echo ==================================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+ first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.8+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Install Python dependencies
echo 🐍 Installing Python dependencies...
pip install flask flask-socketio psutil scapy pandas numpy scikit-learn

REM Install SQLite dependency
echo 💾 Installing SQLite support...
npm install better-sqlite3

REM Build the application
echo 🔨 Building application...
npm run build

REM Create start script
echo @echo off > start.bat
echo cd /d "%%~dp0" >> start.bat
echo echo Starting AgisFL... >> start.bat
echo start /min npm run dev >> start.bat
echo timeout /t 3 /nobreak ^>nul >> start.bat
echo echo AgisFL is running at http://localhost:5000 >> start.bat
echo echo Press any key to stop >> start.bat
echo pause >> start.bat

echo.
echo ✅ Installation completed successfully!
echo.
echo 🚀 To start AgisFL:
echo    start.bat
echo.
echo 🌐 Application will be available at: http://localhost:5000
echo.
pause