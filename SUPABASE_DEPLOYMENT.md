# Guide de Déploiement Supabase CRM

Ce guide vous explique comment déployer et configurer votre base de données Supabase avec tous les tableaux et améliorations du CRM.

## 📋 Prérequis

1. **Compte Supabase** : Créez un compte sur [supabase.com](https://supabase.com)
2. **Projet Supabase** : Créez un nouveau projet
3. **Client PostgreSQL** : Installez `psql` (optionnel pour le script automatique)
4. **Node.js** : Version 16+ (optionnel pour le hash des mots de passe)

## 🚀 Méthodes de Déploiement

### Méthode 1 : Script Automatique (Recommandé)

1. **Récupérez vos informations Supabase** :
   - Allez sur [app.supabase.com](https://app.supabase.com)
   - Sélectionnez votre projet
   - Allez dans `Settings > API`
   - Copiez l'URL du projet et la clé de service (service_role key)

2. **Exécutez le script** :
   ```bash
   chmod +x deploy-supabase.sh
   ./deploy-supabase.sh "https://your-project.supabase.co" "your-service-key"
   ```

3. **Vérifiez le déploiement** :
   - Le script créera automatiquement toutes les tables
   - Il configurera les politiques RLS
   - Il créera les comptes utilisateur par défaut

### Méthode 2 : Exécution Manuelle

1. **Ouvrez l'éditeur SQL de Supabase** :
   - Allez sur votre projet Supabase
   - Cliquez sur `SQL Editor`

2. **Exécutez les scripts dans l'ordre** :
   ```sql
   -- 1. Exécutez d'abord le schéma principal
   -- Copiez-collez le contenu de update-supabase-schema.sql
   
   -- 2. Ensuite la configuration
   -- Copiez-collez le contenu de supabase-config.sql
   ```

3. **Mettez à jour les mots de passe** :
   ```sql
   -- Remplacez les hash par les vrais hash bcrypt
   UPDATE users SET password = '$2b$12$...' WHERE username = 'admin';
   UPDATE users SET password = '$2b$12$...' WHERE username = 'super1';
   UPDATE users SET password = '$2b$12$...' WHERE username = 'agent1';
   ```

## 📝 Configuration de l'Application

### 1. Variables d'Environnement

Créez ou mettez à jour votre fichier `.env` :

```env
# Configuration Supabase
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?sslmode=require
PGHOST=db.YOUR_PROJECT.supabase.co
PGPORT=5432
PGUSER=postgres
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=postgres

# Configuration Session
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
NODE_ENV=production
```

### 2. Mise à Jour du Code

Vérifiez que votre code utilise la bonne configuration :

```typescript
// server/db.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Pour Supabase, utilisez pg au lieu de neon
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });
```

## 🔐 Comptes Utilisateur Par Défaut

Après le déploiement, vous aurez ces comptes :

| Rôle | Email | Mot de passe | Permissions |
|------|-------|--------------|-------------|
| Admin | admin@crm.com | admin123 | Accès complet |
| Superviseur | super1@crm.com | super123 | Gestion des agents |
| Agent | agent1@crm.com | agent123 | Accès limité |

## 🛠️ Vérification du Déploiement

### Tests de Connexion

1. **Test de base** :
   ```bash
   psql "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?sslmode=require" -c "SELECT version();"
   ```

2. **Test des tables** :
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

3. **Test des données** :
   ```sql
   SELECT username, role FROM users;
   SELECT COUNT(*) FROM clients;
   ```

### Tests de l'Application

1. **Démarrez l'application** :
   ```bash
   npm run dev
   ```

2. **Testez la connexion** :
   - Allez sur http://localhost:5000
   - Connectez-vous avec admin@crm.com / admin123
   - Vérifiez que le menu Administration apparaît

## 📊 Fonctionnalités Déployées

### Tables Créées
- ✅ **users** : Gestion des utilisateurs (admin, superviseur, agent)
- ✅ **clients** : Informations clients complètes
- ✅ **devis** : Système de devis avec PDF
- ✅ **documents** : Gestion des documents
- ✅ **rappels** : Système de rappels/agenda
- ✅ **appels** : Journal des appels

### Fonctionnalités
- ✅ **Authentification** : Système de sessions sécurisé
- ✅ **Rôles** : 3 niveaux d'accès
- ✅ **RLS** : Politiques de sécurité au niveau des lignes
- ✅ **Index** : Optimisation des performances
- ✅ **Contraintes** : Validation des données
- ✅ **Triggers** : Mise à jour automatique des timestamps

## 🔧 Dépannage

### Problèmes Courants

1. **Erreur de connexion** :
   - Vérifiez l'URL et la clé de service
   - Assurez-vous que le projet Supabase est actif

2. **Erreur de permissions** :
   - Utilisez la service_role key, pas la anon key
   - Vérifiez les politiques RLS

3. **Erreur de schéma** :
   - Supprimez les tables existantes si nécessaire
   - Réexécutez le script complet

### Commandes Utiles

```bash
# Vérifier les tables
psql $DATABASE_URL -c "\dt"

# Vérifier les utilisateurs
psql $DATABASE_URL -c "SELECT * FROM users;"

# Réinitialiser une table
psql $DATABASE_URL -c "TRUNCATE users CASCADE;"

# Sauvegarder la base
pg_dump $DATABASE_URL > backup.sql

# Restaurer la base
psql $DATABASE_URL < backup.sql
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Consultez les logs** :
   - Dans Supabase Dashboard > Logs
   - Dans votre application console

2. **Vérifiez la documentation** :
   - [Documentation Supabase](https://supabase.com/docs)
   - [Documentation Drizzle](https://orm.drizzle.team)

3. **Testez étape par étape** :
   - Connexion à la base
   - Création des tables
   - Insertion des données
   - Test de l'application

## 🔄 Mises à Jour Futures

Pour mettre à jour le schéma :

1. **Modifiez le fichier** `shared/schema.ts`
2. **Exécutez** `npm run db:push`
3. **Ou réexécutez** le script de déploiement

Le système est maintenant prêt pour la production !