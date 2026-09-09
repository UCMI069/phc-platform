// Starts both auth server + Vite dev server
import { spawn } from 'child_process';

console.log('Starting PHC Platform...\n');

const auth = spawn('node', ['server/auth.js'], {
  stdio: 'inherit',
  shell: true,
});

const vite = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '3000'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

auth.on('error', (err) => console.error('Auth server error:', err));
vite.on('error', (err) => console.error('Vite error:', err));

process.on('SIGINT', () => {
  auth.kill();
  vite.kill();
  process.exit();
});
