-- Script de mise à jour du schéma Supabase
-- Date: 2025-07-16
-- Description: Met à jour les tableaux Supabase avec les dernières améliorations

-- =============================================
-- 1. MISE À JOUR TABLE USERS
-- =============================================

-- Vérifier si la table users existe, sinon la créer
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'agent',
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ajouter contrainte sur le rôle si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'superviseur', 'agent'));
    END IF;
END $$;

-- =============================================
-- 2. MISE À JOUR TABLE CLIENTS
-- =============================================

-- Vérifier si la table clients existe, sinon la créer
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    numero_secu VARCHAR(15) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    adresse TEXT NOT NULL,
    situation_familiale VARCHAR(20) NOT NULL,
    nombre_ayants_droit INTEGER DEFAULT 0,
    mutuelle_actuelle VARCHAR(100),
    niveau_couverture VARCHAR(50),
    statut VARCHAR(20) NOT NULL DEFAULT 'nouveau',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Supprimer la colonne createdby en double si elle existe
ALTER TABLE clients DROP COLUMN IF EXISTS createdby;

-- Ajouter contrainte sur le statut si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clients_statut_check'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_statut_check 
        CHECK (statut IN ('nouveau', 'prospect', 'client', 'perdu'));
    END IF;
END $$;

-- Ajouter contrainte sur la situation familiale si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'clients_situation_familiale_check'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_situation_familiale_check 
        CHECK (situation_familiale IN ('celibataire', 'marie', 'divorce', 'veuf', 'pacse'));
    END IF;
END $$;

-- =============================================
-- 3. MISE À JOUR TABLE DEVIS
-- =============================================

CREATE TABLE IF NOT EXISTS devis (
    id SERIAL PRIMARY KEY,
    numero_devis VARCHAR(50) NOT NULL UNIQUE,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    type_devis VARCHAR(50) NOT NULL,
    montant_mensuel DECIMAL(10,2) NOT NULL,
    garanties JSONB,
    statut VARCHAR(20) NOT NULL DEFAULT 'brouillon',
    date_validite DATE NOT NULL,
    observations TEXT,
    pdf_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Ajouter contrainte sur le statut si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'devis_statut_check'
    ) THEN
        ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
        CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse'));
    END IF;
END $$;

-- =============================================
-- 4. MISE À JOUR TABLE DOCUMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    taille INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    chemin TEXT NOT NULL,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES users(id)
);

-- Ajouter contrainte sur le type si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'documents_type_check'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT documents_type_check 
        CHECK (type IN ('piece_identite', 'attestation_secu', 'contrat', 'autre'));
    END IF;
END $$;

-- =============================================
-- 5. MISE À JOUR TABLE RAPPELS
-- =============================================

CREATE TABLE IF NOT EXISTS rappels (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    date_rappel TIMESTAMP NOT NULL,
    type_rappel VARCHAR(50) NOT NULL,
    statut VARCHAR(20) NOT NULL DEFAULT 'actif',
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Ajouter contrainte sur le type si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'rappels_type_check'
    ) THEN
        ALTER TABLE rappels ADD CONSTRAINT rappels_type_check 
        CHECK (type_rappel IN ('appel', 'rdv', 'email', 'courrier', 'autre'));
    END IF;
END $$;

-- Ajouter contrainte sur le statut si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'rappels_statut_check'
    ) THEN
        ALTER TABLE rappels ADD CONSTRAINT rappels_statut_check 
        CHECK (statut IN ('actif', 'traite', 'annule'));
    END IF;
END $$;

-- =============================================
-- 6. MISE À JOUR TABLE APPELS
-- =============================================

CREATE TABLE IF NOT EXISTS appels (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) NOT NULL,
    type_appel VARCHAR(50) NOT NULL,
    duree INTEGER,
    notes TEXT,
    statut VARCHAR(20) NOT NULL DEFAULT 'termine',
    date_appel TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Ajouter contrainte sur le type si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appels_type_check'
    ) THEN
        ALTER TABLE appels ADD CONSTRAINT appels_type_check 
        CHECK (type_appel IN ('entrant', 'sortant', 'manque'));
    END IF;
END $$;

-- Ajouter contrainte sur le statut si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'appels_statut_check'
    ) THEN
        ALTER TABLE appels ADD CONSTRAINT appels_statut_check 
        CHECK (statut IN ('termine', 'manque', 'occupe'));
    END IF;
END $$;

-- =============================================
-- 7. CRÉATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- =============================================

-- Index sur users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Index sur clients
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_prenom ON clients(prenom);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_statut ON clients(statut);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- Index sur devis
CREATE INDEX IF NOT EXISTS idx_devis_client_id ON devis(client_id);
CREATE INDEX IF NOT EXISTS idx_devis_numero ON devis(numero_devis);
CREATE INDEX IF NOT EXISTS idx_devis_statut ON devis(statut);
CREATE INDEX IF NOT EXISTS idx_devis_created_by ON devis(created_by);

