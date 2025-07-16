#!/bin/bash

# Script pour tester la connexion actuelle
echo "=== TEST DE CONNEXION ACTUELLE ==="

# Lire la DATABASE_URL du fichier .env
if [ -f ".env" ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)
    echo "DATABASE_URL trouvée dans .env: ${DATABASE_URL:0:50}..."
else
    echo "❌ Fichier .env introuvable"
    exit 1
fi

# Vérifier si psql est disponible
if ! command -v psql &> /dev/null; then
    echo "❌ psql n'est pas installé"
    exit 1
fi

# Tester la connexion
echo "🔍 Test de connexion..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connexion réussie!"
    
    # Tester les tables
    echo "🔍 Vérification des tables..."
    tables=$(psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | wc -l)
    echo "📊 Tables trouvées: $tables"
    
    # Tester les utilisateurs
    echo "🔍 Vérification des utilisateurs..."
    if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
        user_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
        echo "👥 Utilisateurs dans la base: $user_count"
    else
        echo "❌ Table users inexistante"
    fi
    
else
    echo "❌ Connexion échouée"
    echo "📋 Détails de l'erreur:"
    psql "$DATABASE_URL" -c "SELECT 1;" 2>&1 | head -3
fi

echo "=== FIN DU TEST ==="