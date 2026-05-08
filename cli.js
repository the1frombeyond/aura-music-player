#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this package is installed
const packageDir = path.dirname(fs.realpathSync(__filename));
const mainJsPath = path.join(packageDir, 'main.js');

// Find electron path
let electronPath = null;
const possiblePaths = [
    path.join(packageDir, 'node_modules', '.bin', 'electron.cmd'),
    path.join(packageDir, 'node_modules', '.bin', 'electron'),
    path.join(packageDir, 'node_modules', 'electron', 'dist', 'electron.exe')
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        electronPath = p;
        break;
    }
}

if (!electronPath) {
    console.error('Electron not found. Please install it: npm install -g electron');
    process.exit(1);
}

// Execute with proper quoting for paths with spaces
const cmd = `"${electronPath}" "${mainJsPath}"`;
const child = exec(cmd, { stdio: 'inherit' });

child.on('close', (code) => process.exit(code || 0));
