import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { authService } from "./auth";
import { pdfService } from "./pdf";
import { pool } from "./db";
import { seedDefaultUsers } from "./seed";
import { userController } from "./controllers/userController";
import { 
  requireAuth, 
  requireAdmin, 
  requireSupervisorOrAdmin,
  canManageUsers,
  canAccessClient,
  roleBasedAccess
} from "./middleware/auth";
import { loginSchema, insertClientSchema, insertDevisSchema, insertRappelSchema, insertAppelSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import csv from "csv-parser";
import "./types";

// Configuration multer pour l'upload de fichiers
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "documents");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

// Configuration multer pour l'import de fichiers Excel/CSV
const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "imports");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const importUpload = multer({ 
  storage: importStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Seuls les fichiers .xlsx, .xls et .csv sont acceptés.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Configuration des sessions avec store en mémoire pour éviter les problèmes de base de données
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Renouveler la session à chaque requête
    cookie: {
      secure: false, // Désactiver secure pour Replit
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 heures
      sameSite: 'lax' // Améliorer la compatibilité
    }
  }));

  // Initialiser les comptes par défaut au démarrage
  await seedDefaultUsers();

  // Routes d'authentification avec gestion des rôles
  app.post("/api/login", userController.login.bind(userController));
  app.post("/api/logout", userController.logout.bind(userController));
  app.get("/api/me", requireAuth, userController.getMe.bind(userController));

  // Routes de gestion des utilisateurs
  app.get("/api/users", requireAuth, requireSupervisorOrAdmin, userController.getUsers.bind(userController));
  app.get("/api/users/stats", requireAuth, requireAdmin, userController.getUserStats.bind(userController));
  app.get("/api/users/:id", requireAuth, userController.getUserById.bind(userController));
  app.post("/api/users", requireAuth, canManageUsers, userController.createUser.bind(userController));
  app.put("/api/users/:id", requireAuth, userController.updateUser.bind(userController));
  app.delete("/api/users/:id", requireAuth, canManageUsers, userController.deleteUser.bind(userController));

  // Routes pour les clients (avec contrôle d'accès basé sur le rôle)
  app.get("/api/clients", requireAuth, canAccessClient, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const clients = await storage.getClients(limit, offset);
      res.json(clients);
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des clients" });
    }
  });

  app.get("/api/clients/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Paramètre de recherche requis" });
      }
      const clients = await storage.searchClients(query);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la recherche" });
    }
  });

  app.get("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération du client" });
    }
  });

  app.post("/api/clients", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const clientData = insertClientSchema.parse({
        ...req.body,
        createdBy: req.session.user.id
      });
      
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error('Erreur lors de la création du client:', error);
      res.status(500).json({ message: "Erreur lors de la création du client" });
    }
  });

  app.put("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour du client" });
    }
  });

  app.patch("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      
      const client = await storage.updateClient(id, clientData);
      res.json(client);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour du client" });
    }
  });

  app.delete("/api/clients/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.json({ message: "Client supprimé avec succès" });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la suppression du client" });
    }
  });

  // Route d'import de portefeuille client
  app.post("/api/clients/import", requireAuth, importUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier téléversé" });
      }

      if (!req.session.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let clientsData: any[] = [];

      if (ext === '.csv') {
        // Traitement des fichiers CSV
        const results: any[] = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
        });
        clientsData = results;
      } else if (ext === '.xlsx' || ext === '.xls') {
        // Traitement des fichiers Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        clientsData = XLSX.utils.sheet_to_json(worksheet);
      }

      // Normaliser les noms de colonnes et créer les clients
      const importedClients = [];
      const errors = [];

      for (let i = 0; i < clientsData.length; i++) {
        const row = clientsData[i];
        try {
          // Mapper les colonnes courantes vers le schéma de base
          const clientData = {
            nom: row.nom || row.Nom || row.NOM || row.lastname || row.last_name || '',
            prenom: row.prenom || row.Prenom || row.PRENOM || row.firstname || row.first_name || '',
            email: row.email || row.Email || row.EMAIL || row.mail || '',
            telephone: row.telephone || row.Telephone || row.TELEPHONE || row.phone || row.tel || '',
            dateNaissance: row.date_naissance || row.dateNaissance || row.birth_date || row.naissance || null,
            numeroSecu: row.numero_secu || row.numeroSecu || row.secu || row.social_security || '',
            adresse: row.adresse || row.Adresse || row.ADRESSE || row.address || '',
            situationFamiliale: row.situation_familiale || row.situationFamiliale || row.marital_status || 'celibataire',
            nombreAyantsDroit: parseInt(row.nombre_ayants_droit || row.ayants_droit || row.dependents || '0') || 0,
            mutuelleActuelle: row.mutuelle_actuelle || row.mutuelleActuelle || row.current_insurance || '',
            niveauCouverture: row.niveau_couverture || row.niveauCouverture || row.coverage_level || 'base',
            statut: row.statut || row.Statut || row.STATUS || row.status || 'prospect',
            notes: row.notes || row.Notes || row.NOTES || row.comments || '',
            createdBy: req.session.user.id
          };

          // Valider et créer le client
          const validatedClient = insertClientSchema.parse(clientData);
          const client = await storage.createClient(validatedClient);
          importedClients.push(client);
        } catch (error) {
          errors.push({
            ligne: i + 1,
            erreur: error instanceof ZodError ? error.errors : error.message || 'Erreur inconnue'
          });
        }
      }

      // Nettoyer le fichier temporaire
      fs.unlinkSync(filePath);

      res.json({
        message: `Import terminé: ${importedClients.length} clients importés`,
        importedCount: importedClients.length,
        errorCount: errors.length,
        clients: importedClients,
        errors: errors
      });

    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        message: "Erreur lors de l'import du fichier",
        error: error.message
      });
    }
  });

  // Routes pour les devis
  app.get("/api/devis", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const devis = await storage.getDevis(limit, offset);
      res.json(devis);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des devis" });
    }
  });

  app.get("/api/clients/:clientId/devis", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const devis = await storage.getDevisByClient(clientId);
      res.json(devis);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des devis" });
    }
  });

  app.post("/api/devis", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const devisData = insertDevisSchema.parse({
        ...req.body,
        createdBy: req.session.user.id
      });
      
      const devis = await storage.createDevis(devisData);
      res.status(201).json(devis);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création du devis" });
    }
  });

  app.post("/api/devis/:id/generate-pdf", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const devis = await storage.getDevisById(id);
      
      if (!devis) {
        return res.status(404).json({ message: "Devis non trouvé" });
      }
      
      const client = await storage.getClient(devis.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client non trouvé" });
      }
      
      const pdfPath = await pdfService.generateDevisPDF(devis, client);
      await storage.updateDevis(id, { pdfPath });
      
      res.json({ message: "PDF généré avec succès", pdfPath });
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la génération du PDF" });
    }
  });

  // Routes pour les documents
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const documents = await storage.getDocuments(limit, offset);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des documents" });
    }
  });

  app.get("/api/clients/:clientId/documents", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const documents = await storage.getDocumentsByClient(clientId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des documents" });
    }
  });

  app.post("/api/documents", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier téléversé" });
      }
      
      if (!req.session.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const document = await storage.createDocument({
        nom: req.file.originalname,
        type: req.body.type || 'autre',
        taille: req.file.size,
        mimeType: req.file.mimetype,
        cheminFichier: req.file.path,
        clientId: req.body.clientId ? parseInt(req.body.clientId) : null,
        devisId: req.body.devisId ? parseInt(req.body.devisId) : null,
        uploadedBy: req.session.user.id
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du téléversement du document" });
    }
  });

  app.get("/api/documents/:id/download", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document non trouvé" });
      }
      
      res.download(document.cheminFichier, document.nom);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors du téléchargement" });
    }
  });

  // Routes pour les rappels
  app.get("/api/rappels", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const rappels = await storage.getRappels(limit, offset);
      res.json(rappels);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des rappels" });
    }
  });

  app.get("/api/rappels/today", requireAuth, async (req, res) => {
    try {
      const rappels = await storage.getRappelsToday();
      res.json(rappels);
    } catch (error) {
      console.error('Erreur lors de la récupération des rappels:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des rappels" });
    }
  });

  app.post("/api/rappels", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const rappelData = insertRappelSchema.parse({
        ...req.body,
        createdBy: req.session.user.id
      });
      
      const rappel = await storage.createRappel(rappelData);
      res.status(201).json(rappel);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      console.error('Erreur lors de la création du rappel:', error);
      res.status(500).json({ message: "Erreur lors de la création du rappel" });
    }
  });

  app.put("/api/rappels/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rappelData = insertRappelSchema.partial().parse(req.body);
      
      const rappel = await storage.updateRappel(id, rappelData);
      res.json(rappel);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la mise à jour du rappel" });
    }
  });

  // Routes pour les appels
  app.get("/api/appels", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const appels = await storage.getAppels(limit, offset);
      res.json(appels);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des appels" });
    }
  });

  app.get("/api/clients/:clientId/appels", requireAuth, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const appels = await storage.getAppelsByClient(clientId);
      res.json(appels);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des appels" });
    }
  });

  app.post("/api/appels", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Non autorisé" });
      }
      
      const appelData = insertAppelSchema.parse({
        ...req.body,
        createdBy: req.session.user.id
      });
      
      const appel = await storage.createAppel(appelData);
      res.status(201).json(appel);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Données invalides", errors: error.errors });
      }
      res.status(500).json({ message: "Erreur lors de la création de l'appel" });
    }
  });

  // Route pour les statistiques
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
