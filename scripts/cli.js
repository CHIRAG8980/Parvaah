#!/usr/bin/env node

/**
 * Parvaah Universal CLI Runner (Node.js)
 * Cross-platform entrypoint for Windows, macOS, and Linux.
 */

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const args = process.argv.slice(2);
const action = args[0] || '--help';

const pnpmCmd = isWindows ? 'pnpm.cmd' : 'pnpm';

function run(command, cmdArgs, options = {}) {
  const result = spawnSync(command, cmdArgs, {
    cwd: options.cwd || ROOT_DIR,
    stdio: 'inherit',
    shell: options.shell !== undefined ? options.shell : false,
    env: { ...process.env, ...options.env },
  });
  if (result.error) throw result.error;
  process.exit(result.status || 0);
}

switch (action) {
  case '--setup':
  case '-s':
  case 'setup': {
    const setupScript = path.join(__dirname, 'setup.js');
    run(process.execPath, [setupScript], { shell: false });
    break;
  }
  case '--dev':
  case '-d':
  case 'dev': {
    run(pnpmCmd, ['dev'], { shell: false });
    break;
  }
  case '--test':
  case '-t':
  case 'test': {
    const venvPytest = isWindows
      ? path.join(ROOT_DIR, '.venv', 'Scripts', 'pytest.exe')
      : path.join(ROOT_DIR, '.venv', 'bin', 'pytest');
    const testArgs = args.slice(1);
    run(venvPytest, ['apps/backend/tests', ...testArgs], { shell: false });
    break;
  }
  case '--build':
  case '-b':
  case 'build': {
    run(pnpmCmd, ['run', 'build'], { shell: false });
    break;
  }
  case '--help':
  case '-h':
  case 'help':
  default: {
    console.log('\x1b[1m\x1b[32m================================================================\x1b[0m');
    console.log('\x1b[1m\x1b[32m  Parvaah Unified CLI (Cross-Platform)\x1b[0m');
    console.log('\x1b[1m\x1b[32m================================================================\x1b[0m\n');
    console.log('Usage:');
    console.log('  pnpm cli [command|flag]');
    console.log('  node scripts/cli.js [command|flag]');
    console.log('  cli.bat [command|flag]        (Windows CMD)');
    console.log('  .\\cli.ps1 [command|flag]      (Windows PowerShell)');
    console.log('  ./cli.sh [command|flag]       (Linux / macOS)\n');
    console.log('Options:');
    console.log('  --setup, -s    Bootstrap full fresh environment (venv, dependencies, database seeding)');
    console.log('  --dev, -d      Run FastAPI backend and Next.js frontend development servers');
    console.log('  --test, -t     Run automated backend pytest suite');
    console.log('  --build, -b    Build all workspace packages and Next.js web application');
    console.log('  --help, -h     Show this help menu\n');
    process.exit(0);
  }
}
