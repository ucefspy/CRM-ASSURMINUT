import bcrypt from 'bcrypt';

async function generatePasswords() {
  const passwords = [
    { username: 'admin', password: 'admin123' },
    { username: 'super1', password: 'super123' },
    { username: 'agent1', password: 'agent123' }
  ];

  console.log('-- Mots de passe hashés pour les utilisateurs par défaut');
  console.log('');

  for (const { username, password } of passwords) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`UPDATE users SET password = '${hash}' WHERE username = '${username}';`);
  }

  console.log('');
  console.log('-- Vérification des utilisateurs existants');
  console.log('SELECT username, email, role FROM users ORDER BY role, username;');
}

generatePasswords().catch(console.error);