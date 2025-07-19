@echo off
setlocal enabledelayedexpansion

REM AgisFL - Federated Learning Intrusion Detection System
REM Windows Installation Script

title AgisFL Setup - Enterprise-Grade FL-IDS

echo.
echo  ################################
echo  #  AgisFL - FL-IDS Setup       #
echo  #  Windows Installation        #
echo  ################################
echo.

REM Color definitions for Windows
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RED=%ESC%[31m"
set "GREEN=%ESC%[32m"
set "YELLOW=%ESC%[33m"
set "BLUE=%ESC%[34m"
set "PURPLE=%ESC%[35m"
set "CYAN=%ESC%[36m"
set "RESET=%ESC%[0m"

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%RESET% This script requires administrator privileges.
    echo Right-click on the batch file and select "Run as administrator"
    pause
    exit /b 1
)

echo %BLUE%[INFO]%RESET% Detected OS: Windows
echo %BLUE%[INFO]%RESET% Starting AgisFL installation...
echo.

REM Check for Python installation
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%RESET% Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
) else (
    python --version
    echo %GREEN%[SUCCESS]%RESET% Python found
)

REM Check for Node.js installation
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo %RED%[ERROR]%RESET% Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
) else (
    node --version
    npm --version
    echo %GREEN%[SUCCESS]%RESET% Node.js and npm found
)

echo.
echo %BLUE%[INFO]%RESET% Installing Python dependencies...

