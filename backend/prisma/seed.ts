import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create default roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
            description: 'System Administrator',
            permissions: {
                all: true,
            },
        },
    });

    const managerRole = await prisma.role.upsert({
        where: { name: 'manager' },
        update: {},
        create: {
            name: 'manager',
            description: 'Asset Manager',
            permissions: {
                assets: ['create', 'read', 'update', 'delete'],
                maintenance: ['create', 'read', 'update'],
                reports: ['create', 'read'],
            },
        },
    });

    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            description: 'Standard User',
            permissions: {
                assets: ['read'],
                reports: ['read'],
            },
        },
    });

    const specialistRole = await prisma.role.upsert({
        where: { name: 'specialist' },
        update: {},
        create: {
            name: 'specialist',
            description: 'Fixed Asset Specialist',
            permissions: {
                assets: ['create', 'read', 'update', 'delete', 'approve'],
                maintenance: ['create', 'read', 'update', 'delete'],
                reports: ['create', 'read'],
            },
        },
    });

    console.log('✅ Roles created');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@assetms.com' },
        update: {},
        create: {
            email: 'admin@assetms.com',
            passwordHash: hashedPassword,
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+1234567890',
            isActive: true,
        },
    });

    // Assign admin role
    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });

    console.log('✅ Admin user created: admin@assetms.com / admin123');

    // Create sample offices
    const office1 = await prisma.office.upsert({
        where: { code: 'HQ001' },
        update: {},
        create: {
            name: 'Headquarters',
            code: 'HQ001',
            address: '123 Main Street, New York, NY 10001',
            contactInfo: {
                phone: '+1-555-0100',
                email: 'hq@company.com',
            },
            isActive: true,
        },
    });

    const office2 = await prisma.office.upsert({
        where: { code: 'BR001' },
        update: {},
        create: {
            name: 'Branch Office - San Francisco',
            code: 'BR001',
            address: '456 Tech Avenue, San Francisco, CA 94102',
            contactInfo: {
                phone: '+1-555-0101',
                email: 'sf@company.com',
            },
            isActive: true,
        },
    });

    console.log('✅ Offices created');

    // Create geofences for offices
    await prisma.geofence.create({
        data: {
            officeId: office1.id,
            name: 'HQ Main Building',
            radiusMeters: 100,
            config: {
                alertOnExit: true,
                alertOnEntry: false,
            },
        },
    });

    await prisma.geofence.create({
        data: {
            officeId: office2.id,
            name: 'SF Branch Perimeter',
            radiusMeters: 50,
            config: {
                alertOnExit: true,
                alertOnEntry: false,
            },
        },
    });

    console.log('✅ Geofences created');

    // Create asset types
    const laptopType = await prisma.assetType.create({
        data: {
            name: 'Laptop',
            category: 'IT Equipment',
            customFieldsSchema: {
                fields: [
                    { name: 'processor', type: 'string', required: true },
                    { name: 'ram', type: 'string', required: true },
                    { name: 'storage', type: 'string', required: true },
                    { name: 'screenSize', type: 'string', required: false },
                ],
            },
        },
    });

    const furnitureType = await prisma.assetType.create({
        data: {
            name: 'Desk',
            category: 'Furniture',
            customFieldsSchema: {
                fields: [
                    { name: 'material', type: 'string', required: true },
                    { name: 'dimensions', type: 'string', required: true },
                    { name: 'color', type: 'string', required: false },
                ],
            },
        },
    });

    console.log('✅ Asset types created');

    // Create sample assets
    await prisma.asset.createMany({
        data: [
            {
                assetCode: 'LAP-001',
                name: 'Dell XPS 15',
                assetTypeId: laptopType.id,
                currentOfficeId: office1.id,
                status: 'available',
                specifications: {
                    processor: 'Intel i7-12700H',
                    ram: '16GB DDR5',
                    storage: '512GB SSD',
                    screenSize: '15.6"',
                },
                purchaseValue: 1499.99,
                purchaseDate: new Date('2024-01-15'),
                serialNumber: 'DXP15-2024-001',
            },
            {
                assetCode: 'LAP-002',
                name: 'MacBook Pro 16',
                assetTypeId: laptopType.id,
                currentOfficeId: office2.id,
                status: 'available',
                specifications: {
                    processor: 'Apple M3 Pro',
                    ram: '32GB',
                    storage: '1TB SSD',
                    screenSize: '16"',
                },
                purchaseValue: 2999.99,
                purchaseDate: new Date('2024-02-01'),
                serialNumber: 'MBP16-2024-001',
            },
            {
                assetCode: 'DSK-001',
                name: 'Standing Desk',
                assetTypeId: furnitureType.id,
                currentOfficeId: office1.id,
                status: 'in_use',
                specifications: {
                    material: 'Oak Wood',
                    dimensions: '72" x 30"',
                    color: 'Natural Wood',
                },
                purchaseValue: 599.99,
                purchaseDate: new Date('2023-12-10'),
            },
        ],
    });

    console.log('✅ Sample assets created');

    // Get created assets for RFID tag assignment
    const assets = await prisma.asset.findMany({
        where: {
            assetCode: {
                in: ['LAP-001', 'LAP-002', 'DSK-001'],
            },
        },
    });

    // Create RFID Readers
    const reader1 = await prisma.rfidReader.create({
        data: {
            readerId: 'READER-HQ-001',
            name: 'HQ Main Entrance',
            officeId: office1.id,
            status: 'active',
            locationCoordinates: {
                lat: 40.7128,
                lon: -74.0060,
                floor: 1,
            },
            config: {
                power: 30,
                frequency: 'US',
                antennas: 4,
            },
            lastSeen: new Date(),
        },
    });

    const reader2 = await prisma.rfidReader.create({
        data: {
            readerId: 'READER-HQ-002',
            name: 'HQ 2nd Floor',
            officeId: office1.id,
            status: 'active',
            locationCoordinates: {
                lat: 40.7128,
                lon: -74.0060,
                floor: 2,
            },
            config: {
                power: 30,
                frequency: 'US',
                antennas: 4,
            },
            lastSeen: new Date(),
        },
    });

    const reader3 = await prisma.rfidReader.create({
        data: {
            readerId: 'READER-SF-001',
            name: 'SF Main Entrance',
            officeId: office2.id,
            status: 'active',
            locationCoordinates: {
                lat: 37.7749,
                lon: -122.4194,
                floor: 1,
            },
            config: {
                power: 30,
                frequency: 'US',
                antennas: 4,
            },
            lastSeen: new Date(),
        },
    });

    console.log('✅ RFID readers created');

    // Create RFID Tags
    const tag1 = await prisma.rfidTag.create({
        data: {
            epc: 'E28011606000020000001234',
            tid: 'E20000001234567890123456',
            tagType: 'Gen2v2',
            isActive: true,
        },
    });

    const tag2 = await prisma.rfidTag.create({
        data: {
            epc: 'E28011606000020000005678',
            tid: 'E20000005678901234567890',
            tagType: 'Gen2v2',
            isActive: true,
        },
    });

    const tag3 = await prisma.rfidTag.create({
        data: {
            epc: 'E28011606000020000009012',
            tid: 'E20000009012345678901234',
            tagType: 'Gen2v2',
            isActive: true,
        },
    });

    console.log('✅ RFID tags created');

    // Assign RFID tags to assets
    await prisma.asset.update({
        where: { assetCode: 'LAP-001' },
        data: { rfidTagId: tag1.id },
    });

    await prisma.asset.update({
        where: { assetCode: 'LAP-002' },
        data: { rfidTagId: tag2.id },
    });

    await prisma.asset.update({
        where: { assetCode: 'DSK-001' },
        data: { rfidTagId: tag3.id },
    });

    console.log('✅ RFID tags assigned to assets');

    // Create sample RFID events
    const now = new Date();
    const eventsData = [];

    // Simulate recent activity - last 2 hours
    for (let i = 0; i < 20; i++) {
        const minutesAgo = Math.floor(Math.random() * 120);
        const detectedAt = new Date(now.getTime() - minutesAgo * 60 * 1000);

        const readers = [reader1, reader2, reader3];
        const tags = [tag1, tag2, tag3];

        const randomReader = readers[Math.floor(Math.random() * readers.length)];
        const randomTag = tags[Math.floor(Math.random() * tags.length)];

        eventsData.push({
            rfidTagId: randomTag.id,
            rfidReaderId: randomReader.id,
            detectedAt,
            rssi: Math.floor(Math.random() * 40) - 80, // -80 to -40 dBm
            metadata: {
                antenna: Math.floor(Math.random() * 4) + 1,
                peakRssi: Math.floor(Math.random() * 40) - 80,
            },
        });
    }

    await prisma.rfidEvent.createMany({
        data: eventsData,
    });

    console.log('✅ Sample RFID events created');

    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('📝 Login credentials:');
    console.log('   Email: admin@assetms.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('📡 RFID System:');
    console.log(`   Readers: 3 (${reader1.name}, ${reader2.name}, ${reader3.name})`);
    console.log(`   Tags: 3 (all assigned to assets)`);
    console.log('   Events: 20 sample events');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
