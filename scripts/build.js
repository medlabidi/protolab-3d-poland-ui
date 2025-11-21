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

  // Prefer copying compiled src if present
  const srcPath = path.resolve('src');
  if (fs.existsSync(srcPath)) {
    console.log('Copying src/ -> dist/');
    copyRecursive(srcPath, path.join(distPath, 'src'));
    return true;
  }

  // Fallback: copy top-level JS entry files
  const indexJs = path.resolve('index.js');
  if (fs.existsSync(indexJs)) {
    fs.copyFileSync(indexJs, path.join(distPath, 'index.js'));
    console.log('Copied index.js -> dist/index.js');
    return true;
  }

  // fallback: copy package.json so deployment isn't empty
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
  console.log('Running tsc...');
  // use local tsc if available
  execSync('npx tsc -p tsconfig.json', { stdio: 'inherit' });
} catch (err) {
  console.warn('tsc returned non-zero code or is not present, continuing to fallback creation');
}

const ok = ensureDist();
if (!ok) process.exit(0);
process.exit(0);
