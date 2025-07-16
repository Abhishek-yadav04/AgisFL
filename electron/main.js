
import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let flaskProcess;

// Flask server management
function startFlaskServer() {
  const pythonPath = 'E:/abhishek/AgisFL-1/.venv/Scripts/python.exe';
  flaskProcess = spawn(pythonPath, ['app.py'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    env: {
      ...process.env,
      FLASK_APP: 'app.py',
      FLASK_ENV: isDev ? 'development' : 'production'
    }
  });

  flaskProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Flask: ${output}`);
  });

  flaskProcess.stderr.on('data', (data) => {
    console.error(`Flask Error: ${data}`);
  });

  flaskProcess.on('close', (code) => {
    console.log(`Flask process exited with code ${code}`);
  });
}

function stopFlaskServer() {
  if (flaskProcess) {
    flaskProcess.kill();
    flaskProcess = null;
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Wait for Flask server to start and be ready
  let serverStarted = false;
  
  flaskProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Flask: ${output}`);
    if (output.includes('Starting FL-IDS Enterprise Backend')) {
      serverStarted = true;
      mainWindow.loadURL('http://localhost:5001');
    }
  });

  // Fallback if server doesn't start in time
  setTimeout(() => {
    if (!serverStarted) {
      mainWindow.loadURL('http://localhost:5000');
    }
  }, 5000);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Incident',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-incident');
          }
        },
        {
          label: 'Export Report',
          accelerator: 'CmdOrCtrl+E',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              defaultPath: 'cybershield-report.pdf',
              filters: [
                { name: 'PDF Files', extensions: ['pdf'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-action', 'export-report', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('navigate', '/dashboard');
          }
        },
        {
          label: 'Incidents',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('navigate', '/incidents');
          }
        },
        {
          label: 'Threats',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('navigate', '/threats');
          }
        },
        {
          label: 'Analytics',
          accelerator: 'CmdOrCtrl+4',
          click: () => {
            mainWindow.webContents.send('navigate', '/analytics');
          }
        },
        {
          label: 'Forensics',
          accelerator: 'CmdOrCtrl+5',
          click: () => {
            mainWindow.webContents.send('navigate', '/forensics');
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            mainWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Security',
      submenu: [
        {
          label: 'Start FL-IDS Monitoring',
          click: () => {
            mainWindow.webContents.send('menu-action', 'start-monitoring');
          }
        },
        {
          label: 'Stop FL-IDS Monitoring',
          click: () => {
            mainWindow.webContents.send('menu-action', 'stop-monitoring');
          }
        },
        { type: 'separator' },
        {
          label: 'System Health Check',
          click: () => {
            mainWindow.webContents.send('menu-action', 'health-check');
          }
        },
        {
          label: 'Generate Security Report',
          click: () => {
            mainWindow.webContents.send('menu-action', 'generate-report');
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.minimize();
          }
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.close();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About CyberShield',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About CyberShield',
              message: 'CyberShield FL-IDS',
              detail: 'Enterprise Federated Learning Intrusion Detection System\nVersion 1.0.0\n\nBuilt with Electron and Flask'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  startFlaskServer();
  createMenu();
  setTimeout(() => {
    createWindow();
  }, 2000);  // Give Flask server time to start

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopFlaskServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopFlaskServer();
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});
