# Quick Start Guide

## Prerequisites

- Docker Desktop installed and running
- Node.js 20+ installed
- npm or pnpm

## Getting Started

### 1. Start Docker Services

```bash
cd /Users/brianchip/.gemini/antigravity/scratch/asset-management-system
docker-compose up -d
```

This will start:
- PostgreSQL with TimescaleDB (port 5432)
- Redis (port 6379)

### 2. Setup Backend

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Start backend in development mode
npm run start:dev
```

Backend will be available at: http://localhost:4000

API Documentation (Swagger): http://localhost:4000/api/docs

### 3. Setup Frontend

```bash
cd frontend

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000
EOF

# Install dependencies (if not already done)
npm install

# Start frontend in development mode
npm run dev
```

Frontend will be available at: http://localhost:3000

### 4. Login

Use the default admin credentials:

- **Email**: admin@assetms.com
- **Password**: admin123

## Useful Commands

### Backend

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format Prisma schema
npx prisma format
```

### Docker

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Restart a specific service
docker-compose restart backend
```

## Troubleshooting

### Port already in use

If ports 3000, 4000, 5432, or 6379 are already in use:

1. Stop the conflicting service
2. Or modify ports in `docker-compose.yml` and `.env` files

### Database connection issues

1. Ensure Docker services are running: `docker-compose ps`
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Verify DATABASE_URL in `backend/.env.development`

### Prisma Client not found

Run: `npx prisma generate` in the backend directory

## Next Steps

1. Explore the API documentation at http://localhost:4000/api/docs
2. Test authentication endpoints
3. Start building the frontend UI
4. Implement asset management endpoints
5. Add RFID integration

## Project Structure

```
/Users/brianchip/.gemini/antigravity/scratch/asset-management-system/
├── backend/       # NestJS API
├── frontend/      # Next.js App
├── scripts/       # Database scripts
└── docker-compose.yml
```

## Need Help?

- View the main README.md for detailed documentation
- Check walkthrough.md for project overview
- Review implementation_plan.md for architecture details
