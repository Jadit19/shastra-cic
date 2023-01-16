const { app, BrowserWindow } = require('electron');
const Remote = require('@electron/remote/main');
const isDev = require('electron-is-dev');
const path = require('path');

Remote.initialize();

const createWindow = () => {
   const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
      contextIsolation: false,
      enableRemoteModule: true
    }
   });

   win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
   );
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform != 'darwin'){
    app.quit();
  };
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0){
    createWindow();
  };
});