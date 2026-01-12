# Quick Setup Guide

## Database Setup (First Time)

Run this command from the project root:

```bash
./scripts/setup-db.sh
```

This script will:
1. ✅ Check if Docker is running
2. 🐳 Start PostgreSQL and Redis containers
3. 🔧 Generate Prisma Client
4. 📊 Run database migrations
5. 🌱 Seed the database with initial data

## Login Credentials

**Email:** `admin@assetms.com`  
**Password:** `admin123`

## Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Docs:** http://localhost:4000/api/docs

## Manual Setup (Alternative)

If you prefer to run commands manually:

```bash
# 1. Start Docker Desktop

# 2. Start database services
docker-compose up -d postgres redis

# 3. Setup database
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Troubleshooting

**Backend won't start?**
- Ensure Docker Desktop is running
- Check database is ready: `docker ps | grep postgres`
- View logs: `docker-compose logs postgres`

**Login not working?**
- Verify database was seeded
- Check backend logs for errors
- Try resetting: `cd backend && npx prisma migrate reset`
