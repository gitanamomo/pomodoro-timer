const { app, BrowserWindow, Notification, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile('src/index.html');

  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理通知请求
ipcMain.handle('show-notification', async (event, { title, body }) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: body,
      silent: false
    });
    notification.show();
    return true;
  }
  return false;
});