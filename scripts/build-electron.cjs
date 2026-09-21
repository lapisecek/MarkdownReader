const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const asar = require('@electron/asar');

async function build() {
  console.log('--- Step 1: Building Frontend Assets (Vite) ---');
  execSync('npx vite build', { stdio: 'inherit' });

  const rootDir = path.resolve(__dirname, '..');
  const stageDir = path.join(rootDir, 'dist-electron', 'stage');
  const outDir = path.join(rootDir, 'dist-electron', 'MarkdownReader-win32-x64');
  const winUnpackedDir = path.join(rootDir, 'dist-electron', 'win-unpacked');

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
  const zipPath = path.join(rootDir, 'dist-electron', 'MarkdownReader-v1.3.0-win32-x64.zip');
  try {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${winUnpackedDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
    const zipSizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
    console.log(`Release archive generated: ${zipPath} (${zipSizeMb} MB)`);
  } catch (e) {
    console.warn('Zip generation warning:', e.message);
  }

  console.log('=== BUILD COMPLETED SUCCESSFULLY ===');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
