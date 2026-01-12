#!/bin/bash

# Asset Management System - Database Setup Script
# This script sets up the database and seeds initial data

set -e  # Exit on error

echo "🚀 Asset Management System - Database Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "📦 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo ""
    echo "Please start Docker Desktop and run this script again."
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down > /dev/null 2>&1 || true
echo ""

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec ams_postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done
echo ""

# Navigate to backend directory
cd backend

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy
echo ""

# Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed
echo ""

echo "=============================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=============================================="
echo ""
echo "📝 Login Credentials:"
echo "   Email: admin@assetms.com"
echo "   Password: admin123"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:4000"
echo "   API Docs: http://localhost:4000/api/docs"
echo ""
echo "💡 The backend server should now restart automatically and connect to the database."
echo ""
