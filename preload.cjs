const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onFileLoaded: (callback) => ipcRenderer.on('file-loaded', (_event, data) => callback(data)),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  saveAsFile: (data) => ipcRenderer.invoke('save-as-file', data),
  onAppCloseRequest: (callback) => ipcRenderer.on('app-close-request', () => callback()),
  closeWindowConfirmed: () => ipcRenderer.send('close-window-confirmed'),
  showUnsavedDialog: () => ipcRenderer.invoke('show-unsaved-dialog'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  rendererReady: () => ipcRenderer.send('renderer-ready'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
});
