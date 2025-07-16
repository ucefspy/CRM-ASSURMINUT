import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { readFileSync } from 'fs';
import { join } from 'path';

// Lire l'URL Supabase depuis le fichier .env
let supabaseUrl = process.env.DATABASE_URL;

try {
  const envContent = readFileSync(join(process.cwd(), '.env'), 'utf8');
  const envLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
  if (envLine) {
    supabaseUrl = envLine.split('=')[1];
  }
} catch (error) {
  console.log("Impossible de lire le fichier .env, utilisation de la variable d'environnement");
}

console.log("=== CONFIGURATION BASE DE DONNÉES ===");
console.log("URL utilisée:", supabaseUrl);

if (!supabaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: supabaseUrl,
  ssl: supabaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : false,
  // Configuration optimisée pour Supabase
  max: 10, // Maximum de 10 connexions
  idleTimeoutMillis: 60000, // 1 minute avant fermeture des connexions inactives
  connectionTimeoutMillis: 20000, // 20 secondes de timeout pour les nouvelles connexions
  statement_timeout: 60000, // 1 minute pour l'exécution des requêtes
  query_timeout: 60000, // 1 minute pour les requêtes
  keepAlive: true, // Garder les connexions ouvertes
  keepAliveInitialDelayMillis: 0 // Pas de délai initial pour keepAlive
});
export const db = drizzle({ client: pool, schema });