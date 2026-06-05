#!/usr/bin/env node
/**
 * Créateur d'installateur personnalisé pour SONSA Browser
 * Crée un vrai installateur qui :
 * - Copie les fichiers dans Program Files
 * - Crée des raccourcis
 * - Enregistre dans Panneau de Configuration
 * - Crée un désinstallateur
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const APP_NAME = 'SONSA Browser';
const APP_VERSION = '0.1.0';
const INSTALL_DIR = 'C:\\Program Files\\SONSA Browser';

async function buildInstaller() {
  try {
    console.log('🔨 Création de l\'installateur...\n');

    // 1. Vérifier que les fichiers packagés existent
    const appDir = path.resolve('dist/win-unpacked');
    if (!fs.existsSync(appDir)) {
      console.error('❌ Erreur : dist/win-unpacked n\'existe pas');
      console.log('   Exécutez d\'abord : npm run package:win');
      process.exit(1);
    }

    console.log('✅ Fichiers packagés trouvés\n');

    // 2. Créer les scripts VBS avec chemins échappés correctement
    const appDirEscaped = appDir.replace(/\\/g, '\\\\');
    const allUsersStartMenu = '%ProgramData%\\\\Microsoft\\\\Windows\\\\Start Menu\\\\Programs';
    const desktop = '%USERPROFILE%\\\\Desktop';

    const vbsContent = `' Installation SONSA Browser
' Script avec droits administrateur requis

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

installDir = "C:\\\\Program Files\\\\SONSA Browser"
sourceDir = "${appDirEscaped}"

On Error Resume Next

' Créer le répertoire d'installation
If Not objFSO.FolderExists(installDir) Then
    objFSO.CreateFolder(installDir)
    If Err.Number <> 0 Then
        MsgBox "Erreur: Impossible de créer le dossier d'installation.\\n" & Err.Description, vbCritical
        WScript.Quit(1)
    End If
End If

WScript.Echo "Installation en cours..."

' Copier les fichiers
objFSO.CopyFolder sourceDir, installDir

If Err.Number <> 0 Then
    MsgBox "Erreur lors de la copie des fichiers: " & Err.Description, vbCritical
    WScript.Quit(1)
End If

WScript.Echo "Création des raccourcis..."

' Menu Démarrer
startMenuDir = objShell.ExpandEnvironmentStrings("${allUsersStartMenu}") & "\\\\SONSA Browser"
If Not objFSO.FolderExists(startMenuDir) Then
    objFSO.CreateFolder(startMenuDir)
End If

Set WshShell = objShell

' Raccourci application
Set oLink = WshShell.CreateShortCut(startMenuDir & "\\\\SONSA Browser.lnk")
oLink.TargetPath = installDir & "\\\\SONSA Browser.exe"
oLink.Description = "Navigateur SONSA"
oLink.IconLocation = installDir & "\\\\SONSA Browser.exe"
oLink.Save

' Raccourci désinstallation
Set oLink = WshShell.CreateShortCut(startMenuDir & "\\\\Désinstaller.lnk")
oLink.TargetPath = installDir & "\\\\uninstall.vbs"
oLink.Description = "Désinstaller SONSA Browser"
oLink.Save

' Bureau
desktopDir = objShell.ExpandEnvironmentStrings("${desktop}")
Set oLink = WshShell.CreateShortCut(desktopDir & "\\\\SONSA Browser.lnk")
oLink.TargetPath = installDir & "\\\\SONSA Browser.exe"
oLink.Description = "Navigateur SONSA"
oLink.IconLocation = installDir & "\\\\SONSA Browser.exe"
oLink.Save

WScript.Echo "Enregistrement dans la registry..."

' Enregistrer dans Registry
regPath = "HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\SONSA Browser"
objShell.RegWrite regPath & "\\\\DisplayName", "SONSA Browser", "REG_SZ"
objShell.RegWrite regPath & "\\\\DisplayVersion", "0.1.0", "REG_SZ"
objShell.RegWrite regPath & "\\\\Publisher", "SONSA", "REG_SZ"
objShell.RegWrite regPath & "\\\\InstallLocation", installDir, "REG_SZ"
objShell.RegWrite regPath & "\\\\DisplayIcon", installDir & "\\\\SONSA Browser.exe", "REG_SZ"
objShell.RegWrite regPath & "\\\\UninstallString", installDir & "\\\\uninstall.vbs", "REG_SZ"
objShell.RegWrite regPath & "\\\\NoModify", 1, "REG_DWORD"
objShell.RegWrite regPath & "\\\\NoRepair", 1, "REG_DWORD"

If Err.Number <> 0 Then
    MsgBox "Erreur lors de l'enregistrement: " & Err.Description, vbCritical
    WScript.Quit(1)
End If

MsgBox "Installation réussie!\\n\\nSONSA Browser est maintenant disponible:\\n- Menu Démarrer\\n- Bureau\\n- Panneau de Configuration", vbInformation, "Installation terminée"
`;

    const uninstallVbs = `' Désinstallation SONSA Browser
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

On Error Resume Next

' Confirmation
response = MsgBox("Êtes-vous sûr de vouloir désinstaller SONSA Browser?", vbYesNo + vbQuestion, "Confirmation")
If response <> 6 Then WScript.Quit

installDir = "C:\\\\Program Files\\\\SONSA Browser"

' Supprimer les raccourcis du menu Démarrer
startMenuDir = objShell.ExpandEnvironmentStrings("%ProgramData%\\\\Microsoft\\\\Windows\\\\Start Menu\\\\Programs") & "\\\\SONSA Browser"
If objFSO.FolderExists(startMenuDir) Then
    objFSO.DeleteFolder startMenuDir
End If

' Supprimer le raccourci du Bureau
desktopDir = objShell.ExpandEnvironmentStrings("%USERPROFILE%\\\\Desktop")
objFSO.DeleteFile desktopDir & "\\\\SONSA Browser.lnk"

' Supprimer le répertoire d'installation
If objFSO.FolderExists(installDir) Then
    objFSO.DeleteFolder installDir
End If

' Supprimer l'entrée Registry
objShell.RegDelete "HKLM\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\SONSA Browser\\\\"

If Err.Number <> 0 Then
    MsgBox "Quelques fichiers n'ont pas pu être supprimés.\\nVérifiez que SONSA Browser est fermé.", vbExclamation
Else
    MsgBox "Désinstallation terminée.", vbInformation, "Désinstallation"
End If
`;

    // Créer les scripts
    const installerVbs = path.join(__dirname, 'dist', 'install.vbs');
    const uninstallerVbs = path.join(__dirname, 'dist', 'uninstall.vbs');
    
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
      fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
    }

    fs.writeFileSync(installerVbs, vbsContent);
    fs.writeFileSync(uninstallerVbs, uninstallVbs);
    
    console.log('✅ Scripts d\'installation générés\n');
    console.log('📍 Fichiers créés :');
    console.log(`   - dist/install.vbs     (installateur)`);
    console.log(`   - dist/uninstall.vbs   (désinstallateur)\n`);
    
    console.log('🚀 Pour installer l\'application :\n');
    console.log('1. Ouvrez une invite PowerShell en tant qu\'Administrateur');
    console.log('2. Exécutez la commande suivante :\n');
    console.log('   cscript.exe "dist\\\\install.vbs"\n');
    console.log('   OU\n');
    console.log('   npm run install:app\n');

  } catch (error) {
    console.error('❌ Erreur :', error.message);
    process.exit(1);
  }
}

buildInstaller();


