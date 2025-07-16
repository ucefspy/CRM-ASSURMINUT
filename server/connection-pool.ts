import { Pool } from "pg";
import { readFileSync } from "fs";

// Configuration optimisée pour Supabase avec gestion des erreurs
const supabaseUrl = process.env.SUPABASE_URL || 
  readFileSync('.env', 'utf8')
    .split('\n')
    .find(line => line.startsWith('SUPABASE_URL='))
    ?.split('=')[1] || 
  process.env.DATABASE_URL;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL ou DATABASE_URL doit être définie");
}

console.log('=== CONFIGURATION POOL DE CONNEXION ===');
console.log('URL utilisée:', supabaseUrl.replace(/:[^:@]*@/, ':****@'));

class ConnectionPool {
  private pool: Pool;
  private isConnected = false;

  constructor() {
    this.pool = new Pool({
      connectionString: supabaseUrl,
      ssl: supabaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : false,
      // Configuration ultra-optimisée pour réduire la latence
      max: 3, // Très peu de connexions simultanées
      min: 1, // Garder au moins une connexion ouverte
      idleTimeoutMillis: 20000, // 20 secondes
      connectionTimeoutMillis: 3000, // 3 secondes maximum
      statement_timeout: 8000, // 8 secondes pour les requêtes
      query_timeout: 8000, // 8 secondes pour les requêtes
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
      application_name: 'crm-assurminut'
    });

    // Gestion des événements de connexion
    this.pool.on('connect', () => {
      console.log('Nouvelle connexion établie avec Supabase');
      this.isConnected = true;
    });

    this.pool.on('error', (err) => {
      console.error('Erreur de connexion pool:', err.message);
      this.isConnected = false;
    });

    // Préchauffer une connexion
    this.warmUp();
  }

  private async warmUp() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Pool de connexion préchauffé avec succès');
    } catch (error) {
      console.error('Erreur lors du préchauffage:', error.message);
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log(`Requête exécutée en ${duration}ms: ${text.substring(0, 50)}...`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Erreur requête (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  async end() {
    await this.pool.end();
    console.log('Pool de connexion fermé');
  }
}

export const connectionPool = new ConnectionPool();
export const pool = connectionPool.getPool();