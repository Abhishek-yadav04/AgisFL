
#!/bin/bash

echo "🚀 Creating AgisFL Distribution Package"
echo "======================================"

# Create package directory
PACKAGE_NAME="AgisFL-v$(date +%Y%m%d)"
mkdir -p "dist-package/$PACKAGE_NAME"

# Copy essential files
echo "📦 Copying application files..."
cp -r client "dist-package/$PACKAGE_NAME/"
cp -r server "dist-package/$PACKAGE_NAME/"
cp -r shared "dist-package/$PACKAGE_NAME/"
cp -r docs "dist-package/$PACKAGE_NAME/"

# Copy configuration files
cp package.json "dist-package/$PACKAGE_NAME/"
cp package-lock.json "dist-package/$PACKAGE_NAME/"
cp tsconfig.json "dist-package/$PACKAGE_NAME/"
cp vite.config.ts "dist-package/$PACKAGE_NAME/"
cp tailwind.config.ts "dist-package/$PACKAGE_NAME/"
cp postcss.config.js "dist-package/$PACKAGE_NAME/"
cp components.json "dist-package/$PACKAGE_NAME/"
cp drizzle.config.ts "dist-package/$PACKAGE_NAME/"

# Copy setup scripts
cp setup.sh "dist-package/$PACKAGE_NAME/"
cp setup.bat "dist-package/$PACKAGE_NAME/"
cp setup-universal.js "dist-package/$PACKAGE_NAME/"

# Copy startup scripts
cp start-standalone.sh "dist-package/$PACKAGE_NAME/"
cp start-standalone.bat "dist-package/$PACKAGE_NAME/"

# Copy documentation
cp README.md "dist-package/$PACKAGE_NAME/"
cp PLATFORM_GUIDE.md "dist-package/$PACKAGE_NAME/"

# Create installation script for the package
cat > "dist-package/$PACKAGE_NAME/INSTALL.md" << 'EOF'
# AgisFL Installation Guide

## Quick Start

### Windows
1. Extract the package
2. Run `setup.bat`
3. Run `start-standalone.bat`

### Linux/macOS
1. Extract the package
2. Run `chmod +x setup.sh && ./setup.sh`
3. Run `chmod +x start-standalone.sh && ./start-standalone.sh`

### Requirements
- Node.js 18+
- Python 3.8+ (optional)
- 4GB RAM minimum
- Modern web browser

## Application Access
- Main Dashboard: http://localhost:5000
- Default Login: admin/password123

## Support
Visit the GitHub repository for issues and documentation.
EOF

# Create Windows installer
cat > "dist-package/$PACKAGE_NAME/install-windows.bat" << 'EOF'
@echo off
echo Installing AgisFL - Federated Learning IDS
echo ==========================================

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
npm install

echo Building application...
npm run build

echo Creating desktop shortcut...
powershell -Command "& {$WScript = New-Object -ComObject WScript.Shell; $Shortcut = $WScript.CreateShortcut('%USERPROFILE%\Desktop\AgisFL.lnk'); $Shortcut.TargetPath = '%CD%\start-standalone.bat'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Save()}"

echo.
echo Installation completed!
echo Run start-standalone.bat to start AgisFL
pause
EOF

# Create package info
cat > "dist-package/$PACKAGE_NAME/PACKAGE_INFO.json" << EOF
{
  "name": "AgisFL",
  "version": "1.0.0",
  "description": "Federated Learning Intrusion Detection System",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platform": "cross-platform",
  "requirements": {
    "nodejs": ">=18.0.0",
    "python": ">=3.8 (optional)",
    "memory": "4GB",
    "disk": "1GB"
  },
  "features": [
    "Real-time threat detection",
    "Federated learning capabilities", 
    "Network monitoring",
    "Incident response",
    "Analytics dashboard",
    "Multi-platform support"
  ]
}
EOF

# Create archive
echo "🗜️ Creating archive..."
cd dist-package
tar -czf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME" > /dev/null

echo "✅ Package created successfully!"
echo "📁 Location: dist-package/$PACKAGE_NAME.tar.gz"
echo "📁 Location: dist-package/$PACKAGE_NAME.zip"
echo ""
echo "🚀 Upload to GitHub releases for distribution"
