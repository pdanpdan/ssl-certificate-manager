import {
  app,
  BrowserWindow,
  nativeTheme,
  screen,
} from 'electron';
import { initialize as electronRemoteInitialize, enable as electronRemoteEnable } from '@electron/remote/main';
import { unlinkSync } from 'fs';
import { join as pathJoin, resolve as pathResolve } from 'path';

electronRemoteInitialize();

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    unlinkSync(pathJoin(app.getPath('userData'), 'DevTools Extensions'));
  }
} catch (err) {
  // caught
}

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width,
    height: Math.floor(height / 2),
    x: 0,
    y: 0,
    useContentSize: true,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: true,
      devTools: process.env.DEBUGGING,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: pathResolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  electronRemoteEnable(mainWindow.webContents);

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    // mainWindow.webContents.on('devtools-opened', () => {
    //   mainWindow.webContents.closeDevTools();
    // });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
