const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function logToFile(msg) {
  try {
    fs.appendFileSync(path.join(__dirname, 'electron_output.txt'), `${new Date().toISOString()} - ${msg}\n`, 'utf-8');
  } catch (e) {}
}

let mainWindow;
let currentFilePath = null;
const isDev = !app.isPackaged;

logToFile(`App starting. argv: ${JSON.stringify(process.argv)}, cwd: ${process.cwd()}`);

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
logToFile(`gotTheLock: ${gotTheLock}`);

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    logToFile(`second-instance event. commandLine: ${JSON.stringify(commandLine)}, workingDirectory: ${workingDirectory}`);
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
  logToFile(`handleFileOpenArg. argv: ${JSON.stringify(argv)}, workingDirectory: ${workingDirectory}`);
  const rawFilePath = argv.find(arg => {
    const cleaned = arg.replace(/^"+|"+$/g, '');
    return cleaned.toLowerCase().endsWith('.md');
  });
  logToFile(`Found rawFilePath: ${rawFilePath}`);
  if (rawFilePath) {
    const filePath = rawFilePath.replace(/^"+|"+$/g, '');
    let resolvedPath = filePath;
    if (!path.isAbsolute(filePath)) {
      resolvedPath = workingDirectory 
        ? path.resolve(workingDirectory, filePath) 
        : path.resolve(filePath);
    }
    logToFile(`Resolved path: ${resolvedPath}`);
    if (fs.existsSync(resolvedPath)) {
      logToFile(`File exists. isRendererReady: ${isRendererReady}`);
      if (isRendererReady) {
        openFile(resolvedPath);
      } else {
        fileToOpen = resolvedPath;
        logToFile(`Set fileToOpen = ${resolvedPath}`);
      }
    } else {
      logToFile(`File does not exist: ${resolvedPath}`);
    }
  }
}

app.setAppUserModelId('com.adamk.markdownreader');

async function openFile(filePath) {
  try {
    logToFile(`openFile: reading ${filePath}`);
    const content = await fs.promises.readFile(filePath, 'utf-8');
    currentFilePath = filePath;
    if (mainWindow && !mainWindow.isDestroyed()) {
      logToFile(`Sending file-loaded event to renderer`);
      mainWindow.webContents.send('file-loaded', { filePath, content });
    } else {
      logToFile(`mainWindow is null or destroyed`);
    }
  } catch (err) {
    logToFile(`Failed to read file: ${err.message}`);
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
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });


  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    logToFile(`RENDERER CONSOLE: [Level ${level}] ${message} (from ${sourceId}:${line})`);
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

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

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-change', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-change', { isMaximized: false });
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
    logToFile(`did-finish-load event. Calling handleFileOpenArg with process.argv: ${JSON.stringify(process.argv)}, process.cwd: ${process.cwd()}`);
    handleFileOpenArg(process.argv, process.cwd());
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('renderer-ready', () => {
  logToFile(`renderer-ready event. isRendererReady was ${isRendererReady}, fileToOpen is ${fileToOpen}`);
  isRendererReady = true;
  if (fileToOpen) {
    openFile(fileToOpen);
    fileToOpen = null;
  }
});

// IPC File Operations (Asynchronous & Non-Blocking)
ipcMain.handle('save-file', async (event, data) => {
  const { filePath, content } = data;
  if (filePath) {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return { success: true, filePath };
    } catch (err) {
      console.error('Failed to save file:', err);
      return { success: false, error: err.message };
    }
  } else {
    return await handleSaveAs(content);
  }
});

ipcMain.handle('save-as-file', async (event, data) => {
  const { content, defaultName } = data;
  return await handleSaveAs(content, defaultName);
});

async function handleSaveAs(content, defaultName) {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Markdown As',
    defaultPath: defaultName,
    filters: [{ name: 'Markdown Document', extensions: ['md'] }]
  });
  if (!canceled && filePath) {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return { success: true, filePath };
    } catch (err) {
      console.error('Failed to save as file:', err);
      return { success: false, error: err.message };
    }
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
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
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
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (err) {
    console.error('Failed to read file', err);
    return { success: false, error: err.message };
  }
});

// PDF Export Handler
ipcMain.handle('export-to-pdf', async (event, options = {}) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Document to PDF',
      defaultPath: options.defaultName || 'Document.pdf',
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    });
    if (canceled || !filePath) return { success: false, canceled: true };

    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: options.pageSize || 'A4',
      margins: {
        marginType: 'standard'
      }
    });
    await fs.promises.writeFile(filePath, pdfData);
    return { success: true, filePath };
  } catch (err) {
    console.error('Failed to export PDF:', err);
    return { success: false, error: err.message };
  }
});

// Local Asset Image Saver (for clipboard paste and drag & drop)
ipcMain.handle('save-asset-image', async (event, { base64Data, activeFilePath, fileName }) => {
  try {
    let targetDir;
    if (activeFilePath) {
      targetDir = path.join(path.dirname(activeFilePath), 'assets');
    } else {
      targetDir = path.join(app.getPath('userData'), 'assets');
    }
    await fs.promises.mkdir(targetDir, { recursive: true });
    const cleanName = fileName || `image-${Date.now()}.png`;
    const fullPath = path.join(targetDir, cleanName);
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    await fs.promises.writeFile(fullPath, buffer);

    const relativePath = activeFilePath ? `./assets/${cleanName}` : `file://${fullPath.replace(/\\/g, '/')}`;
    return { success: true, relativePath, fullPath };
  } catch (err) {
    console.error('Failed to save asset image:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('set-as-default', async () => {
  if (process.platform !== 'win32') return { success: false, error: 'Only supported on Windows' };
  const { exec } = require('child_process');
  const exePath = process.execPath;
  const cmd = `reg add "HKCU\\Software\\Classes\\.md" /ve /d "MarkdownReader.Document" /f && ` +
              `reg add "HKCU\\Software\\Classes\\.md\\OpenWithProgids" /v "MarkdownReader.Document" /d "" /f && ` +
              `reg add "HKCU\\Software\\Classes\\MarkdownReader.Document" /ve /d "Markdown File" /f && ` +
              `reg add "HKCU\\Software\\Classes\\MarkdownReader.Document\\DefaultIcon" /ve /d "\\"${exePath}\\",0" /f && ` +
              `reg add "HKCU\\Software\\Classes\\MarkdownReader.Document\\shell\\open\\command" /ve /d "\\"${exePath}\\" \\"%1\\"" /f && ` +
              `reg add "HKCU\\Software\\Classes\\Applications\\MarkdownReader.exe\\shell\\open\\command" /ve /d "\\"${exePath}\\" \\"%1\\"" /f`;
  return new Promise(resolve => {
    exec(cmd, (error) => {
      if (error) {
        console.error('Registry error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true });
      }
    });
  });
});

