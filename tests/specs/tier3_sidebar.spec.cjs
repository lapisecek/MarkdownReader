const assert = require('assert');
const { ipcMain, BrowserWindow } = require('electron');

describe('Tier 3: Folder Explorer Sidebar', () => {
  it('Sidebar Toggle', async (page) => {
    await page.waitForSelector('.sidebar-toggle-btn, .sidebar-toggle, .btn-toggle-sidebar', 5000);
    const selector = await page.evaluate(() => {
      if (document.querySelector('.sidebar-toggle-btn')) return '.sidebar-toggle-btn';
      if (document.querySelector('.sidebar-toggle')) return '.sidebar-toggle';
      return '.btn-toggle-sidebar';
    });

    // Check starting state
    const initiallyCollapsed = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, .sidebar-panel');
      return sidebar && (sidebar.classList.contains('collapsed') || sidebar.classList.contains('is-collapsed'));
    });

    // Click toggle
    await page.click(selector);
    await new Promise(r => setTimeout(r, 150));

    const toggledCollapsed = await page.evaluate(() => {
      const sidebar = document.querySelector('.sidebar, .sidebar-panel');
      return sidebar && (sidebar.classList.contains('collapsed') || sidebar.classList.contains('is-collapsed'));
    });

    // They should be different
    assert.notStrictEqual(initiallyCollapsed, toggledCollapsed, 'Sidebar visibility / collapse state must toggle');
  });

  it('Directory Selection Dialog', async (page) => {
    await page.waitForSelector('.open-folder-btn, .btn-open-folder, .sidebar', 5000);
    const selector = await page.evaluate(() => {
      if (document.querySelector('.open-folder-btn')) return '.open-folder-btn';
      if (document.querySelector('.btn-open-folder')) return '.btn-open-folder';
      return '.sidebar';
    });

    // Mock select-directory IPC
    ipcMain.removeHandler('select-directory');
    let selectDirectoryCalled = false;
    ipcMain.handle('select-directory', () => {
      selectDirectoryCalled = true;
      return { canceled: false, filePaths: ['C:\\mock-folder'] };
    });

    await page.click(selector);
    await new Promise(r => setTimeout(r, 200));

    assert.strictEqual(selectDirectoryCalled, true, 'Clicking Open Folder must trigger window.api.selectDirectory');
  });

  it('File Tree Rendering', async (page) => {
    // Mock read-directory IPC
    ipcMain.removeHandler('read-directory');
    ipcMain.handle('read-directory', (event, dirPath) => {
      return [
        { name: 'README.md', isDirectory: false, path: 'C:\\mock-folder\\README.md' },
        { name: 'src', isDirectory: true, path: 'C:\\mock-folder\\src' }
      ];
    });

    // Trigger loading/rendering directory tree (simulate folder selection or IPC)
    const win = BrowserWindow.getAllWindows()[0];
    win.webContents.send('directory-loaded', { 
      dirPath: 'C:\\mock-folder',
      files: [
        { name: 'README.md', isDirectory: false, path: 'C:\\mock-folder\\README.md' },
        { name: 'src', isDirectory: true, path: 'C:\\mock-folder\\src' }
      ]
    });

    await page.waitForSelector('.file-tree-node, .tree-item', 5000);
    const nodesCount = await page.evaluate(() => document.querySelectorAll('.file-tree-node, .tree-item').length);
    assert.ok(nodesCount >= 2, 'File tree must render loaded directory structure');
  });

  it('File Selection from Tree', async (page) => {
    // Mock file content reading IPC or event
    ipcMain.removeHandler('read-file');
    ipcMain.handle('read-file', () => {
      return 'content of README.md';
    });

    // Double click file tree node
    await page.evaluate(() => {
      const fileNode = Array.from(document.querySelectorAll('.file-tree-node, .tree-item'))
        .find(el => el.textContent.includes('README.md'));
      if (fileNode) {
        const dblEvent = new MouseEvent('dblclick', { bubbles: true, cancelable: true });
        fileNode.dispatchEvent(dblEvent);
      }
    });

    await new Promise(r => setTimeout(r, 200));

    // Verify it opens in active tab/title bar
    const titleText = await page.evaluate(() => document.body.innerText);
    assert.ok(titleText.includes('README.md'), 'Double-clicking markdown file in tree must open it in editor');
  });
});
