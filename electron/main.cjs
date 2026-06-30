const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');
const path = require('path');

let mainWindow = null;
let serverProcess = null;

const DEV_URL = 'http://localhost:5173';
const PROD_URL = 'http://127.0.0.1:3001';
const userDataDir = path.join(__dirname, '..', '.electron-user-data');
const SERVER_START_TIMEOUT_MS = 120000;

app.setPath('userData', userDataDir);

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'server.cjs');
    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: '3001', ELECTRON: '1' },
      stdio: 'pipe',
    });

    let settled = false;
    const finish = (fn) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new Error('API server did not start within 120 seconds. Check SQL Server and connection settings.')));
    }, SERVER_START_TIMEOUT_MS);

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[server]', msg.trim());
      if (msg.includes('running at')) {
        clearTimeout(timeout);
        finish(resolve);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[server]', data.toString().trim());
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      finish(() => reject(error));
    });

    serverProcess.on('exit', (code) => {
      if (code && code !== 0) {
        clearTimeout(timeout);
        finish(() => reject(new Error(`Server exited with code ${code}`)));
      }
    });
  });
}

async function createWindow() {
  const loadUrl = app.isPackaged ? PROD_URL : `${DEV_URL}?v=${Date.now()}`;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 640,
    title: 'MSU: tables',
    backgroundColor: '#f4efe6',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null);
  const showWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  };

  mainWindow.once('ready-to-show', showWindow);
  await mainWindow.webContents.session.clearCache();
  await mainWindow.loadURL(loadUrl);
  showWindow();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
    await createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
    return;
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
