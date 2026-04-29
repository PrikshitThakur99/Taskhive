#!/usr/bin/env node
/**
 * TaskHive Setup Checker
 * Run: node check-setup.js
 * This checks your environment before you start the servers.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

const ok  = (msg) => { console.log(`  ✅ ${msg}`); passed++; };
const err = (msg) => { console.log(`  ❌ ${msg}`); failed++; };
const warn= (msg) => console.log(`  ⚠️  ${msg}`);
const sep = ()    => console.log('');

console.log('\n🐝 TaskHive Setup Checker\n' + '='.repeat(40));

// ── 1. Node version ──────────────────────────────
sep();
console.log('1. Node.js');
try {
  const v = process.version;
  const major = parseInt(v.slice(1));
  major >= 16 ? ok(`Node ${v}`) : err(`Node ${v} — need v16+. Download: https://nodejs.org`);
} catch { err('Cannot detect Node version'); }

// ── 2. .env file ────────────────────────────────
sep();
console.log('2. Backend .env file');
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
  err('.env not found in backend/');
  warn('Fix: copy backend/.env.example → backend/.env then edit MONGO_URI');
} else {
  ok('.env file exists');
  const env = fs.readFileSync(envPath, 'utf8');

  // Check MONGO_URI
  const mongoLine = env.match(/^MONGO_URI\s*=\s*(.+)$/m)?.[1]?.trim();
  if (!mongoLine) {
    err('MONGO_URI not set in .env');
  } else if (mongoLine.includes('<') || mongoLine.includes('USERNAME')) {
    err(`MONGO_URI still has placeholder: ${mongoLine}`);
    warn('Fix: replace with real MongoDB URI, e.g.:');
    warn('  Local:  MONGO_URI=mongodb://localhost:27017/taskhive');
    warn('  Atlas:  MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskhive');
  } else {
    ok(`MONGO_URI set: ${mongoLine.slice(0, 40)}...`);
  }

  // Check JWT_SECRET
  const jwtLine = env.match(/^JWT_SECRET\s*=\s*(.+)$/m)?.[1]?.trim();
  if (!jwtLine || jwtLine.length < 10) {
    err('JWT_SECRET not set or too short');
  } else {
    ok('JWT_SECRET set');
  }
}

// ── 3. Frontend .env ─────────────────────────────
sep();
console.log('3. Frontend .env file');
const fenvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(fenvPath)) {
  err('.env not found in frontend/');
  warn('Fix: copy frontend/.env.example → frontend/.env');
} else {
  ok('.env file exists');
  const fenv = fs.readFileSync(fenvPath, 'utf8');
  const apiUrl = fenv.match(/^REACT_APP_API_URL\s*=\s*(.+)$/m)?.[1]?.trim();
  if (!apiUrl) {
    err('REACT_APP_API_URL not set');
  } else {
    ok(`REACT_APP_API_URL = ${apiUrl}`);
  }
}

// ── 4. node_modules ──────────────────────────────
sep();
console.log('4. Dependencies installed');
const backendModules  = path.join(__dirname, 'backend', 'node_modules');
const frontendModules = path.join(__dirname, 'frontend', 'node_modules');

if (fs.existsSync(backendModules))  ok('backend/node_modules exists');
else { err('backend/node_modules missing'); warn('Fix: cd backend && npm install'); }

if (fs.existsSync(frontendModules)) ok('frontend/node_modules exists');
else { err('frontend/node_modules missing'); warn('Fix: cd frontend && npm install'); }

// ── 5. Key backend files ─────────────────────────
sep();
console.log('5. Key files');
const required = [
  'backend/server.js',
  'backend/controllers/authController.js',
  'backend/models/User.js',
  'backend/routes/auth.js',
  'backend/middleware/auth.js',
  'frontend/src/App.js',
  'frontend/src/utils/api.js',
];
required.forEach(f => {
  const full = path.join(__dirname, f);
  fs.existsSync(full) ? ok(f) : err(`Missing: ${f}`);
});

// ── 6. MongoDB running locally ────────────────────
sep();
console.log('6. Local MongoDB (only needed if using localhost URI)');
try {
  execSync('mongod --version', { stdio: 'pipe' });
  ok('mongod binary found');
  warn('Make sure mongod is actually running: `mongod` or `brew services start mongodb-community`');
} catch {
  warn('mongod not in PATH — if using Atlas, ignore this. If local, install MongoDB Community.');
}

// ── Summary ───────────────────────────────────────
sep();
console.log('='.repeat(40));
console.log(`Result: ${passed} passed, ${failed} failed`);
sep();

if (failed === 0) {
  console.log('🎉 Everything looks good! Start with:');
  console.log('   npm run dev');
  console.log('   (or: cd backend && npm run dev   +   cd frontend && npm start)');
} else {
  console.log('🔧 Fix the issues above, then run `node check-setup.js` again.');
}
console.log('\nOnce running, open: http://localhost:3000');
console.log('Backend health: http://localhost:5000/api/health\n');
