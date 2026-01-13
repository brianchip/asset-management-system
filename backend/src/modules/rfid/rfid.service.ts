import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeofenceService } from './geofence.service';
import { SearchRfidDto, SearchTagsDto } from './dto/search-rfid.dto';

@Injectable()
export class RfidService {
    constructor(
        private prisma: PrismaService,
        private geofenceService: GeofenceService,
    ) { }

    // RFID Readers
    async findAllReaders() {
        return this.prisma.rfidReader.findMany({
            include: {
                office: true,
                _count: {
                    select: { events: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findReaderById(id: string) {
        const reader = await this.prisma.rfidReader.findUnique({
            where: { id },
            include: {
                office: true,
                events: {
                    include: {
                        rfidTag: {
                            include: {
                                asset: true,
                            },
                        },
                    },
                    orderBy: { detectedAt: 'desc' },
                    take: 50,
                },
            },
        });

        if (!reader) {
            throw new NotFoundException('RFID reader not found');
        }

        return reader;
    }

    async createReader(data: {
        readerId: string;
        name: string;
        officeId: string;
        locationCoordinates?: any;
        config?: any;
    }) {
        return this.prisma.rfidReader.create({
            data: {
                ...data,
                status: 'inactive',
            },
            include: {
                office: true,
            },
        });
    }

    async updateReaderStatus(id: string, status: string) {
        return this.prisma.rfidReader.update({
            where: { id },
            data: {
                status,
                lastSeen: new Date(),
            },
        });
    }

    async updateReader(
        id: string,
        data: {
            name?: string;
            locationCoordinates?: any;
            config?: any;
        },
    ) {
        return this.prisma.rfidReader.update({
            where: { id },
            data,
            include: {
                office: true,
            },
        });
    }

    async deleteReader(id: string) {
        return this.prisma.rfidReader.update({
            where: { id },
            data: {
                status: 'inactive',
            },
        });
    }

    // RFID Tags
    async findAllTags(query?: { isActive?: boolean }) {
        const where: any = {};

        if (query?.isActive !== undefined) {
            where.isActive = query.isActive;
        }

        return this.prisma.rfidTag.findMany({
            where,
            include: {
                asset: {
                    include: {
                        assetType: true,
                        currentOffice: true,
                    },
                },
                _count: {
                    select: { events: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findTagById(id: string) {
        const tag = await this.prisma.rfidTag.findUnique({
            where: { id },
            include: {
                asset: {
                    include: {
                        assetType: true,
                        currentOffice: true,
                    },
                },
                events: {
                    include: {
                        rfidReader: {
                            include: {
                                office: true,
                            },
                        },
                    },
                    orderBy: { detectedAt: 'desc' },
                    take: 100,
                },
            },
        });

        if (!tag) {
            throw new NotFoundException('RFID tag not found');
        }

        return tag;
    }

    async createTag(data: { epc: string; tid?: string; tagType: string }) {
        return this.prisma.rfidTag.create({
            data: {
                ...data,
                isActive: true,
            },
        });
    }

    async assignTagToAsset(tagId: string, assetId: string) {
        // Update asset with the RFID tag
        return this.prisma.asset.update({
            where: { id: assetId },
            data: { rfidTagId: tagId },
            include: {
                rfidTag: true,
            },
        });
    }

    async unassignTag(tagId: string) {
        // Find the asset with this tag and remove it
        const asset = await this.prisma.asset.findFirst({
            where: { rfidTagId: tagId },
        });

        if (!asset) {
            throw new NotFoundException('No asset found with this tag');
        }

        return this.prisma.asset.update({
            where: { id: asset.id },
            data: { rfidTagId: null },
            include: {
                rfidTag: true,
            },
        });
    }

    async updateTag(id: string, data: { tagType?: string; isActive?: boolean }) {
        return this.prisma.rfidTag.update({
            where: { id },
            data,
        });
    }

    async deleteTag(id: string) {
        return this.prisma.rfidTag.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
    }

    // RFID Events
    async findRecentEvents(limit: number = 50) {
        return this.prisma.rfidEvent.findMany({
            take: limit,
            orderBy: { detectedAt: 'desc' },
            include: {
                rfidTag: {
                    include: {
                        asset: {
                            include: {
                                assetType: true,
                            },
                        },
                    },
                },
                rfidReader: {
                    include: {
                        office: true,
                    },
                },
            },
        });
    }

    async createEvent(data: {
        rfidTagId: string;
        rfidReaderId: string;
        rssi?: number;
        metadata?: any;
    }) {
        return this.prisma.rfidEvent.create({
            data: {
                ...data,
                detectedAt: new Date(),
            },
            include: {
                rfidTag: {
                    include: {
                        asset: true,
                    },
                },
                rfidReader: {
                    include: {
                        office: true,
                    },
                },
            },
        });
    }

    async getActiveAssets() {
        // Get assets that have been detected in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const recentEvents = await this.prisma.rfidEvent.findMany({
            where: {
                detectedAt: {
                    gte: fiveMinutesAgo,
                },
            },
            distinct: ['rfidTagId'],
            include: {
                rfidTag: {
                    include: {
                        asset: {
                            include: {
                                assetType: true,
                                currentOffice: true,
                            },
                        },
                    },
                },
                rfidReader: {
                    include: {
                        office: true,
                    },
                },
            },
            orderBy: {
                detectedAt: 'desc',
            },
        });

        return recentEvents;
    }

    async getStats() {
        const totalReaders = await this.prisma.rfidReader.count();
        const activeReaders = await this.prisma.rfidReader.count({
            where: { status: 'active' },
        });
        const totalTags = await this.prisma.rfidTag.count();
        const activeTags = await this.prisma.rfidTag.count({
            where: { isActive: true },
        });

        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentEvents = await this.prisma.rfidEvent.count({
            where: {
                detectedAt: {
                    gte: last24Hours,
                },
            },
        });

        return {
            totalReaders,
            activeReaders,
            totalTags,
            activeTags,
            eventsLast24h: recentEvents,
        };
    }

    async checkAssetLocation(assetId: string, lat: number, lon: number) {
        return this.geofenceService.checkAssetLocation(assetId, lat, lon);
    }

    async getGeofenceViolations() {
        return this.geofenceService.getGeofenceViolations();
    }

    // Search and Filter Methods
    async searchReaders(searchDto: SearchRfidDto) {
        const { search, status, officeId, fromDate, toDate, page = 1, limit = 20 } = searchDto;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { readerId: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (officeId) {
            where.officeId = officeId;
        }

        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) where.createdAt.gte = new Date(fromDate);
            if (toDate) where.createdAt.lte = new Date(toDate);
        }

        const [readers, total] = await Promise.all([
            this.prisma.rfidReader.findMany({
                where,
                include: {
                    office: true,
                    _count: {
                        select: { events: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.rfidReader.count({ where }),
        ]);

        return {
            data: readers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async searchTags(searchDto: SearchTagsDto) {
        const { search, status, tagType, assignmentStatus, fromDate, toDate, page = 1, limit = 20 } = searchDto;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { epc: { contains: search, mode: 'insensitive' } },
                { tid: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status === 'active') {
            where.isActive = true;
        } else if (status === 'inactive') {
            where.isActive = false;
        }

        if (tagType) {
            where.tagType = tagType;
        }

        if (assignmentStatus === 'assigned') {
            where.asset = { isNot: null };
        } else if (assignmentStatus === 'unassigned') {
            where.asset = null;
        }

        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate) where.createdAt.gte = new Date(fromDate);
            if (toDate) where.createdAt.lte = new Date(toDate);
        }

        const [tags, total] = await Promise.all([
            this.prisma.rfidTag.findMany({
                where,
                include: {
                    asset: {
                        include: {
                            currentOffice: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.rfidTag.count({ where }),
        ]);

        return {
            data: tags,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Bulk Operations
    async bulkAssignTags(assignments: Array<{ tagId: string; assetId: string }>) {
        const results = {
            successful: [] as Array<{ tagId: string; assetId: string; tagEpc: string; assetName: string }>,
            failed: [] as Array<{ tagId: string; assetId: string; error: string }>,
        };

        // Process each assignment
        for (const assignment of assignments) {
            try {
                const { tagId, assetId } = assignment;

                // Verify tag exists
                const tag = await this.prisma.rfidTag.findUnique({
                    where: { id: tagId },
                });

                if (!tag) {
                    results.failed.push({
                        tagId,
                        assetId,
                        error: 'Tag not found',
                    });
                    continue;
                }

                // Check if tag is already assigned to a different asset
                const existingAssignment = await this.prisma.asset.findFirst({
                    where: { rfidTagId: tagId },
                });

                if (existingAssignment && existingAssignment.id !== assetId) {
                    results.failed.push({
                        tagId,
                        assetId,
                        error: `Tag already assigned to another asset`,
                    });
                    continue;
                }

                // Verify asset exists
                const asset = await this.prisma.asset.findUnique({
                    where: { id: assetId },
                    select: { id: true, name: true, rfidTagId: true },
                });

                if (!asset) {
                    results.failed.push({
                        tagId,
                        assetId,
                        error: 'Asset not found',
                    });
                    continue;
                }

                // Assign tag to asset (update Asset, not RfidTag)
                await this.prisma.asset.update({
                    where: { id: assetId },
                    data: {
                        rfidTagId: tagId,
                    },
                });

                results.successful.push({
                    tagId,
                    assetId,
                    tagEpc: tag.epc,
                    assetName: asset.name,
                });
            } catch (error) {
                results.failed.push({
                    tagId: assignment.tagId,
                    assetId: assignment.assetId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            summary: {
                total: assignments.length,
                successful: results.successful.length,
                failed: results.failed.length,
            },
            results,
        };
    }
}
