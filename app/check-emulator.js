// scripts/check-emulator.js
// Run this script to check for emulator settings: node scripts/check-emulator.js

console.log('🔍 Checking for Firebase Emulator Settings...\n');

// Check environment variables that might force emulator usage
const emulatorVars = [
  'FIRESTORE_EMULATOR_HOST',
  'FIREBASE_EMULATOR_HUB',
  'FIREBASE_AUTH_EMULATOR_HOST',
  'FIREBASE_DATABASE_EMULATOR_HOST',
  'FIREBASE_STORAGE_EMULATOR_HOST',
  'FIREBASE_FUNCTIONS_EMULATOR_HOST',
  'GCLOUD_PROJECT'
];

let foundEmulatorSettings = false;

console.log('Environment Variables Check:');
console.log('================================');

emulatorVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`❌ ${varName}: ${value}`);
    foundEmulatorSettings = true;
  } else {
    console.log(`✅ ${varName}: Not set`);
  }
});

// Check for firebase.json emulator configuration
const fs = require('fs');
const path = require('path');

console.log('\nFirebase Configuration Check:');
console.log('================================');

const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
if (fs.existsSync(firebaseJsonPath)) {
  try {
    const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    
    if (firebaseJson.emulators) {
      console.log('❌ firebase.json contains emulator configuration:');
      console.log(JSON.stringify(firebaseJson.emulators, null, 2));
      foundEmulatorSettings = true;
    } else {
      console.log('✅ firebase.json: No emulator configuration found');
    }
  } catch (error) {
    console.log('⚠️ firebase.json: Could not parse file');
  }
} else {
  console.log('✅ firebase.json: File not found (good for production)');
}

// Check for .firebaserc
const firebasercPath = path.join(process.cwd(), '.firebaserc');
if (fs.existsSync(firebasercPath)) {
  try {
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, 'utf8'));
    console.log('📋 .firebaserc found with project:', firebaserc.projects?.default || 'not specified');
  } catch (error) {
    console.log('⚠️ .firebaserc: Could not parse file');
  }
} else {
  console.log('✅ .firebaserc: File not found');
}

// Check current Firebase project
console.log('\nFirebase CLI Check:');
console.log('================================');

const { execSync } = require('child_process');
try {
  const currentProject = execSync('firebase use', { encoding: 'utf8' }).trim();
  console.log('📋 Current Firebase project:', currentProject);
} catch (error) {
  console.log('ℹ️ Firebase CLI not available or no project selected');
}

// Final recommendations
console.log('\n🎯 Recommendations:');
console.log('================================');

if (foundEmulatorSettings) {
  console.log('❌ ISSUE FOUND: Your environment is configured to use Firebase emulators!');
  console.log('\n📝 To fix this:');
  console.log('1. Remove or comment out emulator environment variables');
  console.log('2. Restart your development server');
  console.log('3. Make sure you\'re not running "firebase emulators:start"');
  console.log('\n🔧 Quick fix commands:');
  emulatorVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   unset ${varName}`);
    }
  });
} else {
  console.log('✅ No emulator settings detected');
  console.log('✅ Your environment should connect to production Firebase');
}

console.log('\n💡 Additional tips:');
console.log('- Make sure you\'re not running "firebase emulators:start" in another terminal');
console.log('- Check if your project has Firestore enabled in the Firebase Console');
console.log('- Verify your service account has the necessary permissions');

// Check if running in development
if (process.env.NODE_ENV === 'development') {
  console.log('\n🛠️ Development Environment Detected');
  console.log('- This is normal for local development');
  console.log('- Make sure your .env.local file has the correct production credentials');
}