# Dockerfile Correction Finale - Conflit Vite/React

## 🔍 Problème identifié
```
npm error ERESOLVE could not resolve
npm error While resolving: @vitejs/plugin-react@4.3.3
npm error Found: vite@6.3.5
npm error Could not resolve dependency:
npm error peer vite@"^4.2.0 || ^5.0.0" from @vitejs/plugin-react@4.3.3
```

## 🛠️ Solution appliquée

### Correction Dockerfile :
```dockerfile
# Installer toutes les dépendances avec legacy-peer-deps pour résoudre les conflits
RUN npm ci --legacy-peer-deps
```

### Explication du problème :
- **vite@6.3.5** est installé (version récente)
- **@vitejs/plugin-react@4.3.3** requiert vite@^4.2.0 || ^5.0.0
- Conflit de versions entre vite v6 et plugin React v4

### Solution `--legacy-peer-deps` :
- Ignore les conflits de peer dependencies
- Utilise l'algorithme d'installation NPM v6 (plus permissif)
- Permet l'installation malgré les versions incompatibles

## 🚀 Prochaines étapes

1. **Redéployez** dans Coolify
2. **Surveillez** les logs - `npm ci --legacy-peer-deps` devrait réussir
3. **Vérifiez** que le build continue avec `npm run build`
4. **Testez** l'application déployée

## 📋 Configuration finale recommandée

### Dockerfile optimisé :
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Installer les dépendances système
RUN apk add --no-cache python3 make g++ postgresql-client curl

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances avec legacy-peer-deps
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p uploads dist

# Build l'application
RUN npm run build

# Vérifier que le build a réussi
RUN ls -la dist/

# Exposer le port
EXPOSE 5000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Démarrer l'application avec le script de production
CMD ["node", "start-production.js"]
```

## 🎯 Résultat attendu

Après redéploiement :
- ✅ **npm ci --legacy-peer-deps** réussit
- ✅ **npm run build** termine avec succès
- ✅ **Dockerfile** se construit entièrement
- ✅ **Application** accessible sur l'URL Coolify
- ✅ **CRM ASSURMINUT** pleinement fonctionnel

---

**Le déploiement devrait maintenant réussir sans erreur de dépendances !**