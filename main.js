const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function startAdminServer() {
  require('./server/index');
}

function checkAdminServer(port = 3001) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: '127.0.0.1', port, method: 'HEAD', path: '/admin.html', timeout: 1000 }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    const serverAlive = await checkAdminServer();
    if (!serverAlive) {
      startAdminServer();
    }
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  // Keep the app running (server continues to run)
  // Only quit on Windows if explicitly requested via app menu
  if (process.platform !== 'darwin') {
    // Don't quit - server should keep running for admin panel access
    // User can access localhost:3001/admin.html even with the window closed
  }
});
