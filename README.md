# SONSA Browser Prototype

Prototype d'un navigateur SONSA avec un serveur admin simple pour collecter les adresses IP/MAC des machines qui utilisent le navigateur.

## Structure

- `main.js` : entrée Electron du navigateur.
- `preload.js` : collecte IP/MAC et expose l'API de rapport.
- `renderer/` : interface du navigateur.
- `server/` : serveur admin Express.
- `server/public/` : interface admin.
- `server/data/devices.json` : stockage des appareils.

## Installation

Dans le dossier du projet :

```powershell
npm install
```

## Exécution

1. Démarrer le serveur admin :

```powershell
npm.cmd run server
```

2. L'interface admin est disponible sur :

```text
http://localhost:3001/admin.html
```

## Test dans un navigateur web

Tu peux tester une interface web simple depuis ton navigateur en ouvrant :

```text
http://localhost:3001/browser.html
```

Cette page permet :
- de faire une recherche avec Google (par défaut)
- d'envoyer automatiquement un rapport de machine au serveur admin
- de vérifier si les informations apparaissent dans le dashboard admin

> Important : cette page web ne peut pas récupérer automatiquement la MAC d'un navigateur classique. Elle envoie seulement l'adresse IP automatiquement depuis la requête.

## Vrai client Electron avec MAC automatique

Pour récupérer automatiquement l'adresse MAC, il faut utiliser le client Electron :

```powershell
npm.cmd start
```

Dans ce mode, SONSA utilise `os.networkInterfaces()` et peut envoyer l'IP + la MAC au serveur admin.

## Comportement

- Le navigateur SONSA envoie les informations de machine au serveur admin au démarrage.
- Le navigateur SONSA renvoie ensuite un signal automatique toutes les 5 minutes.
- Chaque navigation réussie envoie aussi un signal d'utilisation au serveur admin.
- Le serveur admin stocke : `deviceId`, `hostname`, `ipAddress`, `macAddress`, `reports`, `firstSeen`, `lastSeen`.
- La page admin montre les machines, le nombre d'utilisations, le dernier signal et la fréquence calculée entre deux rapports.
- Les adresses IP/MAC ne sont pas saisies manuellement : le client Electron collecte IP/MAC via `os.networkInterfaces()`, puis le serveur utilise l'IP de la requête comme secours.

## Notes

- Les recherches sont effectuées directement par SONSA vers les moteurs externes.
- Le serveur admin ne voit que les adresses IP/MAC et les données de connexion.
