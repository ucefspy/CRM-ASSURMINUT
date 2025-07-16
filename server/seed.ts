import { authService } from "./auth";
import { storage } from "./storage";
import type { InsertUser } from "@shared/schema";

// Données des comptes par défaut
const defaultUsers: InsertUser[] = [
  {
    username: "admin",
    email: "admin@crm.com",
    password: "admin123",
    nom: "Admin",
    prenom: "Système",
    role: "admin",
    actif: true
  },
  {
    username: "super1",
    email: "super1@crm.com",
    password: "super123",
    nom: "Superviseur",
    prenom: "Un",
    role: "superviseur",
    actif: true
  },
  {
    username: "super2",
    email: "super2@crm.com",
    password: "super123",
    nom: "Superviseur",
    prenom: "Deux",
    role: "superviseur",
    actif: true
  },
  {
    username: "super3",
    email: "super3@crm.com",
    password: "super123",
    nom: "Superviseur",
    prenom: "Trois",
    role: "superviseur",
    actif: true
  },
  {
    username: "super4",
    email: "super4@crm.com",
    password: "super123",
    nom: "Superviseur",
    prenom: "Quatre",
    role: "superviseur",
    actif: true
  },
  {
    username: "agent1",
    email: "agent1@crm.com",
    password: "agent123",
    nom: "Agent",
    prenom: "Un",
    role: "agent",
    actif: true
  },
  {
    username: "agent2",
    email: "agent2@crm.com",
    password: "agent123",
    nom: "Agent",
    prenom: "Deux",
    role: "agent",
    actif: true
  }
];

export async function seedDefaultUsers(): Promise<void> {
  console.log("🌱 Initialisation des comptes par défaut...");
  
  try {
    // Vérifier si des utilisateurs existent déjà
    const existingUsers = await storage.getAllUsers();
    
    if (existingUsers.length > 0) {
      console.log("ℹ️  Des utilisateurs existent déjà, pas d'initialisation nécessaire");
      return;
    }
    
    // Créer les comptes par défaut
    for (const userData of defaultUsers) {
      try {
        await authService.createUser(userData);
        console.log(`✅ Compte créé: ${userData.username} (${userData.role})`);
      } catch (error) {
        console.error(`❌ Erreur création ${userData.username}:`, error.message);
      }
    }
    
    console.log("🎉 Initialisation des comptes terminée!");
    console.log("\n📋 Comptes disponibles:");
    console.log("👑 Admin: admin@crm.com / admin123");
    console.log("🧑‍💼 Superviseurs: super1@crm.com à super4@crm.com / super123");
    console.log("👨‍💻 Agents: agent1@crm.com, agent2@crm.com / agent123");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation des comptes:", error);
  }
}

// Fonction pour réinitialiser les comptes (utile pour les tests)
export async function resetUsers(): Promise<void> {
  console.log("🔄 Réinitialisation des comptes...");
  
  try {
    const existingUsers = await storage.getAllUsers();
    
    // Supprimer tous les utilisateurs sauf admin s'il existe
    for (const user of existingUsers) {
      if (user.role !== 'admin') {
        await storage.deleteUser(user.id);
        console.log(`🗑️  Compte supprimé: ${user.username}`);
      }
    }
    
    // Recréer les comptes par défaut
    await seedDefaultUsers();
    
  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
  }
}

// Fonction pour vérifier les permissions des comptes
export async function checkUserPermissions(): Promise<void> {
  console.log("🔍 Vérification des permissions...");
  
  try {
    const allUsers = await storage.getAllUsers();
    
    const adminUsers = allUsers.filter(u => u.role === 'admin');
    const supervisorUsers = allUsers.filter(u => u.role === 'superviseur');
    const agentUsers = allUsers.filter(u => u.role === 'agent');
    
    console.log(`👑 Admin: ${adminUsers.length}/1 (limite: 1)`);
    console.log(`🧑‍💼 Superviseurs: ${supervisorUsers.length}/4 (limite: 4)`);
    console.log(`👨‍💻 Agents: ${agentUsers.length} (illimité)`);
    
    // Vérifier les limites
    if (adminUsers.length > 1) {
      console.warn("⚠️  Attention: Plus d'un compte admin détecté!");
    }
    
    if (supervisorUsers.length > 4) {
      console.warn("⚠️  Attention: Plus de 4 superviseurs détectés!");
    }
    
    if (adminUsers.length === 0) {
      console.warn("⚠️  Attention: Aucun compte admin trouvé!");
    }
    
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
  }
}

// Fonction pour afficher le statut des comptes
export async function displayUserStatus(): Promise<void> {
  console.log("\n📊 Statut des comptes utilisateurs:");
  
  try {
    const allUsers = await storage.getAllUsers();
    
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ Username    │ Email               │ Rôle        │ Actif │");
    console.log("├─────────────────────────────────────────────────────────┤");
    
    for (const user of allUsers) {
      const username = user.username.padEnd(11);
      const email = user.email.padEnd(19);
      const role = user.role.padEnd(11);
      const actif = user.actif ? "✅" : "❌";
      
      console.log(`│ ${username} │ ${email} │ ${role} │ ${actif}   │`);
    }
    
    console.log("└─────────────────────────────────────────────────────────┘");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'affichage du statut:", error);
  }
}