-- Index sur documents
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Index sur rappels
CREATE INDEX IF NOT EXISTS idx_rappels_client_id ON rappels(client_id);
CREATE INDEX IF NOT EXISTS idx_rappels_date ON rappels(date_rappel);
CREATE INDEX IF NOT EXISTS idx_rappels_statut ON rappels(statut);

-- Index sur appels
CREATE INDEX IF NOT EXISTS idx_appels_client_id ON appels(client_id);
CREATE INDEX IF NOT EXISTS idx_appels_date ON appels(date_appel);
CREATE INDEX IF NOT EXISTS idx_appels_type ON appels(type_appel);

-- =============================================
-- 8. CORRECTION DES DONNÉES EXISTANTES
-- =============================================

-- Corriger les valeurs nulles dans les colonnes NOT NULL
UPDATE clients SET 
    date_naissance = '1990-01-01' 
WHERE date_naissance IS NULL;

UPDATE clients SET 
    numero_secu = 'TEMP-' || id 
WHERE numero_secu IS NULL;

UPDATE clients SET 
    situation_familiale = 'celibataire' 
WHERE situation_familiale IS NULL;

UPDATE clients SET 
    statut = 'nouveau' 
WHERE statut IS NULL;

-- =============================================
-- 9. CRÉATION DES COMPTES UTILISATEURS PAR DÉFAUT
-- =============================================

-- Fonction pour hasher les mots de passe (à adapter selon votre système)
-- Note: Dans un environnement de production, utilisez bcrypt avec salt

DO $$ 
DECLARE
    admin_exists INTEGER;
    super_exists INTEGER;
    agent_exists INTEGER;
BEGIN
    -- Vérifier si l'admin existe
    SELECT COUNT(*) INTO admin_exists FROM users WHERE username = 'admin';
    
    IF admin_exists = 0 THEN
        INSERT INTO users (username, email, password, nom, prenom, role, actif) 
        VALUES ('admin', 'admin@crm.com', '$2b$12$hash_placeholder', 'Admin', 'System', 'admin', true);
    END IF;
    
    -- Vérifier si le superviseur existe
    SELECT COUNT(*) INTO super_exists FROM users WHERE username = 'super1';
    
    IF super_exists = 0 THEN
        INSERT INTO users (username, email, password, nom, prenom, role, actif) 
        VALUES ('super1', 'super1@crm.com', '$2b$12$hash_placeholder', 'Superviseur', 'Un', 'superviseur', true);
    END IF;
    
    -- Vérifier si l'agent existe
    SELECT COUNT(*) INTO agent_exists FROM users WHERE username = 'agent1';
    
    IF agent_exists = 0 THEN
        INSERT INTO users (username, email, password, nom, prenom, role, actif) 
        VALUES ('agent1', 'agent1@crm.com', '$2b$12$hash_placeholder', 'Agent', 'Un', 'agent', true);
    END IF;
END $$;

-- =============================================
-- 10. MISE À JOUR DES TRIGGERS POUR UPDATED_AT
-- =============================================

-- Créer la fonction de mise à jour automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer les triggers pour les tables avec updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devis_updated_at ON devis;
CREATE TRIGGER update_devis_updated_at 
    BEFORE UPDATE ON devis 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rappels_updated_at ON rappels;
CREATE TRIGGER update_rappels_updated_at 
    BEFORE UPDATE ON rappels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. VÉRIFICATION FINALE
-- =============================================

-- Afficher un résumé des tables créées/mises à jour
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'superviseur' THEN 1 END) as superviseur_count,
    COUNT(CASE WHEN role = 'agent' THEN 1 END) as agent_count
FROM users
UNION ALL
SELECT 
    'clients' as table_name, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN statut = 'nouveau' THEN 1 END) as nouveau_count,
    COUNT(CASE WHEN statut = 'prospect' THEN 1 END) as prospect_count,
    COUNT(CASE WHEN statut = 'client' THEN 1 END) as client_count
FROM clients
UNION ALL
SELECT 
    'devis' as table_name, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN statut = 'brouillon' THEN 1 END) as brouillon_count,
    COUNT(CASE WHEN statut = 'envoye' THEN 1 END) as envoye_count,
    COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as accepte_count
FROM devis
UNION ALL
SELECT 
    'documents' as table_name, 
    COUNT(*) as record_count,
    0 as col2,
    0 as col3,
    0 as col4
FROM documents
UNION ALL
SELECT 
    'rappels' as table_name, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actif_count,
    COUNT(CASE WHEN statut = 'traite' THEN 1 END) as traite_count,
    COUNT(CASE WHEN statut = 'annule' THEN 1 END) as annule_count
FROM rappels
UNION ALL
SELECT 
    'appels' as table_name, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN type_appel = 'entrant' THEN 1 END) as entrant_count,
    COUNT(CASE WHEN type_appel = 'sortant' THEN 1 END) as sortant_count,
    COUNT(CASE WHEN type_appel = 'manque' THEN 1 END) as manque_count
FROM appels;

-- Message de confirmation
SELECT 'Migration terminée avec succès!' as message;