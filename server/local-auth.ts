import bcrypt from "bcryptjs";
import type { User, LoginData } from "@shared/schema";

// Système d'authentification locale temporaire avec utilisateurs en mémoire
// Utilisé si la base de données Supabase est trop lente
const localUsers: Record<string, User> = {
  admin: {
    id: 1,
    username: "admin",
    email: "admin@crm.com",
    nom: "Admin",
    prenom: "Admin",
    role: "admin",
    actif: true,
    password: "$2b$12$vWQKCsZP7m8zh23kofic9u/iItwc0.fKP4QAodn4XJJbEHxWD/I52", // admin123
    createdAt: new Date(),
    updatedAt: new Date()
  },
  "marie.dupont": {
    id: 2,
    username: "marie.dupont",
    email: "marie.dupont@assurminut.fr",
    nom: "Dupont",
    prenom: "Marie",
    role: "agent",
    actif: true,
    password: "$2b$12$xTdMPdtYXwdV0pm7AWKfVu95CQXW2ZyX1OPwX5NGjibWDKbFneJIe", // marie123
    createdAt: new Date(),
    updatedAt: new Date()
  },
  "pierre.martin": {
    id: 3,
    username: "pierre.martin",
    email: "pierre.martin@assurminut.fr",
    nom: "Martin",
    prenom: "Pierre",
    role: "agent",
    actif: true,
    password: "$2b$12$0ntkF6LmyDH4NMSYslL4Z.OP6vuhgbJ7myJGkKFDFNPJHvHJk9Yo6", // pierre123
    createdAt: new Date(),
    updatedAt: new Date()
  },
  "sophie.bernard": {
    id: 4,
    username: "sophie.bernard",
    email: "sophie.bernard@assurminut.fr",
    nom: "Bernard",
    prenom: "Sophie",
    role: "agent",
    actif: true,
    password: "$2b$12$oR0ZgQ2W.NOJTh9jTZVrdeVoR2dEF.0mF9yFT6ichmbREpjbFZBTi", // sophie123
    createdAt: new Date(),
    updatedAt: new Date()
  },
  "julien.moreau": {
    id: 5,
    username: "julien.moreau",
    email: "julien.moreau@assurminut.fr",
    nom: "Moreau",
    prenom: "Julien",
    role: "agent",
    actif: true,
    password: "$2b$12$QrmcYJx1g56kRI8mqhSlf.CCT0dODjVK12xzThQWoNW1SwV/kG1xi", // julien123
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

export class LocalAuthService {
  async authenticate(loginData: LoginData): Promise<User | null> {
    console.log('=== AUTHENTIFICATION LOCALE ===');
    console.log('Tentative de connexion pour:', loginData.username);
    
    const user = localUsers[loginData.username];
    
    if (!user || !user.actif) {
      console.log('Utilisateur non trouvé ou inactif');
      return null;
    }

    const isValid = await bcrypt.compare(loginData.password, user.password);
    
    if (!isValid) {
      console.log('Mot de passe incorrect');
      return null;
    }

    console.log('Connexion réussie pour:', loginData.username);
    
    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }
}

export const localAuthService = new LocalAuthService();