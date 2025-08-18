@echo off
setlocal enabledelayedexpansion

REM Set college project mode
set COLLEGE_PROJECT=true
set JWT_SECRET=agisfl-college-project-2025-secure-jwt-secret-key

:: AgisFL Enterprise - Universal Startup Script
echo ========================================
echo    AgisFL Enterprise Platform v1.1
echo    Universal Startup Script
echo ========================================
echo [USER] Running in standard mode
echo [USER] Real packet capture: SIMULATION
echo [USER] System monitoring: LIMITED
echo [USER] College Project Mode: ENABLED
echo.
echo Choose startup mode:
echo 1. Quick Start (Core features, fastest startup)
echo 2. Production Mode (Full enterprise features)
echo 3. Development Mode (Hot reload enabled)
echo 4. Test Mode (Run comprehensive tests)
echo 5. Desktop Application (Pure desktop app with Electron)
echo.
set /p MODE="Enter choice (1-5) or press Enter for Quick Start: "

if "%MODE%"=="" set MODE=1

:start_setup
cd /d "%~dp0"

:: Kill existing processes
echo.
echo [SETUP] Stopping existing processes...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1
timeout /t 2 >nul

:: Setup virtual environment
if not exist "venv\Scripts\activate.bat" (
    echo [SETUP] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        echo [ERROR] Please ensure Python 3.8+ is installed
        pause
        exit /b 1
    )
)

echo [SETUP] Activating virtual environment...
call venv\Scripts\activate.bat

:: Install dependencies based on mode
if "%MODE%"=="1" goto :quick_install
if "%MODE%"=="2" goto :production_install
if "%MODE%"=="3" goto :dev_install
if "%MODE%"=="4" goto :test_install
if "%MODE%"=="5" goto :desktop_install

:quick_install
echo [INSTALL] Installing core dependencies (quick mode)...
pip install -q fastapi uvicorn pydantic scikit-learn numpy psutil websockets python-dotenv
goto :start_application

:production_install
echo [INSTALL] Installing production dependencies...
pip install -q --upgrade pip
echo [INSTALL] Installing core packages first...
pip install -q fastapi uvicorn pydantic scikit-learn numpy psutil websockets python-dotenv requests aiofiles
echo [INSTALL] Installing additional packages...
pip install -q jinja2 python-multipart rich click
echo [INSTALL] Installing ML packages...
pip install -q pandas matplotlib seaborn plotly
if errorlevel 1 (
    echo [WARNING] Some ML packages failed, continuing...
)
goto :start_application

:dev_install
echo [INSTALL] Installing development dependencies...
pip install -q --upgrade pip
pip install -q -r backend\requirements_production.txt
pip install -q black flake8 mypy pytest-watch
goto :start_application

:test_install
echo [INSTALL] Installing test dependencies...
pip install -q --upgrade pip
pip install -q -r backend\requirements_production.txt
echo [TEST] Running comprehensive tests...
cd backend
python -m pytest test_comprehensive.py -v --tb=short
if errorlevel 1 (
    echo [ERROR] Tests failed! Check output above.
    pause
    exit /b 1
)
echo [SUCCESS] All tests passed!
cd ..
goto :start_application

:desktop_install
echo [INSTALL] Installing desktop application dependencies...
pip install -q -r frontend\requirements.txt
goto :start_application

:start_application
:: Set environment variables
set PYTHONPATH=%cd%\backend
set ENVIRONMENT=production
set ADMIN_MODE=%ADMIN_MODE%

:: Create logs directory
if not exist "backend\logs" mkdir backend\logs

echo.
echo ========================================
echo    Starting AgisFL 
echo ========================================
echo Mode: %MODE%
echo Admin: %ADMIN_MODE%
echo Dashboard: http://127.0.0.1:8001/app
echo API Docs: http://127.0.0.1:8001/docs
echo Logs: backend\logs\agisfl_enterprise.log
echo ========================================
echo.

echo Building frontend
if defined SKIP_FRONTEND (
    echo [FRONTEND] Skipping build ^(SKIP_FRONTEND set^)
) else (
    if defined FRONTEND_BUILT (
        echo [FRONTEND] Already built in this run. Skipping duplicate build.
    ) else (
    call :build_frontend
    if errorlevel 1 goto :end
    set FRONTEND_BUILT=1
    )
)


pushd backend >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend directory not found!
    goto :end
)

:: Start based on mode
if "%MODE%"=="3" (
    echo [DEV] Starting with hot reload...
    uvicorn main:app --host 127.0.0.1 --port 8001 --reload --log-level info
) else if "%MODE%"=="5" (
    echo [DESKTOP] Starting desktop application...
    popd
    pushd frontend >nul 2>&1
    if exist "dist-electron\win-unpacked\AgisFL Enterprise.exe" (
        echo [DESKTOP] Starting built desktop application...
        start "" "dist-electron\win-unpacked\AgisFL Enterprise.exe"
    ) else if exist "node_modules\.bin\electron.cmd" (
        echo [DESKTOP] Starting development desktop application...
        npm run electron:dev
    ) else (
        echo [ERROR] Desktop application not built. Building now...
        npm run electron:build
        if exist "dist-electron\win-unpacked\AgisFL Enterprise.exe" (
            echo [DESKTOP] Starting built desktop application...
            start "" "dist-electron\win-unpacked\AgisFL Enterprise.exe"
        ) else (
            echo [ERROR] Failed to build desktop application
            pause
            exit /b 1
        )
    )
    popd
) else (
    echo [PROD] Starting production server...
    rem Prefer uvicorn if installed (better performance & reload options disabled)
    where uvicorn >nul 2>&1
    if not errorlevel 1 (
        uvicorn main:app --host 127.0.0.1 --port 8001 --workers 1 --log-level info
    ) else (
        python main.py
    )
)

popd

goto :end



:end
echo.
echo ========================================
echo AgisFL Enterprise Platform Stopped
echo ========================================
if "%MODE%"=="1" (
    echo Thank you for using AgisFL Enterprise!
) else (
    pause
)

:: ------------------------------------------------------------
:: Subroutines (placed at end to avoid accidental fall-through)
:: ------------------------------------------------------------
:build_frontend
pushd frontend >nul 2>&1 || (echo [ERROR] Frontend directory not found! & exit /b 1)
if not exist "node_modules" (
    echo [FRONTEND] Installing dependencies ^(first run^)...
    call npm install || (echo [ERROR] npm install failed & popd & exit /b 1)
) else (
    echo [FRONTEND] Dependencies present ^(node_modules^). Skipping npm install.
)
echo [FRONTEND] Building production bundle...
call npm run build || (echo [ERROR] Frontend build failed & popd & exit /b 1)
popd
exit /b 0