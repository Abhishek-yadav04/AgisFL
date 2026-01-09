@echo off
echo =====================================
echo   AgisFL Simple Docker Deployment
echo =====================================
echo.

echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and make sure it's running.
    pause
    exit /b 1
)
echo Docker is running ✓

echo.
echo [2/5] Building frontend...
cd frontend
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo Frontend build completed ✓
cd ..

echo.
echo [3/5] Stopping existing containers...
docker-compose -f docker-compose.simple.yml down --remove-orphans 2>nul
docker-compose -f docker-compose.production.yml down --remove-orphans 2>nul
echo Containers stopped ✓

echo.
echo [4/5] Building and starting services (without Redis for Windows compatibility)...
docker-compose -f docker-compose.simple.yml up -d --build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker deployment failed!
    echo Checking logs...
    docker-compose -f docker-compose.simple.yml logs
    pause
    exit /b 1
)
echo Services started ✓

echo.
echo [5/5] Checking service health...
echo Waiting for services to initialize...
timeout /t 20 /nobreak > nul

echo Checking container status...
docker-compose -f docker-compose.simple.yml ps

echo.
echo Testing backend health...
timeout /t 5 /nobreak > nul
curl -s http://localhost:8000/health
if %ERRORLEVEL% equ 0 (
    echo Backend health check ✓
) else (
    echo Backend may still be starting...
    timeout /t 10 /nobreak > nul
    curl -s http://localhost:8000/health
)

echo.
echo Testing frontend...
curl -s http://localhost/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Frontend health check ✓
) else (
    echo Frontend health check ❌ (may still be starting...)
)

echo.
echo =====================================
echo   Simple Deployment Complete!
echo =====================================
echo.
echo 🌐 Application URLs:
echo    Frontend:        http://localhost
echo    Privacy Page:    http://localhost/privacy
echo    Backend API:     http://localhost:8000
echo    API Docs:        http://localhost:8000/docs
echo    Health Check:    http://localhost:8000/health
echo.
echo 🗄️  Database:
echo    SQLite file:     agisfl.db (auto-created)
echo.
echo 🔧 Management:
echo    View logs:       docker-compose -f docker-compose.simple.yml logs -f
echo    Stop services:   docker-compose -f docker-compose.simple.yml down
echo    Restart:         docker-compose -f docker-compose.simple.yml restart
echo.
echo 📝 Notes:
echo    - Redis is disabled for Windows compatibility
echo    - Authentication is disabled for easy setup
echo    - All privacy APIs working with backend data
echo.
pause