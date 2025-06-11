const fs = require('fs-extra');
const path = require('path');

console.log('Building Next.js app for Firebase Functions...');

const sourceDir = path.join(__dirname, '../../apps/web/.next');
const targetDir = path.join(__dirname, '../.next');

// Clean target directory
if (fs.existsSync(targetDir)) {
  fs.removeSync(targetDir);
}

console.log('Copying essential Next.js files...');

// Only copy essential files, not the entire .next directory
const essentialPaths = [
  'standalone',
  'static', 
  'server',
  'BUILD_ID',
  'package.json',
  'routes-manifest.json',
  'prerender-manifest.json',
  'export-marker.json'
];

fs.ensureDirSync(targetDir);

for (const essentialPath of essentialPaths) {
  const sourcePath = path.join(sourceDir, essentialPath);
  const targetPath = path.join(targetDir, essentialPath);
  
  if (fs.existsSync(sourcePath)) {
    console.log(`Copying ${essentialPath}...`);
    fs.copySync(sourcePath, targetPath, {
      filter: (src, dest) => {
        // Filter out large unnecessary files
        const relativePath = path.relative(sourcePath, src);
        
        // Skip cache files and large chunks
        if (relativePath.includes('/cache/') || 
            relativePath.includes('/trace') ||
            (relativePath.includes('/chunks/') && path.extname(src) === '.js' && fs.statSync(src).size > 1024 * 1024)) {
          return false;
        }
        
        return true;
      }
    });
  } else {
    console.log(`Warning: ${essentialPath} not found, skipping...`);
  }
}

// Copy server.js if it exists (standalone mode)
const serverJsSource = path.join(sourceDir, 'standalone/server.js');
const serverJsTarget = path.join(targetDir, 'server.js');

if (fs.existsSync(serverJsSource)) {
  console.log('Copying standalone server.js...');
  fs.copySync(serverJsSource, serverJsTarget);
}

console.log('✅ Firebase Functions build preparation complete (optimized)'); 
console.log('✅ Firebase Functions build preparation complete'); 