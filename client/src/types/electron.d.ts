
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  showSaveDialog: (options: any) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  onMenuAction: (callback: (...args: any[]) => void) => void;
  onNavigate: (callback: (event: any, path: string) => void) => void;
  removeAllListeners: (channel: string) => void;
  platform: string;
  arch: string;
  showNotification: (title: string, body: string) => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

export interface DesktopAPI {
  isElectron: boolean;
  exportData: (data: any, filename: string) => Promise<{ success: boolean; filePath?: string }>;
  openExternal: (url: string) => void;
  setAppTitle: (title: string) => void;
  setBadgeCount: (count: number) => void;
  showAdvancedNotification: (options: any) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    desktopAPI?: DesktopAPI;
  }
}
