#!/usr/bin/env python3
"""
CLI Setup and Installation Script
=================================

This script sets up the agis-cli tool for system-wide use.
"""

import os
import sys
import shutil
import platform
from pathlib import Path


def setup_cli():
    """Setup the CLI tool for system-wide access"""
    print("🚀 Setting up AgisFL CLI...")
    
    # Get the current script directory
    current_dir = Path(__file__).parent
    cli_script = current_dir / "agis-cli.py"
    
    if not cli_script.exists():
        print("❌ Error: agis-cli.py not found!")
        return False
    
    system = platform.system()
    
    if system == "Windows":
        return setup_windows(cli_script)
    else:
        return setup_unix(cli_script)


def setup_windows(cli_script):
    """Setup CLI on Windows"""
    try:
        # Create a batch file wrapper
        batch_content = f'''@echo off
python "{cli_script}" %*
'''
        
        # Try to install to a directory in PATH
        possible_dirs = [
            Path.home() / "AppData" / "Local" / "Programs" / "AgisFL",
            Path("C:/") / "Tools" / "AgisFL",
            Path.home() / "bin"
        ]
        
        install_dir = None
        for dir_path in possible_dirs:
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                install_dir = dir_path
                break
            except PermissionError:
                continue
        
        if install_dir is None:
            print("❌ Could not find suitable installation directory")
            print("💡 Try running as administrator or add the current directory to PATH")
            return False
        
        # Copy CLI script
        target_script = install_dir / "agis-cli.py"
        shutil.copy2(cli_script, target_script)
        
        # Create batch wrapper
        batch_file = install_dir / "agis-cli.bat"
        with open(batch_file, 'w') as f:
            f.write(f'@echo off\npython "{target_script}" %*\n')
        
        print(f"✅ CLI installed to: {install_dir}")
        print(f"📝 Add {install_dir} to your PATH environment variable")
        print("💡 Or run the following in Command Prompt as Administrator:")
        print(f'   setx PATH "%PATH%;{install_dir}" /M')
        
        return True
        
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False


def setup_unix(cli_script):
    """Setup CLI on Unix/Linux/macOS"""
    try:
        # Make script executable
        cli_script.chmod(0o755)
        
        # Try to install to a directory in PATH
        possible_dirs = [
            Path.home() / ".local" / "bin",
            Path.home() / "bin",
            Path("/usr/local/bin"),
            Path("/opt/agisfl/bin")
        ]
        
        install_dir = None
        for dir_path in possible_dirs:
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
                # Test if we can write to this directory
                test_file = dir_path / ".test_write"
                test_file.touch()
                test_file.unlink()
                install_dir = dir_path
                break
            except (PermissionError, OSError):
                continue
        
        if install_dir is None:
            print("❌ Could not find suitable installation directory")
            print("💡 Try running with sudo or add the current directory to PATH")
            return False
        
        # Copy CLI script
        target_script = install_dir / "agis-cli"
        shutil.copy2(cli_script, target_script)
        target_script.chmod(0o755)
        
        print(f"✅ CLI installed to: {target_script}")
        print("🎉 You can now run 'agis-cli' from anywhere!")
        
        # Check if directory is in PATH
        path_dirs = os.environ.get('PATH', '').split(os.pathsep)
        if str(install_dir) not in path_dirs:
            print(f"⚠️  Add {install_dir} to your PATH:")
            print(f"   echo 'export PATH=\"$PATH:{install_dir}\"' >> ~/.bashrc")
            print("   source ~/.bashrc")
        
        return True
        
    except Exception as e:
        print(f"❌ Installation failed: {e}")
        return False


def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    
    dependencies = [
        "click>=8.0.0",
        "httpx>=0.24.0",
        "websockets>=11.0.0",
        "rich>=13.0.0",
        "pyyaml>=6.0.0",
        "pandas>=1.5.0"
    ]
    
    try:
        import subprocess
        for dep in dependencies:
            print(f"   Installing {dep}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
        
        print("✅ Dependencies installed successfully!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def main():
    """Main setup function"""
    print("=" * 50)
    print("🔧 AgisFL CLI Setup")
    print("=" * 50)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed at dependency installation")
        return 1
    
    # Setup CLI
    if not setup_cli():
        print("❌ Setup failed at CLI installation")
        return 1
    
    print("\n🎉 Setup completed successfully!")
    print("\n📚 Quick Start:")
    print("   agis-cli config set api_key YOUR_API_KEY")
    print("   agis-cli config set server_url http://your-server:8000")
    print("   agis-cli experiment list")
    print("   agis-cli monitor dashboard")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
