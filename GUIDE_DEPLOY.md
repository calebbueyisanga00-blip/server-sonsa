# Guide de déploiement sur Render

## 📋 Prérequis

- Compte GitHub/GitLab/Gitea (votre code doit être versionné)
- Compte Render gratuit (https://render.com)
- Votre projet poussé sur un repository Git

## 🚀 Étapes de déploiement

### 1. Préparer votre repository local

```bash
# Initialiser git si ce n'est pas fait
git init

# Ajouter tous les fichiers
git add .

# Commiter
git commit -m "Initial commit - SONSA Admin Server"

# Ajouter le remote (remplacer par votre URL)
git remote add origin https://github.com/votre-username/votre-repo.git

# Pousser vers GitHub
git branch -M main
git push -u origin main
```

### 2. Créer un compte Render

1. Allez sur https://render.com
2. Cliquez sur "Sign Up"
3. Choisissez "Sign up with GitHub" (ou GitLab)
4. Autorisez Render à accéder à vos repositories

### 3. Créer un Web Service

1. Dans le dashboard Render, cliquez sur **"New +"**
2. Sélectionnez **"Web Service"**
3. Connectez votre repository contenant le projet SONSA
4. Remplissez les informations:

| Champ | Valeur |
|-------|--------|
| **Name** | `sonsa-admin-server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node ./server/index.js` |
| **Plan** | Free (gratuit) |

### 4. Configurer les variables d'environnement

1. Dans la section "Environment", ajoutez:
   - **Key**: `NODE_ENV` | **Value**: `production`
   - **Key**: `PORT` | **Value**: `3001`

2. Cliquez sur **"Create Web Service"**

### 5. Attendre le déploiement

Render va:
1. Cloner votre repository
2. Exécuter `npm install`
3. Démarrer le serveur avec `node ./server/index.js`

Vous verrez une URL comme: `https://sonsa-admin-server.onrender.com`

## 📱 Configurer l'app Electron pour utiliser le serveur Render

Dans votre app Electron, cherchez où vous appellez l'API:

```javascript
// renderer/renderer.js ou votre fichier d'appels API
// Remplacez localhost par votre URL Render

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://votre-service.onrender.com' 
  : 'http://localhost:3001';

// Exemple d'appel API
fetch(`${API_URL}/admin/devices`)
  .then(res => res.json())
  .then(data => console.log(data));
```

## ⚠️ Important: Limitations du plan Free

- **Cold starts**: Le serveur s'éteint après 15 minutes d'inactivité
- **Stockage**: Les données sont perdues lors du redémarrage
- **Bande passante**: Limitée

### Solutions recommandées

**Pour la persistance des données**, utilisez une base de données:

#### Option 1: MongoDB Atlas (recommandé)
```bash
npm install mongoose
```

#### Option 2: PostgreSQL via Render
Dans Render, créez aussi une instance PostgreSQL gratuite

#### Option 3: Upgrade vers un plan payant
Render offre des plans à partir de $7/mois

## 🔄 Mettre à jour le serveur

```bash
# Faire vos modifications locales
# Modifier les fichiers...

# Commiter et pousser
git add .
git commit -m "Update description"
git push

# Render redéploiera automatiquement!
```

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez les logs dans le dashboard Render
- Vérifiez que `node ./server/index.js` est le bon chemin
- Assurez-vous que package.json a les bonnes dépendances

### Erreur "Cannot find module"
```bash
# Localement, installez les dépendances
npm install

# Poussez package-lock.json
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Impossible de se connecter depuis l'app Electron
- Vérifiez que l'URL Render est correcte
- Vérifiez les CORS (déjà configurés)
- Vérifiez que le serveur est démarré (check le dashboard Render)

### Les données disparaissent au redémarrage
- C'est normal avec le plan Free (stockage temporaire)
- Utilisez une vraie base de données pour la production

## 📊 Monitoring

Render offre:
- Logs en temps réel
- Statistiques d'utilisation CPU/RAM
- Alertes de redémarrage

Consultez-les dans le dashboard de votre service.

## ✅ Checklist finale

- [ ] Repository Git créé et poussé
- [ ] Compte Render créé
- [ ] Web Service créé
- [ ] Variables d'environnement configurées
- [ ] URL Render notée
- [ ] App Electron mise à jour avec la nouvelle URL
- [ ] Test d'une requête API depuis Electron

## 📞 Support

- Docs Render: https://render.com/docs
- Docs Node.js: https://nodejs.org/en/docs/
- Communauté Render: https://render.com/community
