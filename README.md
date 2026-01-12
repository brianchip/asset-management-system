# Asset Management System

A comprehensive RFID-based asset management system designed for multi-office environments.

## Features

- **RFID Tracking**: Real-time asset tracking using RFID antennas and tags
- **Office Geofencing**: Track assets across multiple office locations with geofence boundaries
- **Asset-Status-Driven Workflows**: Automated workflows based on asset status changes
- **Customizable Reports**: Build and schedule custom reports and dashboards
- **Mobile Management**: PWA support for mobile asset scanning and management
- **Digital Audits**: Digital inspections, checklists, and audit trails
- **Third-Party Integrations**: RESTful API and webhook support
- **Maintenance Management**: Schedule and track asset maintenance
- **Multi-Modal Tracking**: Support for RFID, barcodes, QR codes, and static tracking

## Technology Stack

### Backend
- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL 14+ with TimescaleDB extension
- **Cache**: Redis
- **ORM**: Prisma
- **Real-time**: Socket.io

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Charts**: Recharts

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **RFID Integration**: LLRP-compatible readers

## Project Structure

```
asset-management-system/
├── backend/              # NestJS backend API
├── frontend/             # Next.js frontend application
├── docker-compose.yml    # Docker services configuration
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- Docker & Docker Compose
- npm or pnpm

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to project directory
cd asset-management-system

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### 2. Start Services with Docker

```bash
# Start all services (PostgreSQL, Redis, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Development Mode (Local)

```bash
# Install dependencies
npm install

# Start backend (Terminal 1)
cd backend
npm run start:dev

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

### 4. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api/docs

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT token generation
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend

## Database Setup

```bash
# Run migrations
cd backend
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

## Development

### Backend Commands

```bash
cd backend

# Development mode with hot reload
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name
```

### Frontend Commands

```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test
```

## RFID Integration

This system supports LLRP-compatible RFID readers. Configuration steps:

1. Configure RFID reader network settings
2. Add reader to system via Admin panel
3. Configure read zones and antennas
4. Associate RFID tags with assets

Supported readers:
- Impinj R700 Series
- Zebra FX Series
- Any LLRP-compatible reader

## Deployment

### Docker Production

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

See deployment guides in `/docs` folder for:
- AWS deployment
- Google Cloud deployment
- Self-hosted deployment

## Documentation

- [API Documentation](http://localhost:4000/api/docs) (when running)
- [Architecture Overview](./docs/architecture.md)
- [Database Schema](./docs/database-schema.md)
- [RFID Integration Guide](./docs/rfid-integration.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For support, please contact your system administrator.
