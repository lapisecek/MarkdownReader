const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function getElectronBinary() {
  // Try to load via the electron package export (standard behavior in Node)
  try {
    const electron = require('electron');
    if (typeof electron === 'string') {
      return electron;
    }
  } catch (e) {
    // Ignore and try path lookup
  }

  // Try looking in local node_modules
  const localPaths = [
    path.join(__dirname, '..', '..', 'node_modules', 'electron', 'dist', 'electron.exe'),
    path.join(__dirname, '..', '..', 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron'),
    path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron.cmd'),
    path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron')
  ];

  for (const p of localPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to searching shell path
  return process.platform === 'win32' ? 'electron.cmd' : 'electron';
}

async function main() {
  const specsDir = path.join(__dirname, '..', 'specs');
  if (!fs.existsSync(specsDir)) {
    console.error(`Specs directory not found at: ${specsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(specsDir);
  const specFiles = files.filter(f => f.endsWith('.spec.cjs'));

  if (specFiles.length === 0) {
    console.log('No spec files found in tests/specs/');
    process.exit(0);
  }

  console.log(`Found ${specFiles.length} spec files to execute.`);

  const electronBin = getElectronBinary();
  console.log(`Using Electron binary: ${electronBin}`);

  let totalPasses = 0;
  let totalFails = 0;
  let totalDuration = 0;
  let hasFailed = false;

  for (const file of specFiles) {
    const specPath = path.join(specsDir, file);
    console.log(`\n==================================================`);
    console.log(`Executing Spec File: ${file}`);
    console.log(`==================================================\n`);

    try {
      const result = await runSpec(electronBin, specPath);
      totalPasses += result.passes;
      totalFails += result.fails;
      totalDuration += result.duration;
      if (result.fails > 0) {
        hasFailed = true;
      }
    } catch (err) {
      console.error(`Error running spec file ${file}:`, err);
      hasFailed = true;
    }
  }

  console.log(`\n==================================================`);
  console.log(`E2E Test Run Summary`);
  console.log(`==================================================`);
  console.log(`Total Spec Files: ${specFiles.length}`);
  console.log(`Total Passed:     ${totalPasses}`);
  console.log(`Total Failed:     ${totalFails}`);
  console.log(`Total Duration:   ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`==================================================\n`);

  process.exit(hasFailed ? 1 : 0);
}

function runSpec(electronBin, specPath) {
  return new Promise((resolve, reject) => {
    const runnerMain = path.join(__dirname, 'test-main.cjs');
    
    // Spawn electron process
    const isCmd = electronBin.endsWith('.cmd') || electronBin === 'electron';
    const child = spawn(electronBin, [runnerMain, `--spec=${specPath}`], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: isCmd
    });

    let stdoutData = '';
    let stderrData = '';
    let testResultPayload = null;

    child.stdout.on('data', (data) => {
      const str = data.toString();
      stdoutData += str;

      // Extract JSON results while passing through regular logs
      const lines = str.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith('__TEST_RESULT__:')) {
          try {
            const jsonStr = line.substring('__TEST_RESULT__:'.length).trim();
            testResultPayload = JSON.parse(jsonStr);
          } catch (e) {
            console.error('Failed to parse test result payload:', e);
          }
        } else {
          if (line.trim()) {
            console.log(line);
          }
        }
      }
    });

    child.stderr.on('data', (data) => {
      const str = data.toString();
      stderrData += str;
      console.error(str.trim());
    });

    child.on('close', (code) => {
      if (testResultPayload) {
        resolve(testResultPayload);
      } else {
        console.error(`Electron process exited with code ${code} without reporting results.`);
        resolve({
          passes: 0,
          fails: 1,
          duration: 0,
          results: [{ name: 'Process execution', status: 'fail', error: `Exit code ${code}. Stderr: ${stderrData}` }]
        });
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

main().catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});
