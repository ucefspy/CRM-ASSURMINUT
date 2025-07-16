#!/bin/bash

# Script de diagnostic pour problèmes de connexion Supabase
# Usage: ./debug-supabase.sh [supabase-url] [supabase-key]

set -e

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO: $1${NC}"
}

# Vérifier les arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <SUPABASE_URL> <SUPABASE_KEY>"
    echo ""
    echo "Exemple:"
    echo "  $0 https://your-project.supabase.co your-service-key"
    echo ""
    echo "Pour obtenir ces informations:"
    echo "  1. Allez sur https://app.supabase.com"
    echo "  2. Sélectionnez votre projet"
    echo "  3. Allez dans Settings > API"
    echo "  4. Copiez l'URL du projet et la clé de service (service_role key)"
    exit 1
fi

SUPABASE_URL="$1"
SUPABASE_KEY="$2"

log "=== DIAGNOSTIC SUPABASE ==="

# Test 1: Vérifier le format de l'URL
info "Test 1: Vérification du format de l'URL"
if [[ $SUPABASE_URL =~ ^https://[a-z0-9-]+\.supabase\.co$ ]]; then
    log "✓ Format d'URL correct"
    PROJECT_ID=$(echo $SUPABASE_URL | sed 's/https:\/\/\([^.]*\)\.supabase\.co/\1/')
    info "  Project ID: $PROJECT_ID"
else
    error "✗ Format d'URL incorrect. Doit être: https://your-project.supabase.co"
    exit 1
fi

# Test 2: Vérifier la longueur de la clé
info "Test 2: Vérification de la clé de service"
if [ ${#SUPABASE_KEY} -lt 50 ]; then
    warn "✗ La clé semble trop courte (${#SUPABASE_KEY} caractères)"
    warn "  Assurez-vous d'utiliser la 'service_role' key, pas la 'anon' key"
else
    log "✓ Longueur de clé correcte (${#SUPABASE_KEY} caractères)"
fi

# Test 3: Vérifier la connectivité réseau
info "Test 3: Vérification de la connectivité réseau"
if curl -s --connect-timeout 10 "$SUPABASE_URL" > /dev/null; then
    log "✓ Connectivité réseau OK"
else
    error "✗ Impossible de joindre $SUPABASE_URL"
    error "  Vérifiez votre connexion internet"
    exit 1
fi

# Test 4: Tester l'API REST
info "Test 4: Test de l'API REST Supabase"
REST_URL="${SUPABASE_URL}/rest/v1/"
response=$(curl -s -w "%{http_code}" -H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" "$REST_URL" || echo "000")

if [ "$response" = "200" ]; then
    log "✓ API REST accessible"
elif [ "$response" = "401" ]; then
    error "✗ Erreur d'authentification (401)"
    error "  Vérifiez votre clé de service"
    exit 1
elif [ "$response" = "403" ]; then
    error "✗ Accès refusé (403)"
    error "  Vérifiez les permissions de votre clé"
    exit 1
else
    warn "✗ Réponse inattendue: $response"
fi

# Test 5: Construire l'URL de base de données
info "Test 5: Construction de l'URL de base de données"
DB_HOST="db.${PROJECT_ID}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="$SUPABASE_KEY"

CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"
info "  Host: $DB_HOST"
info "  Port: $DB_PORT"
info "  Database: $DB_NAME"
info "  User: $DB_USER"

# Test 6: Vérifier la disponibilité du port
info "Test 6: Test de connectivité au port 5432"
if timeout 10 bash -c "cat < /dev/null > /dev/tcp/$DB_HOST/$DB_PORT"; then
    log "✓ Port 5432 accessible"
else
    error "✗ Port 5432 inaccessible"
    error "  Le projet Supabase est-il actif?"
    exit 1
fi

# Test 7: Vérifier psql
info "Test 7: Vérification de psql"
if command -v psql &> /dev/null; then
    local psql_version=$(psql --version | head -n1)
    log "✓ psql disponible: $psql_version"
else
    error "✗ psql non installé"
    error "  Installez PostgreSQL client:"
    error "    Ubuntu/Debian: sudo apt-get install postgresql-client"
    error "    macOS: brew install postgresql"
    error "    Windows: Téléchargez depuis postgresql.org"
    exit 1
fi

# Test 8: Test de connexion PostgreSQL
info "Test 8: Test de connexion PostgreSQL"
if timeout 30 psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
    log "✓ Connexion PostgreSQL réussie"
else
    error "✗ Connexion PostgreSQL échouée"
    
    # Diagnostics supplémentaires
    warn "Diagnostics supplémentaires:"
    
    # Test sans SSL
    info "  - Test sans SSL..."
    CONNECTION_STRING_NO_SSL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    if timeout 10 psql "$CONNECTION_STRING_NO_SSL" -c "SELECT 1;" > /dev/null 2>&1; then
        warn "    ✓ Connexion sans SSL réussie"
        warn "    Problème de configuration SSL"
    else
        warn "    ✗ Connexion sans SSL échouée aussi"
    fi
    
    # Test avec un timeout plus long
    info "  - Test avec timeout étendu..."
    if timeout 60 psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
        warn "    ✓ Connexion réussie avec timeout étendu"
        warn "    Problème de latence réseau"
    else
        warn "    ✗ Connexion échouée même avec timeout étendu"
    fi
    
    # Afficher les détails de l'erreur
    info "  - Détails de l'erreur:"
    psql "$CONNECTION_STRING" -c "SELECT 1;" 2>&1 | head -5 | while read line; do
        warn "    $line"
    done
    
    exit 1
fi

# Test 9: Vérifier les privilèges
info "Test 9: Vérification des privilèges"
if privileges=$(timeout 10 psql "$CONNECTION_STRING" -t -c "SELECT current_user, session_user;" 2>/dev/null); then
    log "✓ Privilèges vérifiés"
    info "  User: $(echo $privileges | tr -d ' ')"
else
    warn "✗ Impossible de vérifier les privilèges"
fi

# Test 10: Vérifier les tables existantes
info "Test 10: Vérification des tables existantes"
if tables=$(timeout 10 psql "$CONNECTION_STRING" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null); then
    table_count=$(echo "$tables" | wc -l)
    if [ $table_count -gt 1 ]; then
        log "✓ Tables existantes: $table_count"
        echo "$tables" | while read table; do
            [ -n "$table" ] && info "    - $(echo $table | tr -d ' ')"
        done
    else
        warn "✗ Aucune table trouvée"
        warn "  La base de données est vide"
    fi
else
    warn "✗ Impossible de lister les tables"
fi

# Résumé et recommandations
log "=== RÉSUMÉ ==="
echo ""
echo "URL du projet: $SUPABASE_URL"
echo "Clé de service: ${SUPABASE_KEY:0:20}..."
echo "URL de base de données: postgresql://postgres:***@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

log "=== RECOMMANDATIONS ==="
echo ""
echo "✅ Actions recommandées:"
echo "  1. Vérifiez que votre projet Supabase est actif"
echo "  2. Utilisez la 'service_role' key, pas la 'anon' key"
echo "  3. Vérifiez les paramètres de facturation (projet non suspendu)"
echo "  4. Testez depuis l'interface web Supabase d'abord"
echo ""

echo "🔧 Variables d'environnement pour votre application:"
echo "DATABASE_URL=$CONNECTION_STRING"
echo "SUPABASE_URL=$SUPABASE_URL"
echo "SUPABASE_SERVICE_KEY=$SUPABASE_KEY"
echo ""

echo "📝 Prochaines étapes:"
echo "  1. Si tous les tests passent, réexécutez deploy-supabase.sh"
echo "  2. Si des tests échouent, corrigez les problèmes identifiés"
echo "  3. Contactez le support Supabase si nécessaire"
echo ""

log "Diagnostic terminé"