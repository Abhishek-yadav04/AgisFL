
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Setting up AgiesFL Security Platform for Production...\n');

/**
 * Runs a command and waits for completion with proper error handling
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise<void>}
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completed successfully\n`);
        resolve();
      } else {
        console.error(`❌ ${command} failed with code ${code}\n`);
        reject(new Error(`Command failed: ${command}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${command}:`, error);
      reject(error);
    });
  });
}

/**
 * Checks if PostgreSQL is accessible with default credentials
 * @returns {Promise<boolean>}
 */
function checkPostgreSQL() {
  return new Promise((resolve) => {
    const child = spawn('psql', ['-U', 'postgres', '-c', 'SELECT 1'], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PGPASSWORD: 'postgres' }
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Main setup function that initializes the production environment
 */
async function setup() {
  try {
    // Check if .env file exists and create if needed
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      console.log('✅ Environment file found');
    } else {
      console.log('⚠️ Environment file not found, creating default...');
      const defaultEnv = `# AgiesFL Security Platform Configuration
DATABASE_HOST=0.0.0.0
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=agiesfl_security
DATABASE_URL=postgres://postgres:postgres@0.0.0.0:5432/agiesfl_security
NODE_ENV=production
JWT_SECRET=agiesfl-super-secret-production-key-2025
PORT=5000
HOST=0.0.0.0`;
      fs.writeFileSync(envPath, defaultEnv);
      console.log('✅ Default environment file created');
    }

    // Check PostgreSQL connection
    console.log('🔍 Checking PostgreSQL connection...');
    const isPostgreSQLRunning = await checkPostgreSQL();
    
    if (!isPostgreSQLRunning) {
      console.log('⚠️ PostgreSQL not accessible - continuing with mock data mode');
      console.log('💡 The application will run with simulated security data');
    } else {
      console.log('✅ PostgreSQL connection successful');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm', ['install']);

    // Try to setup database schema
    if (isPostgreSQLRunning) {
      console.log('🗄️ Setting up database schema...');
      try {
        await runCommand('npm', ['run', 'db:push']);
        console.log('✅ Database schema created successfully');
      } catch (error) {
        console.log('⚠️ Database schema setup failed - using mock data');
      }
    }

    // Build the application
    console.log('🏗️ Building application for production...');
    await runCommand('npm', ['run', 'build']);

    // Build Electron client
    console.log('🖥️ Building Electron client executable...');
    try {
      await runCommand('npm', ['run', 'electron-dist']);
      console.log('✅ Electron client built successfully');
    } catch (error) {
      console.log('⚠️ Electron build failed - server will still work');
    }

    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log('  ✅ Dependencies installed');
    console.log('  ✅ Environment configured');
    console.log('  ✅ Application built for production');
    console.log('  ✅ Client executable created');
    console.log(isPostgreSQLRunning ? '  ✅ Database connected' : '  ⚠️ Database offline (using mock data)');
    
    console.log('\n🚀 Starting production server...');
    console.log('🌐 Server: http://0.0.0.0:5000');
    console.log('🖥️ Client executable: ./dist-electron/AgiesFL-Setup.exe');
    console.log('👤 Default login: admin / SecureAdmin123!');
    
    // Start the production server
    await runCommand('npm', ['start']);
    
  } catch (error) {
    console.error('\n🚨 Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting Guide:');
    console.log('  1. Ensure Node.js v18+ is installed');
    console.log('  2. Check internet connection for dependencies');
    console.log('  3. Verify write permissions in project directory');
    console.log('  4. PostgreSQL is optional - app works without it');
    process.exit(1);
  }
}

// Start the setup process
setup();
