#!/usr/bin/env node

/**
 * Parvaah Cross-Platform Setup Script (Node.js)
 * Compatible with Windows, Linux, and macOS.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT_DIR,
    stdio: options.stdio || 'inherit',
    shell: options.shell !== undefined ? options.shell : false,
    env: { ...process.env, ...options.env },
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
  return result;
}

console.log('\x1b[1m\x1b[32m================================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m  Parvaah - Automated Project Setup (Cross-Platform)\x1b[0m');
console.log(`  Root: ${ROOT_DIR}`);
console.log(`  Platform: ${process.platform}`);
console.log('\x1b[1m\x1b[32m================================================================\x1b[0m');

// 1. Environment Configuration
console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Step 1/5: Checking environment configuration (.env)...');
const envFile = path.join(ROOT_DIR, '.env');
const envExample = path.join(ROOT_DIR, '.env.example');

if (!fs.existsSync(envFile)) {
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log('\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Created .env from .env.example');
  } else {
    console.log('\x1b[1m\x1b[33m[WARN]\x1b[0m .env.example not found.');
  }
} else {
  console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m .env file already exists.');
}

// 2. Python Virtual Environment
console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Step 2/5: Setting up Python environment...');
let pythonBin = isWindows ? 'python' : 'python3';
const checkPy = spawnSync(pythonBin, ['--version'], { shell: isWindows });
if (checkPy.status !== 0 && isWindows) {
  pythonBin = 'py';
}

const venvDir = path.join(ROOT_DIR, '.venv');
if (!fs.existsSync(venvDir)) {
  console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Creating Python virtual environment (.venv)...');
  run(pythonBin, ['-m', 'venv', '.venv'], { shell: false });
  console.log('\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Virtual environment created.');
}

const venvPython = isWindows
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

const activePython = fs.existsSync(venvPython) ? venvPython : pythonBin;

console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Installing Python dependencies from requirements.txt...');
run(activePython, ['-m', 'pip', 'install', '--quiet', '--upgrade', 'pip'], { shell: false });
run(activePython, ['-m', 'pip', 'install', '--quiet', '-r', path.join(ROOT_DIR, 'requirements.txt')], { shell: false });
console.log('\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Python dependencies installed.');

// 3. Node.js & Monorepo Packages
console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Step 3/5: Setting up Node.js workspace dependencies...');
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

run(npmCmd, ['install'], { shell: false });
console.log('\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Node.js dependencies installed.');

// 4. Build Shared Monorepo Packages
console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Step 4/5: Building shared TypeScript packages...');
run(npmCmd, ['run', 'build', '--workspaces', '--if-present'], { shell: false });
console.log('\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Monorepo packages built successfully.');

// 5. Database Initialization & Ingestion
console.log('\x1b[1m\x1b[36m[SETUP]\x1b[0m Step 5/5: Initializing and seeding database...');
const backendDir = path.join(ROOT_DIR, 'apps', 'backend');
const seedCode = 'from app.database import SessionLocal, init_db; from app.ingest.real_data_loader import run_real_ingestion; init_db(); db = SessionLocal(); run_real_ingestion(db); db.close()';

run(activePython, ['-c', seedCode], {
  cwd: backendDir,
  shell: false,
  env: { PYTHONPATH: backendDir },
});
console.log('\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Database initialized and ingested with GSI zones, MoRTH roads, and telemetry.');

console.log('\n\x1b[1m\x1b[32m================================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m  🎉 Parvaah setup completed successfully!\x1b[0m');
console.log('\x1b[1m\x1b[32m================================================================\x1b[0m');
console.log('To start development servers:');
console.log(`  ${isWindows ? 'cli.bat --dev' : './cli.sh --dev'}   (or npm run dev)`);
console.log('To run tests:');
console.log(`  ${isWindows ? 'cli.bat --test' : './cli.sh --test'}  (or pytest apps/backend/tests)`);
console.log('\x1b[1m\x1b[32m================================================================\x1b[0m');
