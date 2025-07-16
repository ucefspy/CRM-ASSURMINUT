import { createServer } from "http";
import session from "express-session";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

export async function registerRoutes(app) {
  // Health check endpoints pour Coolify
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/health', async (req, res) => {
    try {
      // Vérifier la connexion à la base de données
      await pool.query('SELECT 1');
      res.status(200).json({ 
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Configuration des sessions
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Désactiver secure pour Replit
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 heures
    }
  }));

  // Middleware d'authentification
  const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Non autorisé" });
    }
    next();
  };

  // Routes d'authentification
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Vérifier l'utilisateur
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Identifiants invalides" });
      }

      // Créer la session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      };

      res.json({ 
        message: "Connexion réussie",
        user: req.session.user 
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnexion réussie" });
    });
  });

  app.get('/api/me', requireAuth, (req, res) => {
    res.json(req.session.user);
  });

  // Routes de base pour les autres endpoints
  app.get('/api/clients', requireAuth, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM clients ORDER BY nom');
      res.json(result.rows);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  app.get('/api/stats', requireAuth, async (req, res) => {
    try {
      const clientsResult = await pool.query('SELECT COUNT(*) FROM clients');
      const devisResult = await pool.query('SELECT COUNT(*) FROM devis');
      const contractsResult = await pool.query('SELECT COUNT(*) FROM devis WHERE statut = \'signe\'');
      
      const totalClients = parseInt(clientsResult.rows[0].count);
      const quotesGiven = parseInt(devisResult.rows[0].count);
      const contractsSigned = parseInt(contractsResult.rows[0].count);
      const conversionRate = quotesGiven > 0 ? (contractsSigned / quotesGiven) * 100 : 0;

      res.json({
        totalClients,
        quotesGiven,
        contractsSigned,
        conversionRate: Math.round(conversionRate * 100) / 100
      });
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  app.get('/api/rappels/today', requireAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await pool.query(
        'SELECT * FROM rappels WHERE date_rappel::date = $1 ORDER BY date_rappel',
        [today]
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Créer et retourner le serveur HTTP
  const server = createServer(app);
  return server;
}