const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentFilePath = null;
const isDev = !app.isPackaged;

let fileToOpen = null;
let isRendererReady = false;

// Handle Windows file association argument
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('markdownreader', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('markdownreader');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      handleFileOpenArg(commandLine, workingDirectory);
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

function handleFileOpenArg(argv, workingDirectory = null) {
  const filePath = argv.find(arg => arg.toLowerCase().endsWith('.md'));
  if (filePath) {
    let resolvedPath = filePath;
    if (!path.isAbsolute(filePath)) {
      resolvedPath = workingDirectory 
        ? path.resolve(workingDirectory, filePath) 
        : path.resolve(filePath);
    }
    if (fs.existsSync(resolvedPath)) {
      if (isRendererReady) {
        openFile(resolvedPath);
      } else {
        fileToOpen = resolvedPath;
      }
    }
  }
}

function openFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    currentFilePath = filePath;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('file-loaded', { filePath, content });
    }
  } catch (err) {
    console.error("Failed to read file", err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 400,
    minHeight: 300,
    frame: false,
    show: false,
    backgroundColor: '#151515',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  let isSafeToClose = false;
  mainWindow.on('close', (e) => {
    if (!isSafeToClose) {
      e.preventDefault();
      mainWindow.webContents.send('app-close-request');
      // Removed the 3 second force-close timeout to ensure the user can cancel the close.
    }
  });

  ipcMain.on('close-window-confirmed', () => {
    isSafeToClose = true;
    mainWindow.close();
  });

  ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    handleFileOpenArg(process.argv, process.cwd());
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('renderer-ready', () => {
  isRendererReady = true;
  if (fileToOpen) {
    openFile(fileToOpen);
    fileToOpen = null;
  }
});

// IPC
ipcMain.handle('save-file', async (event, data) => {
  const { filePath, content } = data;
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  } else {
    return await handleSaveAs(content);
  }
});

ipcMain.handle('save-as-file', async (event, data) => {
  const { content, defaultName } = data;
  return await handleSaveAs(content, defaultName);
});

async function handleSaveAs(content, defaultName) {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Markdown As',
    defaultPath: defaultName,
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  }
  return { success: false, canceled: true };
}

ipcMain.handle('show-unsaved-dialog', async () => {
  const response = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Do you want to save before closing?'
  });
  return response.response;
});

ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    return items
      .filter(item => !item.name.startsWith('.') && item.name !== 'node_modules')
      .map(item => ({
        name: item.name,
        isDirectory: item.isDirectory(),
        path: path.join(dirPath, item.name)
      })).sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch (err) {
    console.error('Failed to read directory', err);
    return [];
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    console.error('Failed to read file', err);
    return { success: false };
  }
});
