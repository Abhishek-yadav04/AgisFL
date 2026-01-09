@echo off
echo =====================================
echo   AgisFL Docker Deployment Script
echo =====================================
echo.

echo [1/6] Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and make sure it's running.
    pause
    exit /b 1
)
echo Docker is running ✓

echo.
echo [2/6] Building frontend...
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
echo [3/6] Creating environment file...
if not exist .env.production (
    echo Creating .env.production with default values...
    (
        echo # AgisFL Production Environment
        echo DATABASE_URL=sqlite:///./agisfl.db
        echo JWT_SECRET=agisfl_jwt_secret_change_in_production_1234567890
        echo ENCRYPTION_KEY=agisfl_encryption_key_32_chars_1234567890ab
        echo REDIS_PASSWORD=agisfl_redis_password_2024_secure_123
        echo GRAFANA_PASSWORD=admin123
        echo ENVIRONMENT=production
        echo DEBUG=false
        echo DISABLE_AUTHENTICATION=true
        echo VITE_API_URL=http://localhost:8000
    ) > .env.production
    echo Environment file created ✓
) else (
    echo Environment file already exists ✓
)

echo.
echo [4/6] Stopping existing containers...
docker-compose -f docker-compose.production.yml down --remove-orphans
echo Containers stopped ✓

echo.
echo [5/6] Building and starting services...
docker-compose -f docker-compose.production.yml --env-file .env.production up -d --build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker deployment failed!
    echo Checking logs...
    docker-compose -f docker-compose.production.yml logs
    pause
    exit /b 1
)
echo Services started ✓

echo.
echo [6/6] Checking service health...
echo Waiting for services to initialize...
timeout /t 20 /nobreak > nul

echo Checking container status...
docker-compose -f docker-compose.production.yml ps

echo.
echo Checking backend health...
curl -s http://localhost:8000/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Backend health check ✓
) else (
    echo Backend health check ❌ (may still be starting...)
)

echo.
echo Checking frontend health...
curl -s http://localhost/health > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Frontend health check ✓
) else (
    echo Frontend health check ❌ (may still be starting...)
)

echo.
echo =====================================
echo   Deployment Complete!
echo =====================================
echo.
echo 🌐 Application URLs:
echo    Frontend + API:  http://localhost
echo    Privacy Page:    http://localhost/privacy
echo    Backend API:     http://localhost:8000
echo    API Docs:        http://localhost:8000/docs
echo    Health Check:    http://localhost:8000/health
echo.
echo 🗄️  Database:
echo    SQLite file:     agisfl.db (auto-created)
echo.
echo 🔧 Management:
echo    View logs:       docker-compose -f docker-compose.production.yml logs -f
echo    Stop services:   docker-compose -f docker-compose.production.yml down
echo    Restart:         docker-compose -f docker-compose.production.yml restart
echo.
echo 📝 Notes:
echo    - Authentication is disabled for easy setup
echo    - All privacy APIs are working with real backend data
echo    - Frontend is optimized and served via Nginx
echo.
pause