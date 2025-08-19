const { app, BrowserWindow, Menu, shell, dialog, globalShortcut, screen, nativeTheme, Notification } = require('electron');
const electron = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

let mainWindow;
let backendProcess;
let isQuitting = false;
let backendReady = false;

function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('[BACKEND] Starting AgisFL Enterprise Backend...');
    
    const backendPath = path.join(__dirname, '../../backend');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // Set up proper Python environment
    const env = {
      ...process.env,
      PYTHONPATH: backendPath,
      PYTHONUNBUFFERED: '1'
    };
    
    backendProcess = spawn(pythonCmd, ['main_minimal.py'], {
      cwd: backendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: env
    });
    
    backendProcess.stdout.on('data', (data) => {
      console.log(`[BACKEND] ${data.toString()}`);
      if (data.toString().includes('Uvicorn running') || data.toString().includes('Application startup complete')) {
        backendReady = true;
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`[BACKEND ERROR] ${data.toString()}`);
      // Don't reject on stderr as some libraries output warnings there
    });
    
    backendProcess.on('close', (code) => {
      console.log(`[BACKEND] Process exited with code ${code}`);
      backendReady = false;
      if (code !== 0 && code !== null) {
        console.error(`[BACKEND] Backend process failed with exit code ${code}`);
      }
    });
    
    backendProcess.on('error', (error) => {
      console.error(`[BACKEND] Failed to start backend process:`, error);
      reject(error);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!backendReady) {
        console.log('[BACKEND] Timeout - proceeding anyway');
        resolve();
      }
    }, 30000);
  });
}

function checkBackendHealth() {
  return new Promise((resolve) => {
    const client = net.createConnection({ port: 8001, host: '127.0.0.1' }, () => {
      client.end();
      resolve(true);
    });
    
    client.on('error', () => {
      resolve(false);
    });
    
    setTimeout(() => {
      client.destroy();
      resolve(false);
    }, 5000);
  });
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1920, width * 0.95),
    height: Math.min(1080, height * 0.95),
    minWidth: 1400,
    minHeight: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    title: "AgisFL Military Enterprise - CLASSIFIED",
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    backgroundColor: '#111827',
    titleBarStyle: 'default'
  });

  // Load military dashboard
  async function loadDashboard() {
    const isHealthy = await checkBackendHealth();
    
    if (isHealthy) {
      console.log('[ELECTRON] Loading dashboard...');
      // Force load the military dashboard
      try {
        // Clear cache to avoid stale frontend assets
        await mainWindow.webContents.session.clearCache();
      } catch (_) { /* ignore */ }
      const cacheBust = `v=${Date.now()}`;
      mainWindow.loadURL(`http://127.0.0.1:8001/app?${cacheBust}`).catch((err) => {
        console.error('[ELECTRON] Failed to load dashboard:', err);
        // Try direct app route
        mainWindow.loadURL('http://127.0.0.1:8001/app').catch(() => {
          loadFallback();
        });
      });
    } else {
      console.log('[ELECTRON] Backend not ready, loading fallback...');
      loadFallback();
    }
  }
  
  function loadFallback() {
    const fallbackHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AgisFL Military Enterprise</title>
      <style>
        body { background: #111827; color: #fff; font-family: monospace; padding: 50px; text-align: center; }
        .loading { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      </style>
    </head>
    <body>
      <h1 class="loading">⚡ AgisFL Military Enterprise</h1>
      <p>CLASSIFIED - Initializing Backend Systems...</p>
      <p>Please wait while the military-grade FL-IDS platform starts up.</p>
      <button onclick="location.reload()">Retry Connection</button>
    </body>
    </html>`;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHTML)}`);
    
    // Retry every 5 seconds
    setTimeout(loadDashboard, 5000);
  }
  
  loadDashboard();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    
    if (Notification.isSupported()) {
      new Notification({
        title: 'AgisFL Enterprise v1.0',
        body: 'Professional Security Intelligence Platform is ready!'
      }).show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    cleanup();
  });

  // Simple menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AgisFL Enterprise',
          click: () => showAboutDialog()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  return mainWindow;
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About AgisFL Enterprise',
    message: 'AgisFL Enterprise Security Platform v1.0',
    detail: `Professional Security Intelligence Platform

Features:
• Real-time system monitoring
• Attack simulation engine
• AutoML pipeline
• Advanced analytics
• Enterprise security center
• Data management suite

Built with Electron ${process.versions.electron}
Node.js ${process.versions.node}
Chromium ${process.versions.chrome}`,
    buttons: ['OK']
  });
}

function cleanup() {
  globalShortcut.unregisterAll();
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
  }
}

app.whenReady().then(async () => {
  console.log('[STARTUP] AgisFL Military Enterprise Desktop Application Starting...');
  
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.agisfl.military.enterprise');
  }
  
  // Start backend first
  try {
    await startBackend();
    console.log('[STARTUP] Backend started successfully');
  } catch (error) {
    console.error('[STARTUP] Backend start failed:', error);
  }
  
  // Wait a bit for backend to fully initialize
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});