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
let directoryToOpen = null;
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
  for (let i = 1; i < argv.length; i++) {
    const raw = argv[i];
    if (!raw || raw.startsWith('--') || raw.startsWith('-')) continue;
    const cleaned = raw.replace(/^"+|"+$/g, '');
    let resolved = cleaned;
    if (!path.isAbsolute(resolved)) {
      resolved = workingDirectory ? path.resolve(workingDirectory, resolved) : path.resolve(resolved);
    }
    if (fs.existsSync(resolved)) {
      try {
        const stat = fs.statSync(resolved);
        if (stat.isDirectory()) {
          logToFile(`Found directory to open: ${resolved}`);
          if (isRendererReady && mainWindow) {
            mainWindow.webContents.send('open-directory', resolved);
          } else {
            directoryToOpen = resolved;
          }
          return;
        } else if (stat.isFile()) {
          const lower = resolved.toLowerCase();
          if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.mdown') || lower.endsWith('.txt')) {
            logToFile(`Found file to open: ${resolved}`);
            if (isRendererReady && mainWindow) {
              openFile(resolved);
            } else {
              fileToOpen = resolved;
            }
            return;
          }
        }
      } catch (err) {
        logToFile(`Error checking path: ${err.message}`);
      }
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
  logToFile(`renderer-ready event. isRendererReady was ${isRendererReady}, fileToOpen is ${fileToOpen}, directoryToOpen is ${directoryToOpen}`);
  isRendererReady = true;
  if (fileToOpen) {
    openFile(fileToOpen);
    fileToOpen = null;
  }
  if (directoryToOpen) {
    if (mainWindow) mainWindow.webContents.send('open-directory', directoryToOpen);
    directoryToOpen = null;
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

function runReg(args) {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    execFile('reg.exe', args, (error, stdout, stderr) => {
      if (error) resolve({ success: false, error: error.message, stderr, code: error.code });
      else resolve({ success: true, stdout: stdout || '' });
    });
  });
}

