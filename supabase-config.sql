-- Configuration Supabase pour CRM
-- Instructions d'installation et de configuration

-- =============================================
-- ÉTAPE 1: CONFIGURATION INITIALE SUPABASE
-- =============================================

-- 1. Créer un nouveau projet Supabase
-- 2. Aller dans l'onglet "SQL Editor"
-- 3. Exécuter ce script complet

-- =============================================
-- ÉTAPE 2: CONFIGURATION RLS (Row Level Security)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rappels ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can view agents" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('admin', 'superviseur')
        )
    );

-- Politiques RLS pour les clients
CREATE POLICY "Users can view clients they created" ON clients
    FOR SELECT USING (created_by = auth.uid()::integer);

CREATE POLICY "Admins can view all clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'admin'
        )
    );

CREATE POLICY "Supervisors can view all clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('admin', 'superviseur')
        )
    );

-- Politiques similaires pour les autres tables
CREATE POLICY "Users can manage their data" ON clients
    FOR ALL USING (
        created_by = auth.uid()::integer OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('admin', 'superviseur')
        )
    );

-- =============================================
-- ÉTAPE 3: FONCTIONS UTILITAIRES
-- =============================================

-- Fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE id = auth.uid()::integer
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur est superviseur ou admin
CREATE OR REPLACE FUNCTION is_supervisor_or_admin()
RETURNS boolean AS $$
BEGIN
    RETURN get_user_role() IN ('admin', 'superviseur');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ÉTAPE 4: VUES POUR SIMPLIFIER LES REQUÊTES
-- =============================================

-- Vue pour les statistiques des utilisateurs
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin,
    COUNT(CASE WHEN role = 'superviseur' THEN 1 END) as superviseur,
    COUNT(CASE WHEN role = 'agent' THEN 1 END) as agent,
    COUNT(CASE WHEN actif = true THEN 1 END) as active,
    COUNT(CASE WHEN actif = false THEN 1 END) as inactive
FROM users;

-- Vue pour les statistiques des clients
CREATE OR REPLACE VIEW client_stats AS
SELECT 
    COUNT(*) as total_clients,
    COUNT(CASE WHEN statut = 'nouveau' THEN 1 END) as nouveaux,
    COUNT(CASE WHEN statut = 'prospect' THEN 1 END) as prospects,
    COUNT(CASE WHEN statut = 'client' THEN 1 END) as clients,
    COUNT(CASE WHEN statut = 'perdu' THEN 1 END) as perdus
FROM clients;

-- Vue pour les statistiques des devis
CREATE OR REPLACE VIEW devis_stats AS
SELECT 
    COUNT(*) as total_devis,
    COUNT(CASE WHEN statut = 'brouillon' THEN 1 END) as brouillons,
    COUNT(CASE WHEN statut = 'envoye' THEN 1 END) as envoyes,
    COUNT(CASE WHEN statut = 'accepte' THEN 1 END) as acceptes,
    COUNT(CASE WHEN statut = 'refuse' THEN 1 END) as refuses,
    ROUND(
        (COUNT(CASE WHEN statut = 'accepte' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(CASE WHEN statut IN ('accepte', 'refuse') THEN 1 END), 0)), 2
    ) as taux_conversion
FROM devis;

-- Vue pour les rappels du jour
CREATE OR REPLACE VIEW rappels_today AS
SELECT 
    r.*,
    c.nom as client_nom,
    c.prenom as client_prenom,
    c.telephone as client_telephone,
    u.nom as created_by_nom,
    u.prenom as created_by_prenom
FROM rappels r
JOIN clients c ON r.client_id = c.id
JOIN users u ON r.created_by = u.id
WHERE DATE(r.date_rappel) = CURRENT_DATE
AND r.statut = 'actif'
ORDER BY r.date_rappel;

-- =============================================
-- ÉTAPE 5: CONFIGURATION DES WEBHOOKS (OPTIONNEL)
-- =============================================

-- Table pour les logs d'activité
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fonction pour logger les activités
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (user_id, action, table_name, record_id, details)
    VALUES (
        auth.uid()::integer,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'old', row_to_json(OLD),
            'new', row_to_json(NEW)
        )
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour les logs
DROP TRIGGER IF EXISTS log_users_activity ON users;
CREATE TRIGGER log_users_activity
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_activity();

DROP TRIGGER IF EXISTS log_clients_activity ON clients;
CREATE TRIGGER log_clients_activity
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION log_activity();

-- =============================================
-- ÉTAPE 6: DONNÉES DE TEST (OPTIONNEL)
-- =============================================

-- Insérer des données de test si nécessaire
DO $$ 
BEGIN
    -- Vérifier si des données de test existent déjà
    IF NOT EXISTS (SELECT 1 FROM clients WHERE email LIKE '%test%') THEN
        -- Insérer un client de test
        INSERT INTO clients (
            nom, prenom, date_naissance, numero_secu, telephone, email, 
            adresse, situation_familiale, statut, created_by
        ) VALUES (
            'Test', 'Client', '1985-06-15', '1234567890123', '0123456789', 
            'test@example.com', '123 Rue de Test, 75000 Paris', 'celibataire', 
            'prospect', 1
        );
    END IF;
END $$;

-- =============================================
-- ÉTAPE 7: CONFIGURATION FINALE
-- =============================================

-- Créer un utilisateur de service pour l'application
-- Note: À adapter selon votre configuration Supabase
CREATE USER IF NOT EXISTS crm_service WITH PASSWORD 'your-secure-password';

-- Accorder les permissions nécessaires
GRANT USAGE ON SCHEMA public TO crm_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_service;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_service;

-- =============================================
-- ÉTAPE 8: VÉRIFICATION ET TESTS
-- =============================================

-- Test des fonctions
SELECT 
    'Configuration Supabase terminée!' as message,
    NOW() as timestamp;

-- Vérifier les tables créées
SELECT 
    table_name,
    row_security_enabled 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'clients', 'devis', 'documents', 'rappels', 'appels');

-- Vérifier les politiques RLS
SELECT 
    tablename,
    policyname,
    permissive
FROM pg_policies 
WHERE schemaname = 'public';

-- Afficher les statistiques
SELECT * FROM user_stats;
SELECT * FROM client_stats;
SELECT * FROM devis_stats;

-- Message final
SELECT 'Migration Supabase terminée avec succès! Vous pouvez maintenant configurer votre application.' as final_message;