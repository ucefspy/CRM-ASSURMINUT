import { Request, Response } from "express";
import { ZodError } from "zod";
import { authService } from "../auth";
import { storage } from "../storage";
import { loginSchema, insertUserSchema } from "@shared/schema";
import type { AuthenticatedRequest } from "../middleware/auth";

export class UserController {
  // Connexion utilisateur
  async login(req: Request, res: Response) {
    try {
      const loginData = loginSchema.parse(req.body);
      
      console.log('Tentative de connexion pour:', loginData.username);
      const user = await authService.authenticate(loginData);
      
      if (!user) {
        return res.status(401).json({ message: "Identifiants incorrects" });
      }
      
      // Stocker l'utilisateur en session
      req.session.user = user;
      
      console.log(`Connexion réussie pour ${user.username} (${user.role})`);
      res.json({ user, message: "Connexion réussie" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  }

  // Déconnexion utilisateur
  async logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur lors de la déconnexion:', err);
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnecté avec succès" });
    });
  }

  // Obtenir les informations de l'utilisateur connecté
  async getMe(req: AuthenticatedRequest, res: Response) {
    res.json({ user: req.user });
  }

  // Créer un nouvel utilisateur (admin et superviseur seulement)
  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userData = insertUserSchema.parse(req.body);
      const currentUser = req.user;
      
      // Vérifications des permissions selon le rôle
      if (currentUser.role === 'superviseur' && userData.role !== 'agent') {
        return res.status(403).json({ 
          message: "Un superviseur ne peut créer que des comptes agent" 
        });
      }
      
      if (currentUser.role === 'agent') {
        return res.status(403).json({ 
          message: "Les agents ne peuvent pas créer d'autres comptes" 
        });
      }
      
      // Vérifier les limites selon le rôle
      if (userData.role === 'admin' && currentUser.role !== 'admin') {
        return res.status(403).json({ 
          message: "Seul un admin peut créer des comptes admin" 
        });
      }
      
      if (userData.role === 'superviseur' && currentUser.role !== 'admin') {
        return res.status(403).json({ 
          message: "Seul un admin peut créer des comptes superviseur" 
        });
      }
      
      // Vérifier les limites de nombre d'utilisateurs
      if (userData.role === 'admin') {
        const existingAdmins = await storage.getUsersByRole('admin');
        if (existingAdmins.length >= 1) {
          return res.status(400).json({ 
            message: "Il ne peut y avoir qu'un seul compte admin" 
          });
        }
      }
      
      if (userData.role === 'superviseur') {
        const existingSupervisors = await storage.getUsersByRole('superviseur');
        if (existingSupervisors.length >= 4) {
          return res.status(400).json({ 
            message: "Il ne peut y avoir que 4 comptes superviseur maximum" 
          });
        }
      }
      
      const newUser = await authService.createUser(userData);
      
      console.log(`Utilisateur créé: ${newUser.username} (${newUser.role}) par ${currentUser.username}`);
      res.status(201).json({ user: newUser, message: "Utilisateur créé avec succès" });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error('Erreur lors de la création d\'utilisateur:', error);
      res.status(500).json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  }

  // Obtenir la liste des utilisateurs
  async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = req.user;
      let users;
      
      if (currentUser.role === 'admin') {
        // Admin peut voir tous les utilisateurs
        users = await storage.getAllUsers();
      } else if (currentUser.role === 'superviseur') {
        // Superviseur peut voir tous les agents + les autres superviseurs + admin
        users = await storage.getAllUsers();
      } else {
        // Agent ne peut voir que lui-même
        users = [currentUser];
      }
      
      // Retirer les mots de passe pour la sécurité
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({ users: usersWithoutPasswords });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
  }

  // Obtenir un utilisateur par ID
  async getUserById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Vérifier les permissions d'accès
      if (currentUser.role === 'agent' && user.id !== currentUser.id) {
        return res.status(403).json({ 
          message: "Vous ne pouvez accéder qu'à vos propres informations" 
        });
      }
      
      if (currentUser.role === 'superviseur' && user.role === 'admin') {
        return res.status(403).json({ 
          message: "Un superviseur ne peut pas accéder aux informations de l'admin" 
        });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
    }
  }

  // Supprimer un utilisateur
  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }
      
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Vérifications des permissions
      if (currentUser.role === 'agent') {
        return res.status(403).json({ 
          message: "Les agents ne peuvent pas supprimer d'autres comptes" 
        });
      }
      
      if (currentUser.role === 'superviseur') {
        if (targetUser.role !== 'agent') {
          return res.status(403).json({ 
            message: "Un superviseur ne peut supprimer que des comptes agent" 
          });
        }
      }
      
      // Empêcher la suppression de l'admin
      if (targetUser.role === 'admin') {
        return res.status(403).json({ 
          message: "Le compte admin ne peut pas être supprimé" 
        });
      }
      
      // Empêcher l'auto-suppression
      if (targetUser.id === currentUser.id) {
        return res.status(403).json({ 
          message: "Vous ne pouvez pas supprimer votre propre compte" 
        });
      }
      
      await storage.deleteUser(userId);
      
      console.log(`Utilisateur supprimé: ${targetUser.username} par ${currentUser.username}`);
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" });
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user;
      const updateData = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }
      
      const targetUser = await storage.getUser(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      
      // Vérifications des permissions
      if (currentUser.role === 'agent' && targetUser.id !== currentUser.id) {
        return res.status(403).json({ 
          message: "Vous ne pouvez modifier que vos propres informations" 
        });
      }
      
      if (currentUser.role === 'superviseur' && targetUser.role !== 'agent' && targetUser.id !== currentUser.id) {
        return res.status(403).json({ 
          message: "Un superviseur ne peut modifier que des comptes agent ou son propre compte" 
        });
      }
      
      // Empêcher la modification du rôle par des non-admins
      if (updateData.role && currentUser.role !== 'admin') {
        return res.status(403).json({ 
          message: "Seul un admin peut modifier les rôles" 
        });
      }
      
      // Hasher le mot de passe si fourni
      if (updateData.password) {
        updateData.password = await authService.hashPassword(updateData.password);
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      const { password, ...userWithoutPassword } = updatedUser;
      
      console.log(`Utilisateur mis à jour: ${updatedUser.username} par ${currentUser.username}`);
      res.json({ user: userWithoutPassword, message: "Utilisateur mis à jour avec succès" });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  }

  // Obtenir les statistiques des utilisateurs (admin seulement)
  async getUserStats(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUser = req.user;
      
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ 
          message: "Seul un admin peut accéder aux statistiques" 
        });
      }
      
      const allUsers = await storage.getAllUsers();
      
      const stats = {
        total: allUsers.length,
        admin: allUsers.filter(u => u.role === 'admin').length,
        superviseur: allUsers.filter(u => u.role === 'superviseur').length,
        agent: allUsers.filter(u => u.role === 'agent').length,
        active: allUsers.filter(u => u.actif).length,
        inactive: allUsers.filter(u => !u.actif).length
      };
      
      res.json({ stats });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  }
}

export const userController = new UserController();