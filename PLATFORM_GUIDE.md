
# 🖥️ Platform-Specific Setup Guide

## Windows Setup

### Prerequisites Installation
1. **Download Node.js** from https://nodejs.org/
   - Choose LTS version
   - Run installer as Administrator
   - Verify: `node --version` in Command Prompt

2. **Download Python** from https://python.org/
   - Choose Python 3.8+
   - Check "Add Python to PATH" during installation
   - Verify: `python --version` in Command Prompt

### Quick Start
```batch
# Clone or download the project
git clone https://github.com/your-username/AgisFL.git
cd AgisFL

# Run the standalone launcher
start-standalone.bat
```

### Manual Setup
```batch
npm install
pip install flask flask-socketio psutil scapy pandas numpy scikit-learn
npm run dev
```

## Linux Setup

### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python
sudo apt update
sudo apt install python3 python3-pip

# Install project
git clone https://github.com/your-username/AgisFL.git
cd AgisFL
chmod +x start-standalone.sh
./start-standalone.sh
```

### CentOS/RHEL
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs

# Install Python
sudo yum install python3 python3-pip

# Install project
git clone https://github.com/your-username/AgisFL.git
cd AgisFL
chmod +x start-standalone.sh
./start-standalone.sh
```

## macOS Setup

### Using Homebrew (Recommended)
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and Python
brew install node python3

# Install project
git clone https://github.com/your-username/AgisFL.git
cd AgisFL
chmod +x start-standalone.sh
./start-standalone.sh
```

### Manual Installation
1. Download Node.js from https://nodejs.org/
2. Download Python from https://python.org/
3. Follow Linux setup steps

## Docker Alternative (Optional)

```bash
# Create Dockerfile (for advanced users)
docker build -t agisfl .
docker run -p 5000:5000 agisfl
```

## Verification Steps

After installation, verify:
1. Open http://localhost:5000
2. Login with admin/password123
3. Check all dashboard sections load
4. Verify real-time data updates

## Common Issues

### Windows
- **Permission denied:** Run Command Prompt as Administrator
- **Python not found:** Restart Command Prompt after Python installation
- **npm errors:** Clear npm cache: `npm cache clean --force`

### Linux
- **Permission issues:** Use `sudo` for system package installation
- **Missing compilers:** Install build-essential: `sudo apt install build-essential`
- **Network issues:** Check firewall settings

### macOS
- **Xcode tools:** Install with `xcode-select --install`
- **Permission issues:** Use `sudo` when needed
- **Path issues:** Restart Terminal after installations

## Performance Tips

1. **Minimum Requirements:**
   - 4GB RAM
   - 2 CPU cores
   - 1GB free disk space

2. **Optimal Performance:**
   - 8GB+ RAM
   - 4+ CPU cores
   - SSD storage

3. **Network Requirements:**
   - Port 5000 available
   - Internet connection for updates
   - Admin privileges for network monitoring
