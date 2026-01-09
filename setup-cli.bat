@echo off
REM AgisFL CLI Setup Script
REM This script helps configure the AgisFL CLI for first-time use

echo ========================================
echo    AgisFL CLI Setup
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "cli\agis-cli.py" (
    echo ERROR: agis-cli.py not found in cli directory
    echo Please run this script from the AgisFL-testing root directory
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to your PATH
    pause
    exit /b 1
)

echo Setting up AgisFL CLI configuration...
echo.

REM Set default server URL
cd cli
echo Setting server URL to http://localhost:8000
python agis-cli.py config set server_url http://localhost:8000

echo.
echo Now you need to set an API key.
echo The API key is used to authenticate with the AgisFL backend.
echo.

set /p API_KEY="Enter your API key (or press Enter to skip for now): "

if defined API_KEY (
    echo Setting API key...
    python agis-cli.py config set api_key %API_KEY%
    echo.
    echo API key configured successfully!
) else (
    echo.
    echo No API key entered. You can set it later with:
    echo agis-cli config set api_key YOUR_API_KEY
)

echo.
echo Setup complete! You can now use the CLI with:
echo   .\agis-cli.bat --help
echo   .\agis-cli.bat experiment list
echo   .\agis-cli.bat monitor dashboard
echo.

pause