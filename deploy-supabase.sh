#!/bin/bash

# Script de déploiement automatique pour Supabase
# Usage: ./deploy-supabase.sh [supabase-url] [supabase-key]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/update-supabase-schema.sql"
CONFIG_FILE="$SCRIPT_DIR/supabase-config.sql"

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Vérifier si les arguments sont fournis
if [ $# -lt 2 ]; then
    echo "Usage: $0 <SUPABASE_URL> <SUPABASE_SERVICE_KEY>"
    echo ""
    echo "Exemple:"
    echo "  $0 https://your-project.supabase.co your-service-key"
    echo ""
    echo "Pour obtenir ces informations:"
    echo "  1. Allez sur https://app.supabase.com"
    echo "  2. Sélectionnez votre projet"
    echo "  3. Allez dans Settings > API"
    echo "  4. Copiez l'URL et la clé de service"
    exit 1
fi

SUPABASE_URL="$1"
SUPABASE_KEY="$2"

# Vérifier si les fichiers SQL existent
if [ ! -f "$SCHEMA_FILE" ]; then
    error "Le fichier $SCHEMA_FILE n'existe pas"
fi

if [ ! -f "$CONFIG_FILE" ]; then
    error "Le fichier $CONFIG_FILE n'existe pas"
fi

# Vérifier si psql est installé
if ! command -v psql &> /dev/null; then
    error "psql n'est pas installé. Installez PostgreSQL client."
fi

# Extraire les détails de connexion de l'URL Supabase
if [[ $SUPABASE_URL =~ https://([^.]+)\.supabase\.co ]]; then
    PROJECT_ID="${BASH_MATCH[1]}"
    DB_HOST="db.${PROJECT_ID}.supabase.co"
    DB_NAME="postgres"
    DB_USER="postgres"
    DB_PASSWORD="$SUPABASE_KEY"
    DB_PORT="5432"
else
    error "Format d'URL Supabase invalide: $SUPABASE_URL"
fi

# Construire la chaîne de connexion
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

log "Démarrage du déploiement Supabase..."
log "Projet: $PROJECT_ID"
log "Host: $DB_HOST"

# Fonction pour exécuter un script SQL
execute_sql() {
    local file="$1"
    local description="$2"
    
    log "Exécution de $description..."
    
    if psql "$CONNECTION_STRING" -f "$file" -v ON_ERROR_STOP=1; then
        log "✓ $description terminé avec succès"
    else
        error "Échec de l'exécution de $description"
    fi
}

# Fonction pour tester la connexion
test_connection() {
    log "Test de la connexion à Supabase..."
    
    if psql "$CONNECTION_STRING" -c "SELECT version();" > /dev/null 2>&1; then
        log "✓ Connexion à Supabase réussie"
    else
        error "Impossible de se connecter à Supabase. Vérifiez vos paramètres."
    fi
}

# Fonction pour créer une sauvegarde
create_backup() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    log "Création d'une sauvegarde..."
    
    if pg_dump "$CONNECTION_STRING" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --file="$backup_file" 2>/dev/null; then
        log "✓ Sauvegarde créée: $backup_file"
    else
        warn "Impossible de créer la sauvegarde (la base peut être vide)"
    fi
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier la version de PostgreSQL
    local pg_version=$(psql --version | head -n1 | sed 's/.*\s\([0-9]\+\.[0-9]\+\).*/\1/')
    log "Version PostgreSQL: $pg_version"
    
    # Vérifier les permissions
    if psql "$CONNECTION_STRING" -c "SELECT current_user;" > /dev/null 2>&1; then
        log "✓ Permissions vérifiées"
    else
        error "Permissions insuffisantes"
    fi
}

# Fonction pour valider les données après migration
validate_data() {
    log "Validation des données après migration..."
    
    # Test des tables principales
    local tables=("users" "clients" "devis" "documents" "rappels" "appels")
    
    for table in "${tables[@]}"; do
        local count=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
        if [[ "$count" =~ ^[0-9]+$ ]]; then
            log "✓ Table $table: $count enregistrements"
        else
            warn "Problème avec la table $table"
        fi
    done
    
    # Test des contraintes
    local constraints=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public';" 2>/dev/null | tr -d ' ')
    log "✓ Contraintes: $constraints"
    
    # Test des index
    local indexes=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | tr -d ' ')
    log "✓ Index: $indexes"
}

# Fonction pour générer les hash des mots de passe
generate_password_hashes() {
    log "Génération des hash des mots de passe..."
    
    # Générer les hash avec Node.js si disponible
    if command -v node &> /dev/null; then
        cat > temp_hash.js << 'EOF'
const bcrypt = require('bcrypt');

const passwords = {
    'admin123': 'admin',
    'super123': 'superviseur',
    'agent123': 'agent'
};

Object.entries(passwords).forEach(([pass, role]) => {
    const hash = bcrypt.hashSync(pass, 12);
    console.log(`-- ${role}: ${pass}`);
    console.log(`UPDATE users SET password = '${hash}' WHERE username = '${role === 'admin' ? 'admin' : role === 'superviseur' ? 'super1' : 'agent1'}';`);
});
EOF
        
        if node temp_hash.js > password_updates.sql 2>/dev/null; then
            log "✓ Hash des mots de passe générés"
            rm temp_hash.js
        else
            warn "Impossible de générer les hash automatiquement"
            rm temp_hash.js
        fi
    else
        warn "Node.js non disponible, les mots de passe doivent être mis à jour manuellement"
    fi
}

# Fonction principale
main() {
    log "=== DÉPLOIEMENT SUPABASE CRM ==="
    log "Début du processus de déploiement..."
    
    # Étapes du déploiement
    test_connection
    check_prerequisites
    create_backup
    
    # Exécuter les scripts SQL
    execute_sql "$SCHEMA_FILE" "mise à jour du schéma"
    execute_sql "$CONFIG_FILE" "configuration Supabase"
    
    # Générer et appliquer les hash des mots de passe
    generate_password_hashes
    if [ -f "password_updates.sql" ]; then
        execute_sql "password_updates.sql" "mise à jour des mots de passe"
        rm password_updates.sql
    fi
    
    # Validation finale
    validate_data
    
    log "=== DÉPLOIEMENT TERMINÉ ==="
    log "Votre base de données Supabase est maintenant configurée!"
    log ""
    log "Comptes par défaut:"
    log "  - admin@crm.com / admin123 (Administrateur)"
    log "  - super1@crm.com / super123 (Superviseur)"
    log "  - agent1@crm.com / agent123 (Agent)"
    log ""
    log "Prochaines étapes:"
    log "  1. Testez la connexion depuis votre application"
    log "  2. Configurez les variables d'environnement"
    log "  3. Vérifiez les politiques RLS dans Supabase Dashboard"
    log ""
    log "Pour obtenir votre DATABASE_URL:"
    log "  postgresql://postgres:$SUPABASE_KEY@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"
}

# Gestion des signaux
trap 'error "Script interrompu"' INT TERM

# Lancer le script principal
main

# Nettoyage
log "Nettoyage des fichiers temporaires..."
rm -f temp_hash.js password_updates.sql backup_*.sql 2>/dev/null || true

log "Déploiement terminé avec succès!"