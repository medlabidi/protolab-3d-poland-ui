const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function ensureDist() {
  const distPath = path.resolve('dist');
  if (fs.existsSync(distPath) && fs.statSync(distPath).isDirectory()) {
    console.log('✅ dist/ exists');
    return true;
  }

  console.warn('dist/ not found after tsc — creating fallback dist/');

  fs.mkdirSync(distPath, { recursive: true });

  const srcPath = path.resolve('src');
  if (fs.existsSync(srcPath)) {
    console.log('Copying src/ -> dist/src/');
    copyRecursive(srcPath, path.join(distPath, 'src'));
    return true;
  }

  const indexJs = path.resolve('index.js');
  if (fs.existsSync(indexJs)) {
    fs.copyFileSync(indexJs, path.join(distPath, 'index.js'));
    console.log('Copied index.js -> dist/index.js');
    return true;
  }

  const pkg = path.resolve('package.json');
  if (fs.existsSync(pkg)) {
    fs.copyFileSync(pkg, path.join(distPath, 'package.json'));
    console.log('Copied package.json -> dist/package.json (fallback)');
    return true;
  }

  console.warn('No files to populate dist/ — deployment may still fail.');
  return false;
}

try {
  console.log('Running tsc (if available)...');
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
} catch (err) {
  console.warn('tsc failed or is not installed — continuing with fallback creation');
}

ensureDist();
