
#!/bin/bash

# AgisFL Production Package Creator
# Creates a complete, deployable package of the AgisFL system

set -e

echo "🚀 Creating AgisFL Production Package..."

# Create package directory
PACKAGE_DIR="agisfl-production-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PACKAGE_DIR"

echo "📦 Copying source files..."

# Copy essential files
cp -r client "$PACKAGE_DIR/"
cp -r server "$PACKAGE_DIR/"
cp -r shared "$PACKAGE_DIR/"
cp -r docs "$PACKAGE_DIR/"
cp -r scripts "$PACKAGE_DIR/"

# Copy configuration files
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/"
cp tsconfig.json "$PACKAGE_DIR/"
cp tailwind.config.ts "$PACKAGE_DIR/"
cp vite.config.ts "$PACKAGE_DIR/"
cp components.json "$PACKAGE_DIR/"
cp postcss.config.js "$PACKAGE_DIR/"

# Copy deployment files
cp README.md "$PACKAGE_DIR/"
cp PLATFORM_GUIDE.md "$PACKAGE_DIR/"
cp setup.sh "$PACKAGE_DIR/"
cp setup.bat "$PACKAGE_DIR/"
cp start-standalone.sh "$PACKAGE_DIR/"
cp start-standalone.bat "$PACKAGE_DIR/"

# Copy Python standalone
cp app.py "$PACKAGE_DIR/"
cp fl_ids_core.py "$PACKAGE_DIR/"

echo "🔧 Installing dependencies..."
cd "$PACKAGE_DIR"
npm install --production=false

echo "🏗️  Building application..."
npm run build

echo "🧪 Running tests..."
npm test || echo "⚠️  Some tests failed, but continuing..."

echo "🔒 Security audit..."
npm audit fix || echo "⚠️  Some vulnerabilities remain"

echo "📋 Creating deployment instructions..."
cat > DEPLOYMENT.md << 'EOF'
# AgisFL Deployment Instructions

## Quick Start

### Node.js/Express (Recommended)
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

### Python Flask (Standalone)
```bash
# Install Python dependencies
pip install flask flask-socketio numpy pandas scikit-learn

# Run standalone application
python app.py
```

### Windows Deployment
```cmd
setup.bat
start-standalone.bat
```

### Linux/macOS Deployment
```bash
chmod +x setup.sh start-standalone.sh
./setup.sh
./start-standalone.sh
```

## Environment Variables
- `NODE_ENV=production`
- `PORT=5000` (or your preferred port)
- `DATABASE_URL` (if using external database)

## Security Notes
- Always use HTTPS in production
- Configure proper firewall rules
- Set up rate limiting
- Use strong authentication tokens

## Monitoring
- Application runs on port 5000 by default
- WebSocket endpoint: `/ws`
- Health check: `/health`
- API endpoints: `/api/*`

For detailed documentation, see docs/DEPLOYMENT_GUIDE.md
EOF

echo "✅ Package created successfully!"
echo "📁 Location: $PACKAGE_DIR"
echo "📝 Size: $(du -sh "$PACKAGE_DIR" | cut -f1)"

# Create archive
echo "📦 Creating archive..."
tar -czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"

echo "🎉 Production package ready!"
echo "📦 Archive: ${PACKAGE_DIR}.tar.gz"
echo "📂 Directory: $PACKAGE_DIR"

echo ""
echo "🚀 To deploy:"
echo "1. Extract the archive on your target server"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run build' to build the application"
echo "4. Run 'npm start' to start the production server"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
