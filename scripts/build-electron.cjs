const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const asar = require('@electron/asar');

async function build() {
  const rootDir = path.resolve(__dirname, '..');
  const distElectronDir = path.join(rootDir, 'dist-electron');
  const stageDir = path.join(distElectronDir, 'stage');
  const outDir = path.join(distElectronDir, 'MarkdownReader-win32-x64');
  const winUnpackedDir = path.join(distElectronDir, 'win-unpacked');

  console.log('--- Step 0: Cleaning Previous Builds & Releasing Locks ---');
  try {
    execSync('powershell -NoProfile -Command "Get-Process -Name MarkdownReader -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'ignore' });
  } catch (_) {}

  if (fs.existsSync(outDir)) {
    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch (_) {}
  }
  if (fs.existsSync(winUnpackedDir)) {
    try { fs.rmSync(winUnpackedDir, { recursive: true, force: true }); } catch (_) {}
  }
  if (fs.existsSync(stageDir)) {
    try { fs.rmSync(stageDir, { recursive: true, force: true }); } catch (_) {}
  }
  if (fs.existsSync(distElectronDir)) {
    const files = fs.readdirSync(distElectronDir);
    for (const file of files) {
      if (file.endsWith('.zip')) {
        try { fs.unlinkSync(path.join(distElectronDir, file)); } catch (_) {}
      }
    }
  }

  console.log('--- Step 1: Building Frontend Assets (Vite) ---');
  execSync('npx vite build', { stdio: 'inherit' });

  console.log('--- Step 2: Preparing Clean Staging Directory for ASAR ---');
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stageDir, { recursive: true });

  // Copy compiled dist
  fs.cpSync(path.join(rootDir, 'dist'), path.join(stageDir, 'dist'), { recursive: true });
  // Copy runtime entrypoints and metadata
  fs.copyFileSync(path.join(rootDir, 'main.cjs'), path.join(stageDir, 'main.cjs'));
  fs.copyFileSync(path.join(rootDir, 'preload.cjs'), path.join(stageDir, 'preload.cjs'));
  fs.copyFileSync(path.join(rootDir, 'icon.ico'), path.join(stageDir, 'icon.ico'));
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(stageDir, 'package.json'));

  console.log('--- Step 3: Packing app.asar with @electron/asar ---');
  const asarPath = path.join(rootDir, 'dist-electron', 'app.asar');
  if (fs.existsSync(asarPath)) {
    fs.unlinkSync(asarPath);
  }
  await asar.createPackage(stageDir, asarPath);
  fs.rmSync(stageDir, { recursive: true, force: true });
  const asarSizeMb = (fs.statSync(asarPath).size / 1024 / 1024).toFixed(2);
  console.log(`app.asar created successfully (${asarSizeMb} MB)`);

  console.log('--- Step 4: Preparing Pristine Official Electron Runtime ---');
  const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Copy all files from electronDist except resources
  const entries = fs.readdirSync(electronDist);
  for (const entry of entries) {
    if (entry === 'resources') continue;
    const src = path.join(electronDist, entry);
    const dest = path.join(outDir, entry);
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      if (entry.toLowerCase() === 'electron.exe') {
        const destExe = path.join(outDir, 'MarkdownReader.exe');
        try {
          fs.copyFileSync(src, destExe);
        } catch (err) {
          try {
            const oldPath = path.join(os.tmpdir(), `mr_old_${Date.now()}.exe`);
            fs.renameSync(destExe, oldPath);
            fs.copyFileSync(src, destExe);
          } catch (e2) {
            console.error('Warning: could not replace exe:', e2.message);
          }
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    }
  }

  // Set up resources folder with our app.asar
  const resDir = path.join(outDir, 'resources');
  if (fs.existsSync(resDir)) {
    fs.rmSync(resDir, { recursive: true, force: true });
  }
  fs.mkdirSync(resDir, { recursive: true });
  fs.copyFileSync(asarPath, path.join(resDir, 'app.asar'));
  fs.unlinkSync(asarPath);

  // Copy crisp 256x256 icon.ico right beside MarkdownReader.exe
  fs.copyFileSync(path.join(rootDir, 'icon.ico'), path.join(outDir, 'icon.ico'));

  console.log('--- Step 5: Mirroring to win-unpacked ---');
  if (!fs.existsSync(winUnpackedDir)) {
    fs.mkdirSync(winUnpackedDir, { recursive: true });
  }
  try {
    execSync(`robocopy "${outDir}" "${winUnpackedDir}" /mir /np /ndl /nfl /njh /njs`, { stdio: 'ignore' });
  } catch (e) {
    // robocopy returns exit code 1 on success when files are copied
  }

  console.log('--- Step 6: Compressing Release Zip Archive ---');
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const version = pkg.version || '2.0.1';
  const zipPath = path.join(rootDir, 'dist-electron', `MarkdownReader-v${version}-win32-x64.zip`);
  try {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${winUnpackedDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
    const zipSizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
    console.log(`Release archive generated: ${zipPath} (${zipSizeMb} MB)`);
  } catch (e) {
    console.warn('Zip generation warning:', e.message);
  }

  console.log('--- Step 7: Adding / Updating Windows Start Menu Shortcut ---');
  try {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const startMenuPrograms = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    if (!fs.existsSync(startMenuPrograms)) {
      fs.mkdirSync(startMenuPrograms, { recursive: true });
    }
    const shortcutPath = path.join(startMenuPrograms, 'MarkdownReader.lnk');
    const exePath = path.join(winUnpackedDir, 'MarkdownReader.exe');
    const iconPath = path.join(winUnpackedDir, 'icon.ico');

    const psScript = `
      $ws = New-Object -ComObject WScript.Shell;
      $s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}');
      $s.TargetPath = '${exePath.replace(/'/g, "''")}';
      $s.WorkingDirectory = '${winUnpackedDir.replace(/'/g, "''")}';
      $s.IconLocation = '${iconPath.replace(/'/g, "''")},0';
      $s.Description = 'MarkdownReader - Fast Desktop Markdown Workspace';
      $s.Save();
    `;
    execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'inherit' });
    console.log(`✓ Start Menu shortcut created/updated: ${shortcutPath}`);

    const desktopDir = path.join(os.homedir(), 'Desktop');
    if (fs.existsSync(desktopDir)) {
      const desktopShortcutPath = path.join(desktopDir, 'MarkdownReader.lnk');
      const psDesktop = `
        $ws = New-Object -ComObject WScript.Shell;
        $s = $ws.CreateShortcut('${desktopShortcutPath.replace(/'/g, "''")}');
        $s.TargetPath = '${exePath.replace(/'/g, "''")}';
        $s.WorkingDirectory = '${winUnpackedDir.replace(/'/g, "''")}';
        $s.IconLocation = '${iconPath.replace(/'/g, "''")},0';
        $s.Description = 'MarkdownReader - Fast Desktop Markdown Workspace';
        $s.Save();
      `;
      execSync(`powershell -NoProfile -Command "${psDesktop.replace(/\r?\n/g, ' ')}"`, { stdio: 'ignore' });
      console.log(`✓ Desktop shortcut created/updated: ${desktopShortcutPath}`);
    }
  } catch (err) {
    console.warn('Warning: Could not create shortcut:', err.message);
  }

  console.log('=== BUILD COMPLETED SUCCESSFULLY ===');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
