const { spawn } = require('child_process');
const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalIp();

console.log('\n========================================================');
console.log(`📱 Access HRMS on your mobile or other devices via:`);
console.log(`👉 http://${ip}:3000`);
console.log('========================================================\n');

const path = require('path');
const nextPath = path.resolve(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn('node', [nextPath, 'dev', '--turbo', '-H', '0.0.0.0'], { stdio: 'inherit' });

child.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
});
