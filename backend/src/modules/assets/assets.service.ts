import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';

@Injectable()
export class AssetsService {
    constructor(private prisma: PrismaService) { }

    async findAll(query?: { search?: string; status?: string; officeId?: string }) {
        const where: any = {};

        if (query?.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { assetCode: { contains: query.search, mode: 'insensitive' } },
                { serialNumber: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        if (query?.status) {
            where.status = query.status;
        }

        if (query?.officeId) {
            where.currentOfficeId = query.officeId;
        }

        const assets = await this.prisma.asset.findMany({
            where,
            include: {
                assetType: true,
                currentOffice: true,
                currentUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                rfidTag: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return assets;
    }

    async findOne(id: string) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: {
                assetType: true,
                currentOffice: true,
                currentUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                rfidTag: true,
                statusHistory: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: {
                        changedAt: 'desc',
                    },
                    take: 10,
                },
                userAssignments: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        assignedAt: 'desc',
                    },
                    take: 10,
                },
                locationHistory: {
                    include: {
                        office: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: {
                        movedAt: 'desc',
                    },
                    take: 10,
                },
                maintenanceRecords: {
                    orderBy: {
                        scheduledDate: 'desc',
                    },
                    take: 10,
                },
            },
        });

        if (!asset) {
            throw new NotFoundException(`Asset with ID ${id} not found`);
        }

        return asset;
    }

    async create(createAssetDto: CreateAssetDto, userId: string) {
        // Check if asset code already exists
        const existing = await this.prisma.asset.findUnique({
            where: { assetCode: createAssetDto.assetCode },
        });

        if (existing) {
            throw new ConflictException('Asset code already exists');
        }

        const asset = await this.prisma.asset.create({
            data: {
                ...createAssetDto,
                currentUserId: userId,
                status: createAssetDto.status || 'available',
            },
            include: {
                assetType: true,
                currentOffice: true,
            },
        });

        // Create initial status history
        await this.prisma.assetStatusHistory.create({
            data: {
                assetId: asset.id,
                statusFrom: 'none',
                statusTo: asset.status,
                changedBy: userId,
                reason: 'Asset created',
            },
        });

        return asset;
    }

    async update(id: string, updateAssetDto: UpdateAssetDto, userId: string) {
        const existing = await this.findOne(id);

        const asset = await this.prisma.asset.update({
            where: { id },
            data: updateAssetDto,
            include: {
                assetType: true,
                currentOffice: true,
            },
        });

        // Track status change
        if (updateAssetDto.status && updateAssetDto.status !== existing.status) {
            await this.prisma.assetStatusHistory.create({
                data: {
                    assetId: asset.id,
                    statusFrom: existing.status,
                    statusTo: updateAssetDto.status,
                    changedBy: userId,
                    reason: 'Status updated',
                },
            });
        }

        return asset;
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.asset.delete({
            where: { id },
        });

        return { message: 'Asset deleted successfully' };
    }

    async getStats() {
        const total = await this.prisma.asset.count();
        const available = await this.prisma.asset.count({
            where: { status: 'available' },
        });
        const inUse = await this.prisma.asset.count({
            where: { status: 'in_use' },
        });
        const maintenance = await this.prisma.asset.count({
            where: { status: 'under_maintenance' },
        });

        return {
            total,
            available,
            inUse,
            maintenance,
        };
    }
}
