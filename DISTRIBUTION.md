# ✅ SONSA Browser - Installateur prêt

## Résumé de ce qui a été fait

Vous avez maintenant un **vrai système d'installation** pour SONSA Browser qui :

✅ **Installe l'application** dans `C:\Program Files\SONSA Browser`  
✅ **Enregistre** dans **Panneau de Configuration** (Ajouter/Supprimer des programmes)  
✅ **Crée des raccourcis** dans le **Menu Démarrer** et sur le **Bureau**  
✅ **Permet la désinstallation propre** via le Panneau de Configuration  

---

## 🚀 Comment distribuer

### Pour partager avec d'autres utilisateurs :

1. **Compressez le dossier `dist/`** en `.zip`
2. Partagez le fichier `.zip` (email, Cloud Drive, clé USB, etc.)
3. Les autres utilisateurs extraient le fichier et lancent :
   ```powershell
   cscript.exe "dist\install.vbs"
   ```

**Ou** demandez-leur de lancer (nécessite PowerShell Admin) :
```powershell
npm run install:app
```

---

## 📦 Fichiers générés

| Fichier | Description |
|---------|-------------|
| `dist/install.vbs` | Script d'installation (à exécuter en Admin) |
| `dist/uninstall.vbs` | Script de désinstallation |
| `dist/win-unpacked/` | Fichiers de l'application (copiés dans Program Files) |

---

## 🔧 Commandes npm utiles

```powershell
# Regénérer l'installateur après modifications du code
npm run build:installer:custom

# Installer localement (nécessite PowerShell Admin)
npm run install:app

# Packager l'app uniquement
npm run package:win
```

---

## ✨ Avantages de cet installateur

✅ Aucune dépendance externe (utilise VBScript natif de Windows)  
✅ Fonctionne sur tous les Windows 10+  
✅ Crée l'app dans Program Files (emplacement standard)  
✅ Enregistrement propre dans la Registry  
✅ Désinstallation complète disponible  
✅ Raccourcis automatiques créés  

---

## 📋 Instructions pour l'utilisateur final

### Installation :
1. Téléchargez/Recevez le dossier `dist/`
2. Cliquez droit sur `install.vbs`
3. Sélectionnez "Exécuter avec PowerShell"
4. Cliquez "Oui" pour l'accès administrateur
5. Suivez les instructions à l'écran

### Lancement :
- Double-cliquez sur le raccourci du **Bureau**
- Ou : Menu Démarrer → SONSA Browser → SONSA Browser

### Désinstallation :
- Menu Démarrer → SONSA Browser → Désinstaller
- Ou : Panneau de Configuration → Programmes → Programmes et fonctionnalités → SONSA Browser → Désinstaller

---

## 🎯 Prochaines étapes (optionnel)

Pour améliorer davantage :

1. **Ajouter une icône personnalisée** : Créez `icon.png` et modifiez `package.json`
2. **Créer un .exe wrapper** : Utilisez un outil comme `nwjs` ou `pyinstaller`
3. **Signer numériquement** : Obtenez un certificat de code pour éviter les avertissements Windows
4. **Créer un installateur MSI** : Installez WiX Toolset pour créer un MSI professionnel

---

## 📞 Support

Si vous rencontrez des erreurs :

1. **Vérifiez que PowerShell s'exécute en mode Admin**
2. **Vérifiez que `dist/` contient tous les fichiers**
3. **Essayez de relancer** `npm run build:installer:custom`
4. **Consultez** [INSTALLATION.md](INSTALLATION.md) pour plus de détails

---

**Votre navigateur SONSA Browser est maintenant prêt à être distribué ! 🎉**
