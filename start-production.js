#!/usr/bin/env node

import express from 'express';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './server/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir les fichiers statiques des assets
app.use('/attached_assets', express.static('attached_assets'));

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`${new Date().toLocaleTimeString()} [express] ${logLine}`);
    }
  });

  next();
});

// Fonction pour servir les fichiers statiques
function serveStaticFiles(app) {
  const distPath = path.resolve(__dirname, 'dist');
  
  console.log(`Looking for build directory at: ${distPath}`);
  
  if (!existsSync(distPath)) {
    console.error(`Build directory not found: ${distPath}`);
    console.error('Make sure to run "npm run build" first');
    process.exit(1);
  }

  // Servir les fichiers statiques du build
  app.use(express.static(distPath));
  
  // Servir les uploads
  app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

  // Fallback vers index.html pour le client-side routing
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built properly');
    }
  });
}

async function startServer() {
  try {
    // Enregistrer les routes API
    const server = await registerRoutes(app);

    // Gestion des erreurs
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Servir les fichiers statiques en production
    serveStaticFiles(app);

    // Démarrer le serveur
    const port = parseInt(process.env.PORT || "5000");
    server.listen(port, "0.0.0.0", () => {
      console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${port}`);
      console.log(`${new Date().toLocaleTimeString()} [express] environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();