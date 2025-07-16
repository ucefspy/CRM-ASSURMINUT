import bcrypt from 'bcryptjs';
import { storage } from './server/storage.js';

async function updatePasswords() {
  console.log('🔐 Mise à jour des mots de passe...');
  
  const users = [
    { username: 'admin', password: 'admin123', email: 'admin@crm.com' },
    { username: 'super1', password: 'super123', email: 'super1@crm.com' },
    { username: 'agent1', password: 'agent123', email: 'agent1@crm.com' }
  ];

  for (const { username, password, email } of users) {
    try {
      // Générer le hash
      const hash = await bcrypt.hash(password, 12);
      console.log(`✓ Hash généré pour ${username}: ${hash.substring(0, 30)}...`);
      
      // Trouver l'utilisateur
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        // Mettre à jour le mot de passe
        await storage.updateUser(existingUser.id, { password: hash });
        console.log(`✓ Mot de passe mis à jour pour ${username}`);
      } else {
        console.log(`⚠️  Utilisateur ${username} non trouvé`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${username}:`, error.message);
    }
  }

  console.log('🎉 Mise à jour terminée!');
}

updatePasswords().catch(console.error);