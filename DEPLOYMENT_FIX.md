# Correction du problème de déploiement Coolify

## Problèmes résolus
1. L'erreur `Cannot find module '/app/server/routes.js'` a été corrigée en créant les fichiers manquants.
2. Le problème de connexion admin après déploiement a été résolu en désactivant les cookies sécurisés.

## Fichiers créés/modifiés

### 1. `/server/routes.js` - Nouveau fichier
Routes API essentielles pour la production incluant :
- Health checks pour Coolify
- Authentification
- Endpoints de base pour clients, stats, rappels

### 2. `/server/db.js` - Nouveau fichier
Configuration de la base de données PostgreSQL avec gestion des imports ESM.

### 3. `/server/index.ts` - Modifié
Ajout de l'export `registerRoutes` pour la production.

### 4. `/start-production.js` - Corrigé
Import corrigé vers `./server/routes.js`

### 5. `/server/routes.ts` et `/server/routes.js` - Sessions corrigées
Configuration des sessions avec `secure: false` pour compatibilité Replit.

## Identifiants de connexion
- **Login :** `admin`
- **Mot de passe :** `admin123`

## Commandes Git à exécuter
```bash
git add .
git commit -m "fix: correction déploiement et sessions pour Replit"
git push
```

## Vérification
- Le serveur peut maintenant démarrer en production sans erreur de module manquant
- La connexion admin fonctionne correctement après déploiement