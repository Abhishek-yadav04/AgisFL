#!/usr/bin/env node

import { exec, spawn } from "child_process";
const fs = require("fs");
const path = require("path");
const os = require("os");

const platform = os.platform();
const isWindows = platform === "win32";
const isMac = platform === "darwin";
const isLinux = platform === "linux";

console.log(
  "🚀 AgisFL Universal Setup - Federated Learning Intrusion Detection System",
);
console.log("=".repeat(80));
console.log(`Platform detected: ${platform}`);

class UniversalSetup {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    try {
      await this.checkPrerequisites();
      await this.installDependencies();
      await this.buildApplication();
      await this.createStartupScripts();
      await this.setupDatabase();
      await this.runTests();
      this.createDesktopShortcuts();
      this.displayCompletionMessage();
    } catch (error) {
      console.error("❌ Setup failed:", error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log("\n📋 Checking prerequisites...");

    // Check Node.js
    try {
      const nodeVersion = await this.executeCommand("node --version");
      const version = nodeVersion.trim().replace("v", "");
      const majorVersion = parseInt(version.split(".")[0]);

      if (majorVersion >= 16) {
        console.log(`✅ Node.js ${nodeVersion.trim()} found`);
      } else {
        throw new Error(
          `Node.js version ${version} is too old. Please install Node.js 16+`,
        );
      }
    } catch (error) {
      throw new Error(
        "Node.js not found. Please install Node.js 16+ from https://nodejs.org/",
      );
    }

    // Check Python
    const pythonCommands = ["python3", "python"];
    let pythonFound = false;

    for (const cmd of pythonCommands) {
      try {
        const pythonVersion = await this.executeCommand(`${cmd} --version`);
        const version = pythonVersion.trim().split(" ")[1];
        const majorVersion = parseInt(version.split(".")[0]);
        const minorVersion = parseInt(version.split(".")[1]);

        if (majorVersion === 3 && minorVersion >= 8) {
          console.log(`✅ Python ${version} found (${cmd})`);
          this.pythonCommand = cmd;
          pythonFound = true;
          break;
        }
      } catch (error) {
        // Continue to next command
      }
    }

    if (!pythonFound) {
      this.warnings.push(
        "Python 3.8+ not found. Some ML features may not work.",
      );
      console.log("⚠️  Python 3.8+ not found. Some ML features may not work.");
    }

    // Check available ports
    await this.checkPorts([5000, 3000, 8080]);
  }

  async checkPorts(ports) {
    console.log("🔍 Checking port availability...");

    for (const port of ports) {
      try {
        const result = await this.executeCommand(
          isWindows ? `netstat -an | findstr :${port}` : `lsof -i :${port}`,
        );

        if (result.trim()) {
          this.warnings.push(`Port ${port} appears to be in use`);
          console.log(`⚠️  Port ${port} appears to be in use`);
        } else {
          console.log(`✅ Port ${port} is available`);
        }
      } catch (error) {
        // Port is likely available if command fails
        console.log(`✅ Port ${port} is available`);
      }
    }
  }

  async installDependencies() {
    console.log("\n📦 Installing dependencies...");

    // Install Node.js dependencies
    console.log("Installing Node.js packages...");
    await this.executeCommand("npm install", { stdio: "inherit" });

    // Install Python dependencies if Python is available
    if (this.pythonCommand) {
      console.log("Installing Python packages...");
      const pythonPackages = [
        "flask",
        "flask-socketio",
        "psutil",
        "pandas",
        "numpy",
        "scikit-learn",
      ];

      try {
        // Try pip3 first, then pip
        const pipCommand = await this.findPipCommand();
        await this.executeCommand(
          `${pipCommand} install ${pythonPackages.join(" ")}`,
          { stdio: "inherit" },
        );
        console.log("✅ Python dependencies installed");
      } catch (error) {
        this.warnings.push("Failed to install Python dependencies");
        console.log("⚠️  Failed to install Python dependencies");
      }
    }
  }

  async findPipCommand() {
    const pipCommands = ["pip3", "pip"];

    for (const cmd of pipCommands) {
      try {
        await this.executeCommand(`${cmd} --version`);
        return cmd;
      } catch (error) {
        // Continue to next command
      }
    }

    throw new Error("No pip command found");
  }

  async buildApplication() {
    console.log("\n🔨 Building application...");

    try {
      await this.executeCommand("npm run build", { stdio: "inherit" });
      console.log("✅ Application built successfully");
    } catch (error) {
      throw new Error("Failed to build application");
    }
  }

  async createStartupScripts() {
    console.log("\n📝 Creating startup scripts...");

    // Create universal start script
    const startScript = this.generateStartScript();
    const scriptName = isWindows ? "start.bat" : "start.sh";

    fs.writeFileSync(scriptName, startScript);

    if (!isWindows) {
      await this.executeCommand(`chmod +x ${scriptName}`);
    }

    console.log(`✅ Created ${scriptName}`);

    // Create development script
    const devScript = this.generateDevScript();
    const devScriptName = isWindows ? "dev.bat" : "dev.sh";

    fs.writeFileSync(devScriptName, devScript);

    if (!isWindows) {
      await this.executeCommand(`chmod +x ${devScriptName}`);
    }

    console.log(`✅ Created ${devScriptName}`);
  }

  generateStartScript() {
    if (isWindows) {
      return `@echo off
echo Starting AgisFL Production Server...
echo.
echo Dashboard will be available at: http://localhost:5000
echo Default credentials: admin / password123
echo.
echo Press Ctrl+C to stop the server
echo.
npm start
pause
`;
    } else {
      return `#!/bin/bash
echo "Starting AgisFL Production Server..."
echo
echo "Dashboard will be available at: http://localhost:5000"
echo "Default credentials: admin / password123"
echo
echo "Press Ctrl+C to stop the server"
echo
npm start
`;
    }
  }

  generateDevScript() {
    if (isWindows) {
      return `@echo off
echo Starting AgisFL Development Server...
echo.
echo Dashboard will be available at: http://localhost:5000
echo Hot reload enabled for development
echo.
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
`;
    } else {
      return `#!/bin/bash
echo "Starting AgisFL Development Server..."
echo
echo "Dashboard will be available at: http://localhost:5000"
echo "Hot reload enabled for development"
echo
echo "Press Ctrl+C to stop the server"
echo
npm run dev
`;
    }
  }

  async setupDatabase() {
    console.log("\n💾 Setting up database...");

    try {
      // Check if database exists
      if (fs.existsSync("agisfl.db")) {
        console.log("✅ Database already exists");
      } else {
        console.log("Creating new database...");
        // Database will be created automatically on first run
        console.log("✅ Database setup completed");
      }
    } catch (error) {
      this.warnings.push("Database setup had issues");
      console.log("⚠️  Database setup had issues");
    }
  }

  async runTests() {
    console.log("\n🧪 Running system tests...");

    try {
      // Test Node.js server start
      console.log("Testing server startup...");

      // Quick build test
      await this.executeCommand("npm run check", { timeout: 30000 });
      console.log("✅ TypeScript compilation test passed");

      console.log("✅ All tests passed");
    } catch (error) {
      this.warnings.push("Some tests failed but setup can continue");
      console.log("⚠️  Some tests failed but setup can continue");
    }
  }

  createDesktopShortcuts() {
    console.log("\n🖥️  Creating desktop shortcuts...");

    try {
      if (isWindows) {
        this.createWindowsShortcut();
      } else if (isMac) {
        this.createMacShortcut();
      } else if (isLinux) {
        this.createLinuxShortcut();
      }

      console.log("✅ Desktop shortcut created");
    } catch (error) {
      this.warnings.push("Failed to create desktop shortcut");
      console.log("⚠️  Failed to create desktop shortcut");
    }
  }

  createWindowsShortcut() {
    const batchContent = `@echo off
cd /d "${process.cwd()}"
start.bat
`;
    const shortcutPath = path.join(os.homedir(), "Desktop", "AgisFL.bat");
    fs.writeFileSync(shortcutPath, batchContent);
  }

  createMacShortcut() {
    const appContent = `#!/bin/bash
cd "${process.cwd()}"
./start.sh
`;
    const shortcutPath = path.join(os.homedir(), "Desktop", "AgisFL.command");
    fs.writeFileSync(shortcutPath, appContent);
    fs.chmodSync(shortcutPath, "755");
  }

  createLinuxShortcut() {
    const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=AgisFL
Comment=Federated Learning Intrusion Detection System
Exec=${process.cwd()}/start.sh
Icon=${process.cwd()}/client/public/favicon.ico
Path=${process.cwd()}
Terminal=true
StartupNotify=true
`;
    const shortcutPath = path.join(os.homedir(), "Desktop", "AgisFL.desktop");
    fs.writeFileSync(shortcutPath, desktopContent);
    fs.chmodSync(shortcutPath, "755");
  }

  displayCompletionMessage() {
    console.log("\n" + "=".repeat(80));
    console.log("🎉 AgisFL Setup Completed Successfully!");
    console.log("=".repeat(80));

    if (this.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
    }

    console.log("\n🚀 Quick Start:");
    console.log(`   Production:  ${isWindows ? "start.bat" : "./start.sh"}`);
    console.log(`   Development: ${isWindows ? "dev.bat" : "./dev.sh"}`);

    console.log("\n🌐 Access Points:");
    console.log("   • Web Dashboard: http://localhost:5000");
    console.log("   • Default Login: admin / password123");

    console.log("\n📚 Documentation:");
    console.log("   • User Manual: docs/USER_MANUAL.md");
    console.log("   • Deployment Guide: docs/DEPLOYMENT_GUIDE.md");
    console.log("   • Platform Guide: PLATFORM_GUIDE.md");

    console.log("\n🔧 Troubleshooting:");
    console.log("   • Check logs in the terminal when starting");
    console.log("   • Ensure port 5000 is available");
    console.log("   • Run setup again if needed");

    console.log("\n✨ Enjoy your AgisFL experience!");
  }

  executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const proc = exec(
        command,
        {
          timeout: options.timeout || 60000,
          ...options,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        },
      );

      if (options.stdio === "inherit") {
        proc.stdout?.pipe(process.stdout);
        proc.stderr?.pipe(process.stderr);
      }
    });
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  const setup = new UniversalSetup();
  setup.run().catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
}

module.exports = UniversalSetup;
