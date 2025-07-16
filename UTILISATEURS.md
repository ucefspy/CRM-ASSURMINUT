# 👥 Comptes utilisateurs du CRM

## 📋 Présentation du système de rôles

Le système de CRM utilise une hiérarchie de rôles en 3 niveaux :

### 🏆 Admin (Administrateur)
- **Permissions** : Accès total au système
- **Peut faire** : Créer, modifier, supprimer tous les utilisateurs (sauf autres admins)
- **Accès** : Toutes les fonctionnalités + page d'administration
- **Limite** : 1 seul compte admin recommandé

### 🛡️ Superviseur
- **Permissions** : Gestion des agents et accès aux données
- **Peut faire** : Créer et gérer les comptes agents
- **Accès** : Toutes les fonctionnalités + gestion des agents
- **Limite** : Maximum 4 comptes superviseurs

### 👨‍💻 Agent
- **Permissions** : Accès aux fonctionnalités métier
- **Peut faire** : Gérer les clients, devis, documents, appels
- **Accès** : Fonctionnalités CRM standard
- **Limite** : Illimité

## 🔐 Comptes par défaut créés automatiquement

### Admin
| Nom d'utilisateur | Email | Mot de passe | Nom | Prénom | Rôle |
|---|---|---|---|---|---|
| `admin` | admin@crm.com | `admin123` | Admin | Système | admin |

### Superviseurs
| Nom d'utilisateur | Email | Mot de passe | Nom | Prénom | Rôle |
|---|---|---|---|---|---|
| `super1` | super1@crm.com | `super123` | Superviseur | Un | superviseur |
| `super2` | super2@crm.com | `super123` | Superviseur | Deux | superviseur |
| `super3` | super3@crm.com | `super123` | Superviseur | Trois | superviseur |
| `super4` | super4@crm.com | `super123` | Superviseur | Quatre | superviseur |

### Agents
| Nom d'utilisateur | Email | Mot de passe | Nom | Prénom | Rôle |
|---|---|---|---|---|---|
| `agent1` | agent1@crm.com | `agent123` | Agent | Un | agent |
| `agent2` | agent2@crm.com | `agent123` | Agent | Deux | agent |

## 🔧 Gestion des comptes

### Création automatique
Les comptes sont créés automatiquement au premier démarrage du serveur. Si des utilisateurs existent déjà, l'initialisation est ignorée.

### Sécurité
- Tous les mots de passe sont hashés avec bcrypt (12 rounds)
- Sessions sécurisées avec PostgreSQL
- Validation des permissions sur toutes les routes

### Accès par rôle

#### Admin peut :
- ✅ Créer des comptes admin, superviseur, agent
- ✅ Supprimer tous les comptes (sauf autres admins)
- ✅ Voir les statistiques des utilisateurs
- ✅ Accéder à toutes les fonctionnalités

#### Superviseur peut :
- ✅ Créer des comptes agents
- ✅ Supprimer des comptes agents
- ❌ Créer/supprimer des admins ou superviseurs
- ✅ Accéder à la page d'administration

#### Agent peut :
- ✅ Utiliser toutes les fonctionnalités CRM
- ❌ Accéder à la page d'administration
- ❌ Créer/supprimer des comptes

## 🚀 Utilisation

### Première connexion
1. Connectez-vous avec le compte admin : `admin@crm.com` / `admin123`
2. Changez le mot de passe par défaut
3. Créez les comptes utilisateurs nécessaires

### Tests
Pour tester les différents niveaux de permissions :
- **Admin** : Connectez-vous avec `admin@crm.com`
- **Superviseur** : Connectez-vous avec `super1@crm.com`
- **Agent** : Connectez-vous avec `agent1@crm.com`

### Réinitialisation
En cas de problème, vous pouvez réinitialiser les comptes par défaut en supprimant tous les utilisateurs de la base de données. Ils seront recréés au prochain démarrage.

## 📊 Limites du système

- **1 Admin** : Pour éviter les conflits de permissions
- **4 Superviseurs** : Limite recommandée pour une organisation
- **Agents illimités** : Selon les besoins de l'entreprise

## 🔄 Mise à jour

Ce document est automatiquement mis à jour lors des modifications du système d'authentification. Dernière mise à jour : **16 juillet 2025**