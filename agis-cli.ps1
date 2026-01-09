# AgisFL CLI Launcher Script (PowerShell)
# This script provides easy access to the AgisFL CLI tools

param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    AgisFL CLI Launcher (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (!(Test-Path "cli\agis-cli.py")) {
    Write-Host "ERROR: agis-cli.py not found in cli directory" -ForegroundColor Red
    Write-Host "Please run this script from the AgisFL-testing root directory" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is available
try {
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ and add it to your PATH" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Set the working directory to the cli folder
Set-Location cli

Write-Host "AgisFL CLI is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Common commands:" -ForegroundColor Yellow
Write-Host "  agis-cli experiment list              - List all experiments"
Write-Host "  agis-cli experiment create `"test`"     - Create new experiment"
Write-Host "  agis-cli monitor dashboard            - Launch monitoring dashboard"
Write-Host "  agis-cli simulation run --attack poisoning  - Run attack simulation"
Write-Host "  agis-cli config set api_key YOUR_KEY  - Set API key"
Write-Host ""
Write-Host "Type 'agis-cli --help' for full command list" -ForegroundColor Cyan
Write-Host ""

# Start Python with the CLI
& python agis-cli.py @Args