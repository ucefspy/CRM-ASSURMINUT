# ASSURMINUT - CRM Assurance

Application CRM moderne pour courtiers en assurance automobile.

## Déploiement Production

### Configuration Coolify

**Build Pack:** Dockerfile  
**Port:** 5000  
**Start Command:** `node start-production.js`

### Variables d'environnement

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.hiyuhkilffabnjwpkdby:Ucef@1984#@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
SESSION_SECRET=assurminut-crm-secret-key-2025-production
```

### Utilisateurs par défaut

- **Admin:** admin / admin123
- **Agents:** agent1 à agent8 / admin123

## Développement Local

```bash
npm install
npm run dev
```

## Structure

- `client/` - Frontend React
- `server/` - Backend Express
- `shared/` - Schémas partagés
- `uploads/` - Fichiers uploadés

## Technologies

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Express, Drizzle ORM
- Base de données: PostgreSQL (Supabase)
- Déploiement: Docker, Coolify