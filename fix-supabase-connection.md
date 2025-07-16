# Guide de Résolution - Connexion Supabase

## 🔍 Problème Identifié

Votre clé API Supabase est invalide ou vous utilisez la mauvaise clé.

## 🔧 Solution Étape par Étape

### 1. Récupérer la Bonne Clé API

1. **Allez sur votre projet Supabase** :
   - Ouvrez [app.supabase.com](https://app.supabase.com)
   - Connectez-vous à votre compte
   - Sélectionnez le projet `hiyuhkilffabnjwpkdby`

2. **Naviguez vers les paramètres API** :
   - Cliquez sur l'icône ⚙️ (Settings) dans la sidebar
   - Sélectionnez "API" dans le menu

3. **Copiez la bonne clé** :
   - **PAS la clé `anon public`** ❌
   - **OUI la clé `service_role`** ✅ (cette clé est secrète)

### 2. Vérifier l'URL du Projet

Votre URL de projet devrait être :
```
https://hiyuhkilffabnjwpkdby.supabase.co
```

### 3. Mettre à Jour la Configuration

Une fois que vous avez la bonne clé `service_role`, mettez à jour votre fichier `.env` :

```env
# URL de votre projet Supabase
SUPABASE_URL=https://hiyuhkilffabnjwpkdby.supabase.co

# Clé de service (pas la clé publique!)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.VOTRE_VRAIE_CLE_SERVICE

# URL de connexion à la base de données
DATABASE_URL=postgresql://postgres:VOTRE_VRAIE_CLE_SERVICE@db.hiyuhkilffabnjwpkdby.supabase.co:5432/postgres?sslmode=require
```

### 4. Tester la Connexion

Une fois la configuration mise à jour, testez avec :

```bash
# Remplacez YOUR_REAL_SERVICE_KEY par votre vraie clé
./debug-supabase.sh "https://hiyuhkilffabnjwpkdby.supabase.co" "YOUR_REAL_SERVICE_KEY"
```

## 🎯 Format de la Clé Service

La clé `service_role` devrait :
- Commencer par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.`
- Être très longue (plus de 200 caractères)
- Contenir des points (.) séparant les parties JWT
- **JAMAIS** la partager publiquement

## 🔒 Sécurité

⚠️ **Important** : La clé `service_role` donne un accès complet à votre base de données. Ne la partagez jamais et ne la commitez jamais dans un repository public.

## 🚀 Prochaines Étapes

1. Récupérez la vraie clé `service_role`
2. Mettez à jour votre `.env`
3. Testez la connexion
4. Exécutez le script de déploiement

## 📞 Si Vous Avez Encore des Problèmes

Si le problème persiste après avoir utilisé la bonne clé :

1. **Vérifiez que votre projet Supabase est actif** (pas en pause)
2. **Vérifiez votre plan de facturation** Supabase
3. **Regardez les logs** dans le dashboard Supabase
4. **Contactez le support** Supabase si nécessaire

## 📋 Checklist de Vérification

- [ ] J'ai récupéré la clé `service_role` (pas `anon public`)
- [ ] J'ai mis à jour le fichier `.env`
- [ ] J'ai testé la connexion avec le script de debug
- [ ] Mon projet Supabase est actif
- [ ] J'ai vérifié les logs dans le dashboard Supabase

Une fois ces étapes terminées, votre connexion Supabase devrait fonctionner parfaitement !