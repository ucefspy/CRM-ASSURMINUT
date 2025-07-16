import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User, LoginData } from "@shared/schema";

// Cache simple pour éviter les requêtes répétées à la base de données
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes - cache plus long

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async authenticate(loginData: LoginData): Promise<User | null> {
    // Vérifier le cache d'abord
    const cacheKey = `${loginData.username}:${loginData.password}`;
    const cached = userCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('Utilisation du cache pour l\'authentification de:', loginData.username);
      return cached.user;
    }

    console.log('Authentification via base de données pour:', loginData.username);
    
    try {
      // Essayer d'abord par nom d'utilisateur, puis par email
      let user = await Promise.race([
        storage.getUserByUsername(loginData.username),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout authentification')), 8000)
        )
      ]);
      
      // Si pas trouvé par username, essayer par email
      if (!user) {
        user = await Promise.race([
          storage.getUserByEmail(loginData.username),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout authentification')), 8000)
          )
        ]);
      }
      
      if (!user || !user.actif) {
        return null;
      }

      const isValid = await this.verifyPassword(loginData.password, user.password);
      
      if (!isValid) {
        return null;
      }

      // Retourner l'utilisateur sans le mot de passe
      const { password, ...userWithoutPassword } = user;
      const authenticatedUser = userWithoutPassword as User;
      
      // Mettre en cache le résultat
      userCache.set(cacheKey, { user: authenticatedUser, timestamp: Date.now() });
      
      return authenticatedUser;
    } catch (error) {
      console.error('Erreur authentification:', error.message);
      return null;
    }
  }

  async createUser(userData: { username: string; email: string; password: string; nom: string; prenom: string; role?: string }): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: userData.role || "agent",
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}

export const authService = new AuthService();
