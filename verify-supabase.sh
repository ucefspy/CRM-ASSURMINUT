#!/bin/bash

# Script de vérification pour Supabase CRM
# Usage: ./verify-supabase.sh [database-url]

set -e

# Configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓ $1${NC}"
}

# Vérifier si l'URL est fournie
if [ $# -lt 1 ]; then
    echo "Usage: $0 <DATABASE_URL>"
    echo ""
    echo "Exemple:"
    echo "  $0 'postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require'"
    exit 1
fi

DATABASE_URL="$1"

# Fonction pour exécuter une requête SQL
execute_query() {
    local query="$1"
    local description="$2"
    
    if result=$(psql "$DATABASE_URL" -t -c "$query" 2>/dev/null); then
        echo "$result"
        return 0
    else
        error "Impossible d'exécuter: $description"
        return 1
    fi
}

# Fonction pour tester la connexion
test_connection() {
    log "Test de connexion à la base de données..."
    
    if execute_query "SELECT 1;" "test de connexion" > /dev/null; then
        success "Connexion réussie"
        return 0
    else
        error "Connexion échouée"
        return 1
    fi
}

# Fonction pour vérifier les tables
check_tables() {
    log "Vérification des tables..."
    
    local expected_tables=("users" "clients" "devis" "documents" "rappels" "appels")
    local missing_tables=()
    
    for table in "${expected_tables[@]}"; do
        if execute_query "SELECT 1 FROM information_schema.tables WHERE table_name = '$table';" "vérification table $table" > /dev/null; then
            success "Table $table existe"
        else
            missing_tables+=("$table")
        fi
    done
    
    if [ ${#missing_tables[@]} -eq 0 ]; then
        success "Toutes les tables sont présentes"
        return 0
    else
        error "Tables manquantes: ${missing_tables[*]}"
        return 1
    fi
}

# Fonction pour vérifier les données
check_data() {
    log "Vérification des données..."
    
    # Vérifier les utilisateurs
    local user_count=$(execute_query "SELECT COUNT(*) FROM users;" "comptage utilisateurs" | tr -d ' ')
    if [ "$user_count" -gt 0 ]; then
        success "Utilisateurs: $user_count"
        
        # Détail des rôles
        local admin_count=$(execute_query "SELECT COUNT(*) FROM users WHERE role = 'admin';" "comptage admins" | tr -d ' ')
        local super_count=$(execute_query "SELECT COUNT(*) FROM users WHERE role = 'superviseur';" "comptage superviseurs" | tr -d ' ')
        local agent_count=$(execute_query "SELECT COUNT(*) FROM users WHERE role = 'agent';" "comptage agents" | tr -d ' ')
        
        echo "  - Admins: $admin_count"
        echo "  - Superviseurs: $super_count"
        echo "  - Agents: $agent_count"
    else
        warn "Aucun utilisateur trouvé"
    fi
    
    # Vérifier les clients
    local client_count=$(execute_query "SELECT COUNT(*) FROM clients;" "comptage clients" | tr -d ' ')
    success "Clients: $client_count"
    
    # Vérifier les devis
    local devis_count=$(execute_query "SELECT COUNT(*) FROM devis;" "comptage devis" | tr -d ' ')
    success "Devis: $devis_count"
    
    # Vérifier les documents
    local doc_count=$(execute_query "SELECT COUNT(*) FROM documents;" "comptage documents" | tr -d ' ')
    success "Documents: $doc_count"
    
    # Vérifier les rappels
    local rappel_count=$(execute_query "SELECT COUNT(*) FROM rappels;" "comptage rappels" | tr -d ' ')
    success "Rappels: $rappel_count"
    
    # Vérifier les appels
    local appel_count=$(execute_query "SELECT COUNT(*) FROM appels;" "comptage appels" | tr -d ' ')
    success "Appels: $appel_count"
}

# Fonction pour vérifier les contraintes
check_constraints() {
    log "Vérification des contraintes..."
    
    local constraint_count=$(execute_query "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public';" "comptage contraintes" | tr -d ' ')
    success "Contraintes: $constraint_count"
    
    # Vérifier les clés étrangères
    local fk_count=$(execute_query "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema = 'public';" "comptage clés étrangères" | tr -d ' ')
    success "Clés étrangères: $fk_count"
    
    # Vérifier les contraintes CHECK
    local check_count=$(execute_query "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'CHECK' AND constraint_schema = 'public';" "comptage contraintes CHECK" | tr -d ' ')
    success "Contraintes CHECK: $check_count"
}

# Fonction pour vérifier les index
check_indexes() {
    log "Vérification des index..."
    
    local index_count=$(execute_query "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" "comptage index" | tr -d ' ')
    success "Index: $index_count"
    
    # Vérifier les index spécifiques
    local expected_indexes=("idx_users_email" "idx_clients_nom" "idx_devis_client_id")
    
    for index in "${expected_indexes[@]}"; do
        if execute_query "SELECT 1 FROM pg_indexes WHERE indexname = '$index';" "vérification index $index" > /dev/null; then
            success "Index $index existe"
        else
            warn "Index $index manquant"
        fi
    done
}

# Fonction pour vérifier les triggers
check_triggers() {
    log "Vérification des triggers..."
    
    local trigger_count=$(execute_query "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';" "comptage triggers" | tr -d ' ')
    success "Triggers: $trigger_count"
}

# Fonction pour vérifier les politiques RLS
check_rls() {
    log "Vérification des politiques RLS..."
    
    local rls_count=$(execute_query "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" "comptage politiques RLS" | tr -d ' ')
    if [ "$rls_count" -gt 0 ]; then
        success "Politiques RLS: $rls_count"
    else
        warn "Aucune politique RLS trouvée"
    fi
}

# Fonction pour tester l'authentification
test_auth() {
    log "Test d'authentification..."
    
    # Vérifier si l'admin existe
    if execute_query "SELECT 1 FROM users WHERE username = 'admin' AND role = 'admin';" "vérification admin" > /dev/null; then
        success "Compte admin trouvé"
    else
        error "Compte admin manquant"
    fi
    
    # Vérifier si le superviseur existe
    if execute_query "SELECT 1 FROM users WHERE username = 'super1' AND role = 'superviseur';" "vérification superviseur" > /dev/null; then
        success "Compte superviseur trouvé"
    else
        warn "Compte superviseur manquant"
    fi
    
    # Vérifier si l'agent existe
    if execute_query "SELECT 1 FROM users WHERE username = 'agent1' AND role = 'agent';" "vérification agent" > /dev/null; then
        success "Compte agent trouvé"
    else
        warn "Compte agent manquant"
    fi
}

# Fonction pour afficher le résumé
show_summary() {
    log "=== RÉSUMÉ DE LA VÉRIFICATION ==="
    
    echo ""
    echo "Base de données: $(echo $DATABASE_URL | sed 's/:[^:]*@/@***@/')"
    echo "Timestamp: $(date)"
    echo ""
    
    # Statistiques générales
    echo "📊 Statistiques:"
    local total_users=$(execute_query "SELECT COUNT(*) FROM users;" "total utilisateurs" | tr -d ' ')
    local total_clients=$(execute_query "SELECT COUNT(*) FROM clients;" "total clients" | tr -d ' ')
    local total_devis=$(execute_query "SELECT COUNT(*) FROM devis;" "total devis" | tr -d ' ')
    
    echo "  - Utilisateurs: $total_users"
    echo "  - Clients: $total_clients"
    echo "  - Devis: $total_devis"
    echo ""
    
    # Informations système
    echo "🔧 Informations système:"
    local pg_version=$(execute_query "SELECT version();" "version PostgreSQL")
    echo "  - PostgreSQL: $(echo $pg_version | cut -d' ' -f2)"
    echo ""
    
    # Prochaines étapes
    echo "✅ Prochaines étapes:"
    echo "  1. Testez la connexion depuis votre application"
    echo "  2. Vérifiez les logs de l'application"
    echo "  3. Testez l'authentification avec les comptes par défaut"
    echo ""
    
    success "Vérification terminée!"
}

# Fonction principale
main() {
    echo "=== VÉRIFICATION SUPABASE CRM ==="
    echo ""
    
    # Exécuter toutes les vérifications
    if ! test_connection; then
        exit 1
    fi
    
    check_tables
    check_data
    check_constraints
    check_indexes
    check_triggers
    check_rls
    test_auth
    
    echo ""
    show_summary
}

# Vérifier si psql est disponible
if ! command -v psql &> /dev/null; then
    error "psql n'est pas installé. Installez PostgreSQL client."
    exit 1
fi

# Lancer le script principal
main