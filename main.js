const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let pendingFilePath = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 550,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        title: "AURA Music Player"
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.on('did-finish-load', () => {
        if (pendingFilePath && mainWindow) {
            mainWindow.webContents.send('open-file', pendingFilePath);
            pendingFilePath = null;
        }
    });
}

// Handle second instance (Windows file open)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
        // Check for file argument
        const fileArg = commandLine.find(arg => /\.(mp3|wav|flac|m4a|aac)$/i.test(arg));
        if (fileArg && mainWindow) {
            if (mainWindow.webContents.isLoading()) {
                pendingFilePath = fileArg;
            } else {
                mainWindow.webContents.send('open-file', fileArg);
            }
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    // Handle file passed as command line argument
    const fileArg = process.argv.find(arg => /\.(mp3|wav|flac|m4a|aac)$/i.test(arg));
    if (fileArg) {
        pendingFilePath = fileArg;
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
