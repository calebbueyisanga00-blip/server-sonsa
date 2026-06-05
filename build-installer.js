const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { createWindowsInstaller } = require('electron-winstaller');
const pkg = require('./package.json');

async function patchVendorTemplate(vendorPath, version) {
  const templatePath = path.join(vendorPath, 'template.wxs');
  let content = await fs.readFile(templatePath, 'utf8');
  content = content.replace(/Version="!\(bind\.FileVersion\.[^\"]+\.exe\)"/, `Version="${version}"`);
  await fs.writeFile(templatePath, content, 'utf8');
}

async function buildInstaller() {
  const appDirectory = path.resolve('dist/win-unpacked');
  const outputDirectory = path.resolve('dist/installer');
  const sourceVendorPath = path.resolve(__dirname, 'node_modules', 'electron-winstaller', 'vendor');
  const tempVendorPath = path.join(os.tmpdir(), `sonsa-installer-vendor-${Date.now()}`);

  const versionParts = pkg.version.split('-')[0].split('.');
  while (versionParts.length < 4) {
    versionParts.push('0');
  }
  const wixVersion = versionParts.slice(0, 4).join('.');

  await fs.cp(sourceVendorPath, tempVendorPath, { recursive: true });
  await patchVendorTemplate(tempVendorPath, wixVersion);

  const licenseSource = path.resolve(__dirname, 'LICENSE');
  const licenseDest = path.join(appDirectory, 'LICENSE');
  try {
    await fs.access(licenseDest);
  } catch {
    await fs.copyFile(licenseSource, licenseDest);
  }

  const safeName = (pkg.name || 'app').replace(/[^A-Za-z0-9_.]/g, '_');

  try {
    await createWindowsInstaller({
      appDirectory,
      outputDirectory,
      authors: 'SONSA',
      exe: 'SONSA Browser.exe',
      name: safeName,
      title: pkg.productName || pkg.name,
      setupExe: 'SONSA Browser Setup.exe',
      setupMsi: 'SONSA Browser Setup.msi',
      noMsi: false,
      version: pkg.version,
      vendorDirectory: tempVendorPath,
    });
    console.log('Installer créé avec succès.');
  } finally {
    await fs.rm(tempVendorPath, { recursive: true, force: true });
  }
}

buildInstaller().catch((error) => {
  console.error('Erreur lors de la création de l’installateur :', error);
  process.exit(1);
});
