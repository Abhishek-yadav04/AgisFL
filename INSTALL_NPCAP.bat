@echo off
title Install Npcap for Packet Capture
color 0E

echo.
echo ========================================
echo    Npcap Installation Required
echo    For Packet Capture Functionality
echo ========================================
echo.

echo [INFO] Packet capture requires Npcap to be installed
echo [INFO] This is a one-time setup for Windows packet capture
echo.

REM Check if running as administrator
net session >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Not running as Administrator
    echo [INFO] Npcap installation may require Administrator privileges
    echo.
)

echo [STEP 1] Opening Npcap download page...
start https://npcap.com/dist/npcap-1.79.exe

echo.
echo [STEP 2] Installation Instructions:
echo.
echo 1. Download will start automatically
echo 2. Run the downloaded npcap-1.79.exe file
echo 3. During installation, make sure to check:
echo    ✓ "Install Npcap in WinPcap API-compatible Mode"
echo    ✓ "Support raw 802.11 traffic"
echo 4. Complete the installation
echo 5. Restart your computer if prompted
echo.

echo [STEP 3] After installation, run:
echo    INSTALL_AND_START.bat
echo.

echo [INFO] Npcap is required for:
echo - Network packet capture
echo - Real-time traffic analysis  
echo - Intrusion detection
echo - Network security monitoring
echo.

pause