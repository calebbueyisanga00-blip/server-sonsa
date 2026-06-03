const { app, BrowserWindow } = require('electron');
const path = require('path');

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

app.whenReady().then(() => {
  startAdminServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Keep the app running (server continues to run)
  // Only quit on Windows if explicitly requested via app menu
  if (process.platform !== 'darwin') {
    // Don't quit - server should keep running for admin panel access
    // User can access localhost:3001/admin.html even with the window closed
  }
});
