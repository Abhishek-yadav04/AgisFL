# Docker Installation Guide for AgisFL

## The Issue
Docker Desktop is not installed or not running on your system.

## Solution 1: Install Docker Desktop (Recommended)

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows

2. **Install Docker Desktop:**
   - Run the installer as Administrator
   - Follow the installation wizard
   - Restart your computer when prompted

3. **Start Docker Desktop:**
   - Launch Docker Desktop from Start Menu
   - Wait for it to fully start (whale icon in system tray)
   - You'll see "Docker Desktop is running" when ready

4. **Run the services:**
   ```cmd
   .\start_services.bat
   ```

## Solution 2: Use Standalone Mode (No Docker Required)

If you don't want to install Docker, use standalone mode:

```cmd
cd backend
python start_standalone.py
```

## Solution 3: Install Services Manually (Advanced)

### Install Redis:
1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Install and start Redis service
3. Default port: 6379

### Install PostgreSQL:
1. Download from: https://www.postgresql.org/download/windows/
2. Install with these settings:
   - Database: agisfl
   - User: agisfl_user
   - Password: AgisFL2024!
   - Port: 5432

## Verification

After Docker is running, verify with:
```cmd
docker --version
docker ps
```