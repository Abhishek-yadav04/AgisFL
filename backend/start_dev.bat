@echo off
echo Starting AgisFL Enterprise v5.0 - Development Mode
echo ================================================

echo Setting environment variables...
set DISABLE_AUTHENTICATION=true
set SKIP_REDIS_INIT=true
set DISABLE_REDIS=true
set ENVIRONMENT=development
set DEBUG=true
set HOST=0.0.0.0
set PORT=8000

echo Checking Python environment...
python --version
echo.

echo Starting backend server on http://localhost:8000...
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.

python main.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Backend server failed to start!
    echo Check the error messages above.
    echo.
)

pause