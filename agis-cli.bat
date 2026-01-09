@echo off
REM AgisFL CLI Launcher Script
REM This script provides easy access to the AgisFL CLI tools

echo ========================================
echo    AgisFL CLI Launcher
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

REM Set the working directory to the cli folder
cd cli

echo AgisFL CLI is ready!
echo.
echo Common commands:
echo   agis-cli experiment list              - List all experiments
echo   agis-cli experiment create "test"     - Create new experiment
echo   agis-cli monitor dashboard            - Launch monitoring dashboard
echo   agis-cli simulation run --attack poisoning  - Run attack simulation
echo   agis-cli config set api_key YOUR_KEY  - Set API key
echo.
echo Type 'agis-cli --help' for full command list
echo Type 'exit' to quit
echo.

REM Start Python with the CLI
python agis-cli.py %*