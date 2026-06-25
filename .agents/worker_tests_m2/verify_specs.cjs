const fs = require('fs');
const path = require('path');

// Mock Electron modules/apis since this script runs in standard Node
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'electron') {
    return {
      app: {
        requestSingleInstanceLock: () => true,
        emit: () => {}
      },
      ipcMain: {
        removeHandler: () => {},
        handle: () => {}
      },
      BrowserWindow: {
        getAllWindows: () => [{
          on: () => {},
          webContents: {
            send: () => {},
            on: () => {}
          }
        }]
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

global.mockDialogs = {
  showSaveDialog: null,
  showMessageBox: null,
};

const registered = {};
global.describe = function (suiteName, fn) {
  registered[suiteName] = [];
  fn();
};
global.it = function (testName, fn) {
  const suites = Object.keys(registered);
  const currentSuite = suites[suites.length - 1];
  registered[currentSuite].push(testName);
};

const specs = [
  'tier1_rendering.spec.cjs',
  'tier2_tabs.spec.cjs',
  'tier3_sidebar.spec.cjs',
  'tier4_os.spec.cjs'
];

let hasErrors = false;
for (const spec of specs) {
  const specPath = path.join(__dirname, '..', '..', 'tests', 'specs', spec);
  console.log(`Checking syntax and registration for: ${spec}`);
  try {
    require(specPath);
    console.log(`Successfully loaded ${spec}. Tests registered:`, registered);
  } catch (err) {
    console.error(`Error loading ${spec}:`, err);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('All spec files syntax is clean and register correctly.');
  process.exit(0);
}
