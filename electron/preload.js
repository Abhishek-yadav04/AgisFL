
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  onNavigate: (callback) => ipcRenderer.on('navigate', callback),
  
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // System info
  platform: process.platform,
  arch: process.arch,
  
  // App control
  quit: () => ipcRenderer.send('quit-app'),
  minimize: () => ipcRenderer.send('minimize-app'),
  
  // Notifications
  showNotification: (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  },
  
  requestNotificationPermission: async () => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
});

// Enhanced window controls for desktop app
contextBridge.exposeInMainWorld('desktopAPI', {
  isElectron: true,
  
  // File operations
  exportData: async (data, filename) => {
    const result = await ipcRenderer.invoke('show-save-dialog', {
      defaultPath: filename,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      // Signal to save data to the selected path
      return { success: true, filePath: result.filePath };
    }
    return { success: false };
  },
  
  // System integration
  openExternal: (url) => ipcRenderer.send('open-external', url),
  
  // App state management
  setAppTitle: (title) => ipcRenderer.send('set-title', title),
  setBadgeCount: (count) => ipcRenderer.send('set-badge-count', count),
  
  // Desktop notifications with actions
  showAdvancedNotification: (options) => {
    ipcRenderer.send('show-advanced-notification', options);
  }
});
