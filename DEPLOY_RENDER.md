# Déploiement sur Render

## Configuration

### Architecture
- **App Electron**: Reste sur les postes clients (navigateur SONSA)
- **Serveur API**: Hébergé sur Render (admin server pour collecter IP/MAC)

### Étapes de déploiement

1. **Créer un compte Render**
   - Allez sur https://render.com
   - Créez un compte (gratuit)

2. **Connecter votre Git**
   - Liez votre compte GitHub/GitLab/Gitea à Render
   - Poussez ce projet sur votre repository

3. **Créer un Web Service sur Render**
   - Cliquez sur "New +" → "Web Service"
   - Sélectionnez votre repository
   - Configurez:
     - **Name**: `sonsa-admin-server`
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node ./server/index.js`
     - **Plan**: Free (ou Premium selon vos besoins)

4. **Variables d'environnement**
   - Dans le dashboard Render, allez à "Environment"
   - Ajoutez:
     ```
     NODE_ENV=production
     PORT=3001
     ```

5. **Déploiement**
   - Render déploiera automatiquement lors de chaque push sur votre branche

### URL de l'API
Une fois déployée, votre URL sera: `https://sonsa-admin-server.onrender.com` (l'URL exacte dépendra du nom que vous choisissez)

### Mise à jour de l'app Electron
Dans votre app Electron, modifiez l'URL du serveur:

```javascript
// Avant (localhost)
const API_URL = 'http://localhost:3001';

// Après (Render)
const API_URL = 'https://votre-service.onrender.com';
```

### Stockage des données
- Sur Render Free: Les données sont perdues lors des redémarrages (tmp storage)
- **Recommandé**: Utiliser une base de données persistante
  - MongoDB Atlas (gratuit)
  - PostgreSQL sur Render
  - SQLite avec synchronisation cloud

### Limitations du plan Free
- L'app s'éteint après 15 minutes d'inactivité (peut causer des délais)
- Stockage temporaire limité
- Bande passante limitée

### Conseils de production
1. Ajouter CORS pour permettre les requêtes depuis les clients Electron
2. Implémenter l'authentification pour protéger l'API admin
3. Ajouter un logging pour le monitoring
4. Utiliser une base de données persistante
5. Configurer des alertes de performance
