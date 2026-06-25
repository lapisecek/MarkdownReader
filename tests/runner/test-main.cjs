const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Force production environment so main.cjs loads the local build dist/index.html
process.env.NODE_ENV = 'production';

// Parse the spec file path from arguments
let specPath = null;
for (const arg of process.argv) {
  if (arg.startsWith('--spec=')) {
    specPath = arg.substring('--spec='.length);
  }
}

if (!specPath) {
  console.error('Error: No spec file specified. Provide --spec=<path>');
  process.exit(1);
}

// Global registry for test mock control
global.mockDialogs = {
  showSaveDialog: null,
  showMessageBox: null,
};

// Hook Electron BrowserWindow and dialog APIs before requiring main.cjs
const electron = require('electron');
const OriginalBrowserWindow = electron.BrowserWindow;

let capturedWindow = null;

class MockBrowserWindow extends OriginalBrowserWindow {
  constructor(options) {
    // Force show: true to ensure rendering works correctly and prevent headless quirks
    super({
      ...options,
      show: true,
      webPreferences: {
        ...options.webPreferences,
        offscreen: false
      }
    });
    capturedWindow = this;
  }
}

// Intercept BrowserWindow instantiation
electron.BrowserWindow = MockBrowserWindow;

// Intercept dialog showSaveDialog and showMessageBox APIs
const originalDialog = electron.dialog;
electron.dialog = {
  ...originalDialog,
  showSaveDialog: async (window, options) => {
    if (global.mockDialogs.showSaveDialog) {
      return global.mockDialogs.showSaveDialog(options);
    }
    return { filePath: undefined, canceled: true };
  },
  showMessageBox: async (window, options) => {
    if (global.mockDialogs.showMessageBox) {
      return global.mockDialogs.showMessageBox(options);
    }
    return { response: 0 };
  }
};

// Simple embedded E2E testing framework DSL
const tests = [];
let currentSuite = '';

global.describe = function(name, fn) {
  currentSuite = name;
  fn();
  currentSuite = '';
};

global.it = function(name, fn) {
  tests.push({
    suite: currentSuite,
    name: name,
    fn: fn
  });
};

// Load spec file to register test cases
try {
  const resolvedSpec = path.resolve(specPath);
  require(resolvedSpec);
} catch (err) {
  console.error(`Failed to load spec file: ${specPath}`, err);
  process.exit(1);
}

// Set up Electron application lifecycle hook
app.whenReady().then(async () => {
  // Load main.cjs to trigger application startup code
  try {
    require('../../main.cjs');
  } catch (err) {
    console.error('Failed to load main.cjs', err);
    process.exit(1);
  }

  // Wait for BrowserWindow to be created
  await waitForWindow();

  // Wait for the window's webContents to finish loading
  await waitForWindowLoad();

  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  const startTime = Date.now();

  console.log(`\nRunning ${tests.length} tests from ${path.basename(specPath)}...\n`);

  // Define E2E Page driver API
  const page = {
    async evaluate(fn, ...args) {
      const fnStr = fn.toString();
      const argsStr = args.map(a => JSON.stringify(a)).join(', ');
      const code = `(${fnStr})(${argsStr})`;
      return await capturedWindow.webContents.executeJavaScript(code);
    },
    async click(selector) {
      return await this.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element not found for click: ${sel}`);
        el.click();
      }, selector);
    },
    async type(selector, text) {
      return await this.evaluate((sel, txt) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element not found for typing: ${sel}`);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = txt;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.textContent = txt;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, selector, text);
    },
    async waitForSelector(selector, timeout = 5000) {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        const exists = await this.evaluate((sel) => !!document.querySelector(sel), selector);
        if (exists) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error(`Timeout waiting for selector: ${selector}`);
    }
  };

  // Run all registered tests sequentially
  for (const test of tests) {
    const testFullName = test.suite ? `${test.suite} > ${test.name}` : test.name;
    console.log(`[ RUN      ] ${testFullName}`);
    
    // Reset mocks for each test run to ensure isolation
    global.mockDialogs.showSaveDialog = null;
    global.mockDialogs.showMessageBox = null;

    const testStart = Date.now();
    try {
      await test.fn(page);
      const duration = Date.now() - testStart;
      console.log(`[       OK ] ${testFullName} (${duration}ms)`);
      results.push({ name: testFullName, status: 'pass', duration });
      passedCount++;
    } catch (err) {
      const duration = Date.now() - testStart;
      console.error(`[  FAILED  ] ${testFullName} (${duration}ms)`);
      console.error(err.stack || err);
      results.push({ name: testFullName, status: 'fail', duration, error: err.message || String(err) });
      failedCount++;
    }
  }

  const totalDuration = Date.now() - startTime;
  
  // Format results output block
  const finalPayload = {
    passes: passedCount,
    fails: failedCount,
    duration: totalDuration,
    results: results
  };
  
  // Print results signature for test runner parsing
  console.log(`\n__TEST_RESULT__:${JSON.stringify(finalPayload)}`);
  
  // Exit the process cleanly
  process.exit(failedCount === 0 ? 0 : 1);
});

async function waitForWindow() {
  while (!capturedWindow) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

async function waitForWindowLoad() {
  while (!capturedWindow || !capturedWindow.webContents) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  while (capturedWindow.webContents.isLoading()) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  // Wait minor extra buffer for preload / React lifecycle
  await new Promise(resolve => setTimeout(resolve, 500));
}
