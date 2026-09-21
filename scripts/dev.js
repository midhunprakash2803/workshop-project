const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

console.log('======================================================');
console.log('🚀 Starting RentIQ Full-Stack Services (Backend + Frontend)...');
console.log('======================================================\n');

function runProcess(name, command, args, cwd, color) {
  const proc = isWindows
    ? spawn('cmd.exe', ['/c', command, ...args], { cwd, stdio: ['inherit', 'pipe', 'pipe'] })
    : spawn(command, args, { cwd, stdio: ['inherit', 'pipe', 'pipe'] });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${color}[${name}]${'\x1b[0m'} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${color}[${name} ERR]${'\x1b[0m'} ${data}`);
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}] exited with code ${code}${'\x1b[0m'}`);
  });

  return proc;
}

const backendDir = path.join(__dirname, '..', 'backend');
const frontendDir = path.join(__dirname, '..', 'frontend');

// Start backend
const backend = runProcess('BACKEND', 'npm', ['run', 'dev'], backendDir, '\x1b[36m');

// Start frontend
const frontend = runProcess('FRONTEND', 'npm', ['run', 'dev'], frontendDir, '\x1b[35m');

function cleanup() {
  console.log('\n🛑 Shutting down full-stack development services...');
  if (backend) {
    if (isWindows) spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
    else backend.kill('SIGINT');
  }
  if (frontend) {
    if (isWindows) spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
    else frontend.kill('SIGINT');
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
