# 🚀 Installation de SONSA Browser

## ✅ Installateur prêt !

Un vrai installateur Windows a été créé. Il installera SONSA Browser dans Program Files et l'enregistrera dans le Panneau de Configuration.

---

## 📥 Installation (3 façons)

### Option 1 : Installation simple via npm (⭐ Recommandé)

Lancez cette commande depuis une invite **PowerShell Admin** :

```powershell
npm run install:app
```

L'installateur se lancera et SONSA Browser sera installé automatiquement.

---

### Option 2 : Installation manuelle via script

1. Ouvrez une invite **PowerShell Admin**
2. Naviguez vers le répertoire du projet
3. Exécutez :

```powershell
cscript.exe "dist\install.vbs"
```

---

### Option 3 : Installation via l'Explorateur

1. Naviguez vers `dist/`
2. Cliquez droit sur `install.vbs`
3. Choisissez "Exécuter avec PowerShell"
4. Confirmez l'accès administrateur

---

## 🎯 Que fait l'installateur ?

✅ Copie SONSA Browser dans `C:\Program Files\SONSA Browser`  
✅ Crée un raccourci dans le **Menu Démarrer**  
✅ Crée un raccourci sur le **Bureau**  
✅ Enregistre dans **Panneau de Configuration** (Ajouter/Supprimer des programmes)  
✅ Permet la désinstallation propre  

---

## 🗑️ Désinstallation

Après installation, SONSA Browser apparaîtra dans :
- **Panneau de Configuration** → Programmes → Programmes et fonctionnalités
- Cliquez sur "SONSA Browser" puis "Désinstaller"

Ou depuis le menu Démarrer :
- Menu Démarrer → SONSA Browser → Désinstaller

---

## 🔧 Génération de l'installateur (pour développeurs)

Pour regénérer les scripts d'installation après modifications :

```powershell
npm run build:installer:custom
```

Cela va :
1. Packager l'application (`npm run package:win`)
2. Générer les scripts VBS (`node create-installer.js`)

---

## 📋 Pré-requis

- Windows 10+ 
- PowerShell (inclus dans Windows)
- Accès administrateur pour l'installation
- Node.js 16+ (uniquement pour développeurs qui recompilent)

---

## 💡 Conseils de distribution

- **Distribution simple** : Envoyez le dossier `dist/` compressé (.zip)
- **Pour utilisateurs finaux** : Incluez les instructions ci-dessus
- **Installation réseau** : Placez `dist/` sur un serveur partagé et lancez `install.vbs` depuis n'importe quel PC

---

## 🆘 Dépannage

**"Accès refusé" lors de l'installation ?**
- Assurez-vous que PowerShell est exécuté en tant que **Administrateur**
- Vérifiez que `dist/` contient les fichiers de l'application

**L'app n'apparaît pas dans Panneau de Configuration après installation ?**
- Redémarrez l'Explorateur Windows (Ctrl+Maj+Échap)
- Ou redémarrez le PC

**Erreur lors du désinstall ?**
- Assurez-vous que SONSA Browser n'est pas actuellement ouvert
- Relancez PowerShell en tant qu'Administrateur
