; SONSA Browser Installer (NSIS)
; Installe l'application dans Program Files et l'enregistre dans Windows

!include "MUI2.nsh"
!include "x64.nsh"

; Configuration générale
Name "SONSA Browser v0.1.0"
OutFile "dist\SONSA Browser Setup.exe"
InstallDir "$PROGRAMFILES64\SONSA Browser"
RequestExecutionLevel admin

; Pages d'installation
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Pages de désinstallation
!insertmacro MUI_LANGUAGE "French"

Section "Installation"
  SetOutPath "$INSTDIR"
  
  ; Copier les fichiers depuis dist\win-unpacked
  File /r "dist\win-unpacked\*.*"
  
  ; Créer les raccourcis dans le menu Démarrer
  CreateDirectory "$SMPROGRAMS\SONSA Browser"
  CreateShortCut "$SMPROGRAMS\SONSA Browser\SONSA Browser.lnk" "$INSTDIR\SONSA Browser.exe" "" "$INSTDIR\SONSA Browser.exe" 0
  CreateShortCut "$SMPROGRAMS\SONSA Browser\Uninstall.lnk" "$INSTDIR\uninstall.exe"
  
  ; Créer un raccourci sur le Bureau
  CreateShortCut "$DESKTOP\SONSA Browser.lnk" "$INSTDIR\SONSA Browser.exe" "" "$INSTDIR\SONSA Browser.exe" 0
  
  ; Créer l'uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
  
  ; Enregistrer dans Ajout/Suppression de programmes (Registry)
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser" "DisplayName" "SONSA Browser"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser" "DisplayVersion" "0.1.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser" "Publisher" "SONSA"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser" "DisplayIcon" "$INSTDIR\SONSA Browser.exe"
SectionEnd

Section "Uninstall"
  ; Supprimer les fichiers
  RMDir /r "$INSTDIR"
  
  ; Supprimer les raccourcis du menu Démarrer
  RMDir /r "$SMPROGRAMS\SONSA Browser"
  
  ; Supprimer le raccourci du Bureau
  Delete "$DESKTOP\SONSA Browser.lnk"
  
  ; Supprimer l'entrée Registry
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\SONSA Browser"
SectionEnd
