
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AgiesFL Security Platform for Production...\n');

// Function to run command and wait for completion
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

// Function to check if PostgreSQL is running
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

async function setup() {
  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      console.log('✅ Environment file found');
    } else {
      console.log('⚠️ Environment file not found, creating default...');
      const defaultEnv = `DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=agiesfl_security
DATABASE_URL=postgres://postgres:postgres@localhost:5432/agiesfl_security
NODE_ENV=production
JWT_SECRET=agiesfl-super-secret-production-key-2025
PORT=5000`;
      fs.writeFileSync(envPath, defaultEnv);
      console.log('✅ Default environment file created');
    }

    // Check PostgreSQL connection
    console.log('🔍 Checking PostgreSQL connection...');
    const isPostgreSQLRunning = await checkPostgreSQL();
    
    if (!isPostgreSQLRunning) {
      console.log('⚠️ PostgreSQL not accessible with default credentials');
      console.log('💡 Make sure PostgreSQL is running and accessible');
      console.log('💡 Default credentials: postgres/postgres');
      console.log('💡 You can continue without database for demo purposes');
    } else {
      console.log('✅ PostgreSQL connection successful');
    }

    // Install dependencies
    console.log('📦 Installing dependencies...');
    await runCommand('npm', ['install']);

    // Try to push database schema
    console.log('🗄️ Setting up database schema...');
    try {
      await runCommand('npm', ['run', 'db:push']);
      console.log('✅ Database schema created successfully');
    } catch (error) {
      console.log('⚠️ Database schema setup failed - continuing without database');
      console.log('💡 The application will run with mock data');
    }

    // Build the application
    console.log('🏗️ Building application...');
    await runCommand('npm', ['run', 'build']);

    console.log('\n🎉 Production setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log('  ✅ Dependencies installed');
    console.log('  ✅ Environment configured');
    console.log('  ✅ Application built');
    console.log(isPostgreSQLRunning ? '  ✅ Database connected' : '  ⚠️ Database offline (using mock data)');
    
    console.log('\n🚀 Starting production server...');
    console.log('🌐 Application will be available at: http://0.0.0.0:5000');
    console.log('👤 Default login: admin / SecureAdmin123!');
    
  } catch (error) {
    console.error('\n🚨 Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Make sure Node.js is installed');
    console.log('  2. Check internet connection for npm install');
    console.log('  3. Verify PostgreSQL is running (optional)');
    console.log('  4. Check file permissions');
    process.exit(1);
  }
}

setup();
