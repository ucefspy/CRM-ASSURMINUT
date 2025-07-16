# Comptes Utilisateurs CRM

Ce fichier liste tous les comptes utilisateurs disponibles dans le système CRM.

## 🔐 Comptes par Défaut

### Administrateur
- **Email**: admin@crm.com
- **Mot de passe**: admin123
- **Rôle**: admin
- **Permissions**: Accès complet au système, gestion des utilisateurs, statistiques

### Superviseur
- **Email**: super1@crm.com
- **Mot de passe**: super123
- **Rôle**: superviseur
- **Permissions**: Gestion des agents, accès aux fonctions d'administration

### Agent
- **Email**: agent1@crm.com
- **Mot de passe**: agent123
- **Rôle**: agent
- **Permissions**: Fonctions CRM standard, pas d'accès administration

## 👥 Autres Utilisateurs

Les utilisateurs suivants sont également présents dans la base de données :

- **camille.michel@assurminut.fr** - Agent
- **claire.lefebvre@assurminut.fr** - Agent
- **julien.moreau@assurminut.fr** - Agent
- **lucas.garcia@assurminut.fr** - Agent
- **marie.dupont@assurminut.fr** - Agent
- **pierre.martin@assurminut.fr** - Agent
- **sophie.bernard@assurminut.fr** - Agent
- **thomas.simon@assurminut.fr** - Agent

*Note: Ces comptes utilisent tous le mot de passe par défaut hashé. Contactez l'administrateur pour obtenir les mots de passe.*

## 🔧 Gestion des Mots de Passe

Les mots de passe sont hashés avec bcrypt (12 rounds) pour la sécurité.

### Pour créer un nouveau mot de passe hashé :
```javascript
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('votre_mot_de_passe', 12);
```

### Pour mettre à jour un mot de passe via SQL :
```sql
UPDATE users SET password = 'hash_bcrypt' WHERE username = 'nom_utilisateur';
```

## 🎯 Niveaux d'Accès

### Admin
- Peut tout faire
- Accès aux statistiques système
- Création/suppression d'utilisateurs
- Accès à l'administration

### Superviseur
- Peut créer des agents
- Accès aux fonctions d'administration
- Gestion des équipes
- Pas de gestion des administrateurs

### Agent
- Gestion des clients
- Création de devis
- Gestion des documents
- Pas d'accès administration

## 📅 Mise à Jour

**Dernière mise à jour**: 2025-07-16
**Base de données**: Supabase
**Statut**: Tous les comptes fonctionnels

## 🔒 Sécurité

- Tous les mots de passe sont hashés avec bcrypt
- Les sessions sont sécurisées
- Politique de rôles stricte
- Jamais de mots de passe en clair dans les logs