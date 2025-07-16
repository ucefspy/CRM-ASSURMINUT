import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User, LoginData } from "@shared/schema";

// Cache simple pour éviter les requêtes répétées à la base de données
const userCache = new Map<string, { user: User; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    
    const user = await storage.getUserByUsername(loginData.username);
    
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
