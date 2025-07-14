
#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 AgiesFL Security Platform - Production Setup');
console.log('================================================\n');

/**
 * Detect the correct Node.js executable path
 */
function getNodePath() {
  const possiblePaths = [
    process.execPath,
    '/usr/bin/node',
    '/usr/local/bin/node',
    'node'
  ];
  
  for (const nodePath of possiblePaths) {
    try {
      const result = spawn.spawnSync(nodePath, ['--version'], { stdio: 'pipe' });
      if (result.status === 0) {
        console.log(`✅ Node.js found: ${nodePath} (${result.stdout.toString().trim()})`);
        return nodePath;
      }
    } catch (error) {
      continue;
    }
  }
  
  console.error('❌ Node.js not found in system PATH');
  return 'node'; // Fallback
}

/**
 * Runs a command with proper error handling
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Executing: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully\n`);
        resolve();
      } else {
        console.error(`❌ Command failed with exit code ${code}\n`);
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error executing command:`, error.message);
      reject(error);
    });
  });
}

/**
 * Check if PostgreSQL is accessible
 */
function checkPostgreSQL() {
  return new Promise((resolve) => {
    console.log('🔍 Testing PostgreSQL connection...');
    
    const child = spawn('psql', [
      '-h', '0.0.0.0',
      '-p', '5432',
      '-U', 'postgres',
      '-d', 'agiesfl_security',
      '-c', 'SELECT 1 as test;'
    ], {
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PGPASSWORD: 'postgres' }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PostgreSQL connection successful');
        resolve(true);
      } else {
        console.log('⚠️ PostgreSQL connection failed - using mock data mode');
        resolve(false);
      }
    });

    child.on('error', () => {
      console.log('⚠️ PostgreSQL not available - using mock data mode');
      resolve(false);
    });
  });
}

/**
 * Create environment file if it doesn't exist
 */
function setupEnvironment() {
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('✅ Environment file exists');
    return;
  }
  
  console.log('📝 Creating environment configuration...');
  
  const envContent = `# AgiesFL Security Platform Configuration
# Database Configuration
DATABASE_HOST=0.0.0.0
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=agiesfl_security
DATABASE_URL=postgres://postgres:postgres@0.0.0.0:5432/agiesfl_security

# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=agiesfl-security-platform-jwt-secret-2025
SESSION_SECRET=agiesfl-session-secret-2025

# Features
ENABLE_MOCK_DATA=true
ENABLE_FL_SIMULATION=true
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Environment file created');
}

/**
 * Main setup function
 */
async function setup() {
  try {
    const nodePath = getNodePath();
    
    console.log('🔧 Setting up AgiesFL Security Platform...\n');
    
    // Setup environment
    setupEnvironment();
    
    // Check database connectivity
    const dbConnected = await checkPostgreSQL();
    
    // Install dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm', ['install']);
    
    // Setup database if connected
    if (dbConnected) {
      console.log('🗄️ Setting up database schema...');
      try {
        await runCommand('npm', ['run', 'db:push']);
        console.log('✅ Database schema ready');
      } catch (error) {
        console.log('⚠️ Database setup failed - continuing with mock data');
      }
    }
    
    // Build application
    console.log('🏗️ Building application...');
    await runCommand('npm', ['run', 'build']);
    
    // Build Electron client
    console.log('🖥️ Building client executable...');
    try {
      await runCommand('npm', ['run', 'electron-dist']);
      console.log('✅ Client executable built successfully');
    } catch (error) {
      console.log('⚠️ Client build failed - server will still work');
    }
    
    // Success summary
    console.log('\n🎉 Setup Complete!');
    console.log('==================');
    console.log('✅ Dependencies installed');
    console.log('✅ Environment configured');
    console.log('✅ Application built');
    console.log(dbConnected ? '✅ Database connected' : '⚠️ Database offline (mock mode)');
    
    console.log('\n🚀 Starting AgiesFL Security Platform...');
    console.log('🌐 Access: http://0.0.0.0:5000');
    console.log('👤 Admin: admin / SecureAdmin123!');
    console.log('👤 Analyst: analyst / AnalystPass456!');
    
    // Start the server
    await runCommand(nodePath, ['dist/index.js']);
    
  } catch (error) {
    console.error('\n🚨 Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Node.js installation');
    console.log('2. Verify internet connectivity');
    console.log('3. Check file permissions');
    console.log('4. Database is optional - app works without it');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Setup interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Setup terminated');
  process.exit(0);
});

// Start setup
setup();
