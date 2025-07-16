-- Script pour corriger l'alignement du schéma Supabase avec l'application
-- Exécutez ce script après avoir vérifié votre schéma Drizzle

-- =============================================
-- 1. CORRIGER LA TABLE USERS
-- =============================================

-- Ajouter la colonne password si elle n'existe pas
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Mettre à jour les colonnes pour correspondre au schéma Drizzle
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN nom SET NOT NULL;
ALTER TABLE users ALTER COLUMN prenom SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN actif SET NOT NULL;

-- Définir les valeurs par défaut
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'agent';
ALTER TABLE users ALTER COLUMN actif SET DEFAULT true;

-- =============================================
-- 2. CORRIGER LA TABLE RAPPELS
-- =============================================

-- Ajouter la colonne type_rappel si elle n'existe pas
ALTER TABLE rappels ADD COLUMN IF NOT EXISTS type_rappel VARCHAR(50);

-- Mettre à jour les valeurs par défaut
UPDATE rappels SET type_rappel = 'appel' WHERE type_rappel IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les valeurs
ALTER TABLE rappels ALTER COLUMN type_rappel SET NOT NULL;

-- =============================================
-- 3. CORRIGER LA TABLE APPELS
-- =============================================

-- Ajouter la colonne type_appel si elle n'existe pas
ALTER TABLE appels ADD COLUMN IF NOT EXISTS type_appel VARCHAR(50);

-- Mettre à jour les valeurs par défaut
UPDATE appels SET type_appel = 'entrant' WHERE type_appel IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les valeurs
ALTER TABLE appels ALTER COLUMN type_appel SET NOT NULL;

-- =============================================
-- 4. CORRIGER LA TABLE DEVIS
-- =============================================

-- Supprimer temporairement la contrainte si elle existe
ALTER TABLE devis DROP CONSTRAINT IF EXISTS devis_statut_check;

-- Mettre à jour les valeurs de statut invalides
UPDATE devis SET statut = 'brouillon' WHERE statut NOT IN ('brouillon', 'envoye', 'accepte', 'refuse');

-- Recréer la contrainte
ALTER TABLE devis ADD CONSTRAINT devis_statut_check 
CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse'));

-- =============================================
-- 5. AJOUTER LES CONTRAINTES MANQUANTES
-- =============================================

-- Contraintes pour rappels
ALTER TABLE rappels DROP CONSTRAINT IF EXISTS rappels_type_check;
ALTER TABLE rappels ADD CONSTRAINT rappels_type_check 
CHECK (type_rappel IN ('appel', 'rdv', 'email', 'courrier', 'autre'));

ALTER TABLE rappels DROP CONSTRAINT IF EXISTS rappels_statut_check;
ALTER TABLE rappels ADD CONSTRAINT rappels_statut_check 
CHECK (statut IN ('actif', 'traite', 'annule'));

-- Contraintes pour appels
ALTER TABLE appels DROP CONSTRAINT IF EXISTS appels_type_check;
ALTER TABLE appels ADD CONSTRAINT appels_type_check 
CHECK (type_appel IN ('entrant', 'sortant', 'manque'));

ALTER TABLE appels DROP CONSTRAINT IF EXISTS appels_statut_check;
ALTER TABLE appels ADD CONSTRAINT appels_statut_check 
CHECK (statut IN ('termine', 'manque', 'occupe'));

-- =============================================
-- 6. CORRIGER LES INDEX
-- =============================================

-- Index manquant pour type_appel
CREATE INDEX IF NOT EXISTS idx_appels_type ON appels(type_appel);

-- =============================================
-- 7. CRÉER LES UTILISATEURS PAR DÉFAUT
-- =============================================

-- Fonction pour hasher les mots de passe (placeholders temporaires)
DO $$ 
DECLARE
    admin_exists INTEGER;
    super_exists INTEGER;
    agent_exists INTEGER;
BEGIN
    -- Vérifier et créer l'admin
    SELECT COUNT(*) INTO admin_exists FROM users WHERE username = 'admin';
    IF admin_exists = 0 THEN
        INSERT INTO users (username, email, password, nom, prenom, role, actif) 
        VALUES ('admin', 'admin@crm.com', '$2b$12$temp_hash_replace_me', 'Admin', 'System', 'admin', true);
    END IF;
    
    -- Vérifier et créer le superviseur
    SELECT COUNT(*) INTO super_exists FROM users WHERE username = 'super1';
    IF super_exists = 0 THEN
        INSERT INTO users (username, email, password, nom, prenom, role, actif) 
        VALUES ('super1', 'super1@crm.com', '$2b$12$temp_hash_replace_me', 'Superviseur', 'Un', 'superviseur', true);
    END IF;
    
    -- Vérifier et créer l'agent
    SELECT COUNT(*) INTO agent_exists FROM users WHERE username = 'agent1';
    IF agent_exists = 0 THEN
        INSERT INTO users (username, email, password, nom, prenom, role, actif) 
        VALUES ('agent1', 'agent1@crm.com', '$2b$12$temp_hash_replace_me', 'Agent', 'Un', 'agent', true);
    END IF;
    
    RAISE NOTICE 'Utilisateurs par défaut créés/vérifiés';
END $$;

-- =============================================
-- 8. VÉRIFICATION FINALE
-- =============================================

-- Vérifier que toutes les colonnes nécessaires existent
SELECT 
    'users' as table_name,
    COUNT(CASE WHEN column_name = 'password' THEN 1 END) as has_password,
    COUNT(CASE WHEN column_name = 'username' THEN 1 END) as has_username,
    COUNT(CASE WHEN column_name = 'role' THEN 1 END) as has_role
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
UNION ALL
SELECT 
    'rappels' as table_name,
    COUNT(CASE WHEN column_name = 'type_rappel' THEN 1 END) as has_type_rappel,
    COUNT(CASE WHEN column_name = 'statut' THEN 1 END) as has_statut,
    0 as col3
FROM information_schema.columns 
WHERE table_name = 'rappels' AND table_schema = 'public'
UNION ALL
SELECT 
    'appels' as table_name,
    COUNT(CASE WHEN column_name = 'type_appel' THEN 1 END) as has_type_appel,
    COUNT(CASE WHEN column_name = 'statut' THEN 1 END) as has_statut,
    0 as col3
FROM information_schema.columns 
WHERE table_name = 'appels' AND table_schema = 'public';

-- Afficher les utilisateurs créés
SELECT username, email, role, actif FROM users ORDER BY role, username;

-- Message de confirmation
SELECT 'Correction du schéma terminée avec succès!' as message;