ipcMain.handle('check-windows-integration', async () => {
  if (process.platform !== 'win32') {
    return {
      isSupported: false,
      isDefaultApp: true,
      hasDesktopShortcut: true,
      hasStartMenuShortcut: true,
      hasContextMenu: true,
      allConfigured: true,
    };
  }

  try {
    const mdReg = await runReg(['query', 'HKCU\\Software\\Classes\\.md', '/ve']);
    const isDefaultApp = mdReg.success && (mdReg.stdout || '').includes('MarkdownReader.Document');

    const desktopShortcut = path.join(app.getPath('desktop'), 'MarkdownReader.lnk');
    const hasDesktopShortcut = fs.existsSync(desktopShortcut);

    const startMenuShortcut = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'MarkdownReader.lnk');
    const hasStartMenuShortcut = fs.existsSync(startMenuShortcut);

    const ctxReg = await runReg(['query', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.md\\shell\\MarkdownReader']);
    const hasContextMenu = ctxReg.success;

    return {
      isSupported: true,
      isDefaultApp,
      hasDesktopShortcut,
      hasStartMenuShortcut,
      hasContextMenu,
      allConfigured: isDefaultApp && hasDesktopShortcut && hasStartMenuShortcut && hasContextMenu,
    };
  } catch (err) {
    console.error('Failed to check Windows integration:', err);
    return {
      isSupported: true,
      isDefaultApp: false,
      hasDesktopShortcut: false,
      hasStartMenuShortcut: false,
      hasContextMenu: false,
      allConfigured: false,
      error: err.message,
    };
  }
});

ipcMain.handle('setup-windows-integration', async (_event, options = {}) => {
  if (process.platform !== 'win32') return { success: false, error: 'Only supported on Windows' };

  const {
    defaultApp = true,
    desktopShortcut = true,
    startMenuShortcut = true,
    contextMenu = true,
  } = options;

  const results = {
    defaultApp: false,
    desktopShortcut: false,
    startMenuShortcut: false,
    contextMenu: false,
  };

  const exePath = process.execPath;
  const exeDir = path.dirname(exePath);

  // 1. Setup default app file associations
  if (defaultApp) {
    try {
      await runReg(['add', 'HKCU\\Software\\Classes\\.md', '/ve', '/d', 'MarkdownReader.Document', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\.md\\OpenWithProgids', '/v', 'MarkdownReader.Document', '/d', '', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\.markdown', '/ve', '/d', 'MarkdownReader.Document', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\.markdown\\OpenWithProgids', '/v', 'MarkdownReader.Document', '/d', '', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\MarkdownReader.Document', '/ve', '/d', 'Markdown File', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\MarkdownReader.Document\\DefaultIcon', '/ve', '/d', `"${exePath}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\MarkdownReader.Document\\shell\\open\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Applications\\MarkdownReader.exe\\shell\\open\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f']);
      results.defaultApp = true;
    } catch (e) {
      console.error('Failed defaultApp registry setup:', e);
    }
  }

  // 2. Setup Desktop shortcut
  if (desktopShortcut) {
    try {
      const desktopPath = path.join(app.getPath('desktop'), 'MarkdownReader.lnk');
      const op = fs.existsSync(desktopPath) ? 'update' : 'create';
      shell.writeShortcutLink(desktopPath, op, {
        target: exePath,
        cwd: exeDir,
        icon: exePath,
        iconIndex: 0,
        description: 'MarkdownReader - Fast Markdown Workspace'
      });
      results.desktopShortcut = fs.existsSync(desktopPath);
    } catch (e) {
      console.error('Failed desktop shortcut creation:', e);
    }
  }

  // 3. Setup Start Menu shortcut
  if (startMenuShortcut) {
    try {
      const startMenuDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs');
      if (!fs.existsSync(startMenuDir)) {
        fs.mkdirSync(startMenuDir, { recursive: true });
      }
      const startMenuPath = path.join(startMenuDir, 'MarkdownReader.lnk');
      const op = fs.existsSync(startMenuPath) ? 'update' : 'create';
      shell.writeShortcutLink(startMenuPath, op, {
        target: exePath,
        cwd: exeDir,
        icon: exePath,
        iconIndex: 0,
        description: 'MarkdownReader - Fast Markdown Workspace'
      });
      results.startMenuShortcut = fs.existsSync(startMenuPath);
    } catch (e) {
      console.error('Failed start menu shortcut creation:', e);
    }
  }

  // 4. Setup Explorer Context Menu
  if (contextMenu) {
    try {
      // File context menu for .md and .markdown
      await runReg(['add', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.md\\shell\\MarkdownReader', '/ve', '/d', 'Edit with MarkdownReader', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.md\\shell\\MarkdownReader', '/v', 'Icon', '/d', `"${exePath}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.md\\shell\\MarkdownReader\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f']);

      await runReg(['add', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.markdown\\shell\\MarkdownReader', '/ve', '/d', 'Edit with MarkdownReader', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.markdown\\shell\\MarkdownReader', '/v', 'Icon', '/d', `"${exePath}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\SystemFileAssociations\\.markdown\\shell\\MarkdownReader\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f']);

      // Folder / Directory context menu
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\MarkdownReader', '/ve', '/d', 'Open Folder in MarkdownReader', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\MarkdownReader', '/v', 'Icon', '/d', `"${exePath}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\MarkdownReader\\command', '/ve', '/d', `"${exePath}" "%V"`, '/f']);

      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\MarkdownReader', '/ve', '/d', 'Open Folder in MarkdownReader', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\MarkdownReader', '/v', 'Icon', '/d', `"${exePath}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\Background\\shell\\MarkdownReader\\command', '/ve', '/d', `"${exePath}" "%V"`, '/f']);

      results.contextMenu = true;
    } catch (e) {
      console.error('Failed context menu registry setup:', e);
    }
  }

  return { success: true, results };
});

ipcMain.handle('set-as-default', async () => {
  const exePath = process.execPath;
  try {
    await runReg(['add', 'HKCU\\Software\\Classes\\.md', '/ve', '/d', 'MarkdownReader.Document', '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\.md\\OpenWithProgids', '/v', 'MarkdownReader.Document', '/d', '', '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\.markdown', '/ve', '/d', 'MarkdownReader.Document', '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\.markdown\\OpenWithProgids', '/v', 'MarkdownReader.Document', '/d', '', '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\MarkdownReader.Document', '/ve', '/d', 'Markdown File', '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\MarkdownReader.Document\\DefaultIcon', '/ve', '/d', `"${exePath}",0`, '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\MarkdownReader.Document\\shell\\open\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f']);
    await runReg(['add', 'HKCU\\Software\\Classes\\Applications\\MarkdownReader.exe\\shell\\open\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f']);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

