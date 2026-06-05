# Instructions de build et distribution pour SONSA Browser

## ✅ Executable prêt à partager

L'exécutable portable est maintenant généré et prêt à partager :

**📍 Emplacement** : `dist/win-unpacked/SONSA Browser.exe`

Cet exécutable peut être lancé directement sur n'importe quel PC Windows sans installation — parfait pour partager "sans contrainte".

## Option 1 : Utiliser l'exécutable directement (recommandé)

1. Accédez à : `dist/win-unpacked/`
2. Copiez `SONSA Browser.exe` sur une clé USB, Cloud Drive, ou envoyez par email
3. Les autres utilisateurs peuvent simplement double-cliquer pour lancer le navigateur

**Avantage** : Aucune installation requise, fonctionnement immédiat.

## Option 2 : Créer un installateur (optionnel)

Si vous préférez un setup classique pour vos utilisateurs :

### A) Exécutable portable compressé (plus simple)

```powershell
npm run package:win
```

Produit un dossier `SONSA-win32-x64/` contenant tous les fichiers nécessaires — parfait pour archivage ou distribution en `.zip`.

### B) Installateur NSIS (requiert droits administrateur)

```powershell
npm run dist:nsis
```

*(Note : Nécessite droits admin pour le signing — contacter si erreur de certificat.)*

### C) MSI / Setup via WiX (avancé)

```powershell
# Installer WiX Toolset
choco install wixtoolset -y

# Générer
npm run package:win
node build-installer.js
```

## 📋 Prérequis (pour la génération, pas pour l'utilisation)

- Node.js 16+
- npm
- (Optionnel) WiX Toolset pour MSI

## 🚀 Commandes récapitulatives

| Besoin | Commande |
|--------|----------|
| Installer les dépendances | `npm install` |
| Générer nouvel exécutable | `npm run package:win` |
| Build + NSIS (si droits admin) | `npm run build:all` |
| Nettoyer le dossier dist | `rmdir /s dist` |

## 💡 Conseils de distribution

- **Sans installation** : Compressez simplement `dist/win-unpacked/SONSA Browser.exe` et partagez
- **Avec installation** : Créez un installateur NSIS ou MSI (voir options ci-dessus)
- **Multi-utilisateurs réseau** : Placez le dossier sur un serveur réseau — chacun lancera l'exe depuis le serveur
