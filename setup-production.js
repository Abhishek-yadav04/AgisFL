
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up AgiesFL Security Platform for Production...\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found. Please create it with your database credentials.');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🗄️ Pushing database schema...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  console.log('🎯 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Production setup complete!');
  console.log('🚀 Run "npm start" to launch the application');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
