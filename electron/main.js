const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let backendProcess

// Mitigate black/blank screen issues on some GPUs
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')

// Keep a global reference of the backend process
function createBackendProcess() {
  console.log('Starting Python backend...')
  const backendPath = path.join(__dirname, '..', 'backend')
  backendProcess = spawn('python', ['main.py'], {
    cwd: backendPath,
    env: { ...process.env, ELECTRON_MODE: '1', DISABLE_AUTHENTICATION: 'true', PYTHONIOENCODING: 'utf-8' }
  })
  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`)
  })
  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`)
  })
  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`)
  })
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
      webSecurity: false // Allow localhost connections
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#ffffff',
    show: false,
    titleBarStyle: 'default'
  })

  // Menu configuration
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AgisFL',
          click: () => {
            shell.openExternal('https://github.com/your-repo/agisfl')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  try {
    if (typeof Menu.setApplicationMenu === 'function') {
      Menu.setApplicationMenu(menu)
    }
  } catch (e) {
    console.warn('Could not set application menu:', e)
  }

  // Load UI and monitor backend readiness in parallel (don't block the UI)
  (async () => {
    const isDev = process.env.NODE_ENV === 'development';
    // Dev server may start on 5173 but Vite can pick another port if 5173 is busy.
    // Probe a small port range and pick the first responsive dev server.
    async function findDevServer() {
      const http = require('http');
      const ports = [5173, 5174, 5175, 5176, 5177];
      const timeout = 1500;
      for (const p of ports) {
        for (const host of ['localhost', '127.0.0.1']) {
          const url = `http://${host}:${p}`;
          try {
            const res = await new Promise((resolve, reject) => {
              const req = http.get(url, (r) => resolve(r));
              req.on('error', reject);
              req.setTimeout(timeout, () => {
                req.abort();
                reject(new Error('timeout'));
              });
            });
            if (res && res.statusCode === 200) {
              console.log(`Detected dev server on ${url}`);
              return url;
            }
          } catch (e) {
            // ignore and continue probing
          }
        }
      }
      return null;
    }
    const devUrl = await findDevServer();
    const prodFile = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
    const { dialog } = require('electron');

    // Try multiple health endpoints; backend can expose different ones
    const healthUrls = [
      'http://localhost:8000/health',
      'http://localhost:8000/api/health',
      'http://localhost:8000/readyz',
      'http://localhost:8000/healthz'
    ];
    const maxRetries = 120; // up to ~60s (120 * 500ms)
    const delayMs = 500;

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function waitForBackend() {
      const http = require('http');
      for (let i = 0; i < maxRetries; i++) {
        try {
          // Probe each health URL this iteration
          for (const url of healthUrls) {
            const res = await new Promise((resolve, reject) => {
              const req = http.get(url, (r) => resolve(r));
              req.on('error', reject);
              req.setTimeout(2500, () => {
                req.abort();
                reject(new Error('timeout'));
              });
            });
            if (res && (res.statusCode === 200 || res.statusCode === 204)) {
              console.log(`Backend health check passed via ${url}`);
              return true;
            }
          }
        } catch (e) {
          // ignore and retry
        }
        await sleep(delayMs)
      }
      return false
    }

    function showError(message) {
      dialog.showErrorBox('AgisFL Desktop Error', message || 'Unable to load frontend. Please ensure the Vite dev server or production build is available.')
    }

    // Attempt to load UI from multiple sources: dev server, packaged files, or backend-served SPA
    try {
      const fs = require('fs');
      if (devUrl) {
        await mainWindow.loadURL(devUrl);
        if (isDev) {
          mainWindow.webContents.openDevTools();
        }
      } else if (fs.existsSync(prodFile)) {
        await mainWindow.loadFile(prodFile);
      } else {
        // Try backend-served app as last resort
        const fallbackUrls = [
          'http://localhost:8000/api/app',
          'http://127.0.0.1:8000/api/app',
          'http://localhost:8000/api/app/',
          'http://localhost:8000'
        ];
        let loaded = false;
        for (const u of fallbackUrls) {
          try {
            await mainWindow.loadURL(u);
            console.log('Loaded UI from backend at', u);
            loaded = true;
            break;
          } catch (e) {
            // continue
          }
        }
        if (!loaded) {
          showError('No frontend available: dev server not detected, packaged build missing, and backend-served UI failed.');
        }
      }
    } catch (e) {
      console.error('Failed to load UI:', e);
      showError('Failed to load UI. See console for details.');
    }

    // Start backend readiness check in the background; just log if it never becomes ready
    (async () => {
      const ok = await waitForBackend();
      if (!ok) {
        console.warn('Backend did not become ready in time, but UI is loaded. You can still view the interface; API calls may fail until backend is ready.');
      } else {
        console.log('Backend is ready.');
      }
    })();

    // Show the window when it's ready to reduce black flashes
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });
    // Safety: if 'ready-to-show' doesn't fire in time, force show after a delay
    setTimeout(() => {
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show();
      }
    }, 5000);

    // Log load issues for troubleshooting
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('did-fail-load', { errorCode, errorDescription, validatedURL });
    });
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Renderer finished load');
    });
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('Render process gone', details);
    });
    // Handle link clicks - open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  })()

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createBackendProcess()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Kill backend process
    if (backendProcess) {
      backendProcess.kill()
    }
    app.quit()
  }
})

app.on('before-quit', () => {
  // Kill backend process before quitting
  if (backendProcess) {
    backendProcess.kill()
  }
})

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})