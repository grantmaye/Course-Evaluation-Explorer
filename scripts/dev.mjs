import { spawn } from 'node:child_process';
const children = [spawn(process.execPath, ['--env-file-if-exists=.env', 'server/index.js'], { stdio: 'inherit' }), spawn('npx', ['vite'], { stdio: 'inherit', shell: process.platform === 'win32' })];
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; children.forEach((child) => child.kill()); process.exitCode = code; }
children.forEach((child) => child.on('exit', (code) => stop(code || 0)));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