REM Create virtual environment
if not exist "venv" (
    echo %BLUE%[INFO]%RESET% Creating Python virtual environment...
    python -m venv venv
    if %errorLevel% neq 0 (
        echo %RED%[ERROR]%RESET% Failed to create virtual environment
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%RESET% Virtual environment created
) else (
    echo %YELLOW%[WARNING]%RESET% Virtual environment already exists
)

REM Activate virtual environment and install dependencies
echo %BLUE%[INFO]%RESET% Activating virtual environment...
call venv\Scripts\activate.bat

echo %BLUE%[INFO]%RESET% Upgrading pip...
python -m pip install --upgrade pip

REM Install core Python dependencies
echo %BLUE%[INFO]%RESET% Installing core Python dependencies...
pip install flask flask-socketio flask-cors pandas numpy scikit-learn psutil requests cryptography python-socketio eventlet

if exist "requirements.txt" (
    echo %BLUE%[INFO]%RESET% Installing additional dependencies from requirements.txt...
    pip install -r requirements.txt
)

echo %GREEN%[SUCCESS]%RESET% Python dependencies installed

echo.
echo %BLUE%[INFO]%RESET% Setting up Node.js environment...

REM Install frontend dependencies
if exist "client" (
    cd client
    echo %BLUE%[INFO]%RESET% Installing frontend dependencies...
    call npm install
    if %errorLevel% neq 0 (
        echo %RED%[ERROR]%RESET% Failed to install frontend dependencies
        cd ..
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%RESET% Frontend dependencies installed
    cd ..
)

REM Install root dependencies if package.json exists
if exist "package.json" (
    echo %BLUE%[INFO]%RESET% Installing root dependencies...
    call npm install
    if %errorLevel% neq 0 (
        echo %RED%[ERROR]%RESET% Failed to install root dependencies
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%RESET% Root dependencies installed
)

echo.
echo %BLUE%[INFO]%RESET% Creating necessary directories...

if not exist "logs" mkdir logs
if not exist "data" mkdir data  
if not exist "models" mkdir models
if not exist "temp" mkdir temp
if not exist "backups" mkdir backups

echo %GREEN%[SUCCESS]%RESET% Directories created

echo.
echo %BLUE%[INFO]%RESET% Setting up database...

REM Create SQLite database
if not exist "data\agisfl.db" (
    echo %BLUE%[INFO]%RESET% Initializing SQLite database...
    python -c "
import sqlite3
import os

os.makedirs('data', exist_ok=True)
conn = sqlite3.connect('data/agisfl.db')
cursor = conn.cursor()

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
''')

# Create system_metrics table
cursor.execute('''
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cpu_percent REAL,
    memory_percent REAL,
    disk_percent REAL,
    network_bytes_sent INTEGER,
    network_bytes_recv INTEGER,
    active_threats INTEGER DEFAULT 0
)
''')

# Create network_packets table
cursor.execute('''
CREATE TABLE IF NOT EXISTS network_packets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_ip TEXT,
    dest_ip TEXT,
    protocol TEXT,
    packet_size INTEGER,
    is_suspicious BOOLEAN DEFAULT FALSE,
    threat_score REAL DEFAULT 0.0
)
''')

# Create fl_models table
cursor.execute('''
CREATE TABLE IF NOT EXISTS fl_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accuracy REAL,
    participant_count INTEGER,
    training_round INTEGER,
    model_data TEXT
)
''')

conn.commit()
conn.close()
print('SQLite database initialized successfully')
"
    if %errorLevel% neq 0 (
        echo %RED%[ERROR]%RESET% Failed to initialize database
        pause
        exit /b 1
    )
    echo %GREEN%[SUCCESS]%RESET% SQLite database initialized
) else (
    echo %YELLOW%[WARNING]%RESET% Database already exists
)

echo.
echo %BLUE%[INFO]%RESET% Creating configuration files...

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo # AgisFL Configuration > .env
    echo NODE_ENV=production >> .env
    echo PORT=5000 >> .env
    echo DATABASE_URL=sqlite:///data/agisfl.db >> .env
    echo. >> .env
    echo # Security Settings >> .env
    echo JWT_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM% >> .env
    echo SESSION_SECRET=%RANDOM%%RANDOM%%RANDOM%%RANDOM% >> .env
    echo. >> .env
    echo # FL-IDS Settings >> .env
    echo FL_MIN_CLIENTS=2 >> .env
    echo FL_ROUNDS_PER_TRAINING=10 >> .env
    echo THREAT_THRESHOLD=0.7 >> .env
    echo PRIVACY_EPSILON=1.0 >> .env
    echo. >> .env
    echo # Monitoring Settings >> .env
    echo MONITOR_INTERVAL=5 >> .env
    echo PACKET_CAPTURE_DURATION=10 >> .env
    echo LOG_LEVEL=INFO >> .env
    
    echo %GREEN%[SUCCESS]%RESET% Configuration file created
) else (
    echo %YELLOW%[WARNING]%RESET% Configuration file already exists
)

echo.
echo %BLUE%[INFO]%RESET% Creating startup scripts...

REM Create start.bat script
(
echo @echo off
echo title AgisFL - Federated Learning IDS
echo echo Starting AgisFL System...
echo.
echo REM Activate virtual environment
echo call venv\Scripts\activate.bat
echo.
echo REM Start the application
echo if exist "app.py" (
echo     echo Starting Flask backend...
echo     python app.py
echo ^) else (
echo     echo Starting development server...
echo     npm run dev
echo ^)
echo.
echo pause
) > start.bat

REM Create stop.bat script
(
echo @echo off
echo title AgisFL - Stop
echo echo Stopping AgisFL System...
echo.
echo REM Kill Python processes
echo taskkill /F /IM python.exe 2^>nul
echo taskkill /F /IM node.exe 2^>nul
echo.
echo echo AgisFL stopped
echo pause
) > stop.bat

echo %GREEN%[SUCCESS]%RESET% Startup scripts created

echo.
echo %BLUE%[INFO]%RESET% Running system tests...

REM Test Python imports
python -c "
try:
    import flask, pandas, numpy, sklearn, psutil
    print('✅ All Python dependencies imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

if %errorLevel% neq 0 (
    echo %RED%[ERROR]%RESET% Python dependency test failed
    pause
    exit /b 1
)

REM Test database connection
python -c "
import sqlite3
try:
    conn = sqlite3.connect('data/agisfl.db')
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database error: {e}')
    exit(1)
"

if %errorLevel% neq 0 (
    echo %RED%[ERROR]%RESET% Database test failed
    pause
    exit /b 1
)

echo %GREEN%[SUCCESS]%RESET% System tests completed

echo.
echo %GREEN%=====================================%RESET%
echo %GREEN%   AgisFL Installation Complete!   %RESET%
echo %GREEN%=====================================%RESET%
echo.
echo %CYAN%Next steps:%RESET%
echo 1. Review the configuration in .env file
echo 2. Start the system with: %YELLOW%start.bat%RESET%
echo 3. Access the dashboard at: %CYAN%http://localhost:5000%RESET%
echo 4. Check logs in the logs\ directory
echo.
echo %BLUE%For production deployment:%RESET%
echo • Configure Windows Firewall settings
echo • Set up SSL certificates  
echo • Configure database backups
echo • Review security settings
echo.
echo %PURPLE%Documentation:%RESET% README.md
echo %PURPLE%Support:%RESET% Check the GitHub repository for issues and updates
echo.

REM Create desktop shortcut
echo %BLUE%[INFO]%RESET% Creating desktop shortcuts...

set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_START=%DESKTOP%\AgisFL Start.lnk"
set "SHORTCUT_STOP=%DESKTOP%\AgisFL Stop.lnk"

REM PowerShell command to create shortcuts
powershell -Command "
$WshShell = New-Object -comObject WScript.Shell;
$StartShortcut = $WshShell.CreateShortcut('%SHORTCUT_START%');
$StartShortcut.TargetPath = '%CD%\start.bat';
$StartShortcut.WorkingDirectory = '%CD%';
$StartShortcut.IconLocation = 'shell32.dll,21';
$StartShortcut.Description = 'Start AgisFL System';
$StartShortcut.Save();

$StopShortcut = $WshShell.CreateShortcut('%SHORTCUT_STOP%');
$StopShortcut.TargetPath = '%CD%\stop.bat';
$StopShortcut.WorkingDirectory = '%CD%';
$StopShortcut.IconLocation = 'shell32.dll,27';
$StopShortcut.Description = 'Stop AgisFL System';
$StopShortcut.Save()
"

if %errorLevel% equ 0 (
    echo %GREEN%[SUCCESS]%RESET% Desktop shortcuts created
) else (
    echo %YELLOW%[WARNING]%RESET% Could not create desktop shortcuts
)

echo.
echo %GREEN%Installation completed successfully!%RESET%
echo %BLUE%Press any key to exit...%RESET%
pause >nul

endlocal