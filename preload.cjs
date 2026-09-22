const { contextBridge, ipcRenderer } = require('electron');

let fileLoadedHandler = null;
let appCloseRequestHandler = null;
let windowStateChangeHandler = null;
let directoryLoadedHandler = null;

contextBridge.exposeInMainWorld('api', {
  onFileLoaded: (callback) => {
    if (fileLoadedHandler) ipcRenderer.removeListener('file-loaded', fileLoadedHandler);
    fileLoadedHandler = (_event, data) => callback(data);
    ipcRenderer.on('file-loaded', fileLoadedHandler);
  },
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveAsFile: (data) => ipcRenderer.invoke('save-as-file', data),
  onAppCloseRequest: (callback) => {
    if (appCloseRequestHandler) ipcRenderer.removeListener('app-close-request', appCloseRequestHandler);
    appCloseRequestHandler = () => callback();
    ipcRenderer.on('app-close-request', appCloseRequestHandler);
  },
  closeWindowConfirmed: () => ipcRenderer.send('close-window-confirmed'),
  showUnsavedDialog: () => ipcRenderer.invoke('show-unsaved-dialog'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  rendererReady: () => ipcRenderer.send('renderer-ready'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  setAsDefault: () => ipcRenderer.invoke('set-as-default'),
  exportToPDF: (data) => ipcRenderer.invoke('export-to-pdf', data),
  printDocument: (data) => ipcRenderer.invoke('print-document', data),
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  saveAssetImage: (data) => ipcRenderer.invoke('save-asset-image', data),
  onWindowStateChange: (callback) => {
    if (windowStateChangeHandler) ipcRenderer.removeListener('window-state-change', windowStateChangeHandler);
    windowStateChangeHandler = (_event, state) => callback(state);
    ipcRenderer.on('window-state-change', windowStateChangeHandler);
  },
  checkWindowsIntegration: () => ipcRenderer.invoke('check-windows-integration'),
  setupWindowsIntegration: (options) => ipcRenderer.invoke('setup-windows-integration', options),
  onDirectoryLoaded: (callback) => {
    if (directoryLoadedHandler) ipcRenderer.removeListener('open-directory', directoryLoadedHandler);
    directoryLoadedHandler = (_event, dirPath) => callback(dirPath);
    ipcRenderer.on('open-directory', directoryLoadedHandler);
  },
  cancelAppClose: () => ipcRenderer.send('cancel-app-close'),
});
