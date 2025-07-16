import { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

// Middleware d'authentification de base
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const sessionInfo = {
    sessionId: req.sessionID,
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    user: req.session?.user ? req.session.user.username : 'none'
  };
  
  // Afficher les logs seulement si pas d'utilisateur connecté
  if (!req.session?.user) {
    console.log('Session check:', sessionInfo);
    return res.status(401).json({ message: "Non autorisé" });
  }
  
  req.user = req.session.user;
  next();
};

// Middleware pour vérifier le rôle admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès refusé - Privilèges administrateur requis" });
  }
  next();
};

// Middleware pour vérifier le rôle superviseur ou admin
export const requireSupervisorOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !['admin', 'superviseur'].includes(req.user.role)) {
    return res.status(403).json({ message: "Accès refusé - Privilèges superviseur ou administrateur requis" });
  }
  next();
};

// Middleware pour vérifier que l'utilisateur peut gérer d'autres utilisateurs
export const canManageUsers = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  
  const userRole = req.user.role;
  const targetUserId = req.params.id ? parseInt(req.params.id) : null;
  
  // Admin peut tout faire
  if (userRole === 'admin') {
    return next();
  }
  
  // Superviseur peut gérer les agents seulement
  if (userRole === 'superviseur') {
    // Pour les routes de création, on vérifiera le rôle dans le body
    if (req.method === 'POST' || req.method === 'PUT') {
      const targetRole = req.body.role;
      if (targetRole && targetRole !== 'agent') {
        return res.status(403).json({ message: "Un superviseur ne peut créer ou modifier que des agents" });
      }
    }
    return next();
  }
  
  // Les agents ne peuvent pas gérer d'autres utilisateurs
  return res.status(403).json({ message: "Accès refusé - Privilèges insuffisants" });
};

// Middleware pour vérifier l'accès aux données client
export const canAccessClient = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  
  const userRole = req.user.role;
  
  // Admin et superviseur peuvent accéder à tous les clients
  if (['admin', 'superviseur'].includes(userRole)) {
    return next();
  }
  
  // Les agents peuvent accéder à tous les clients pour le moment
  // (on pourrait ajouter une logique de filtrage par créateur si nécessaire)
  next();
};

// Middleware pour limiter les actions selon le rôle
export const roleBasedAccess = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Accès refusé - Rôles autorisés: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

// Middleware pour vérifier que l'utilisateur peut accéder à ses propres données ou aux données qu'il gère
export const canAccessUserData = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }
  
  const userRole = req.user.role;
  const targetUserId = req.params.id ? parseInt(req.params.id) : null;
  
  // Admin peut accéder à toutes les données
  if (userRole === 'admin') {
    return next();
  }
  
  // Superviseur peut accéder aux données des agents
  if (userRole === 'superviseur') {
    // On devrait vérifier si l'utilisateur ciblé est un agent
    // Pour l'instant, on autorise l'accès
    return next();
  }
  
  // Agent ne peut accéder qu'à ses propres données
  if (targetUserId && targetUserId !== req.user.id) {
    return res.status(403).json({ message: "Accès refusé - Vous ne pouvez accéder qu'à vos propres données" });
  }
  
  next();
};