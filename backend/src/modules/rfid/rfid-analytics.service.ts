import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RfidAnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getTagUsageTrends(days: number = 30) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const events = await this.prisma.rfidEvent.findMany({
            where: {
                detectedAt: {
                    gte: fromDate,
                },
            },
            select: {
                detectedAt: true,
            },
        });

        // Group by date
        const dailyCounts = events.reduce((acc, event) => {
            const date = event.detectedAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(dailyCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getReaderActivity() {
        const readers = await this.prisma.rfidReader.findMany({
            include: {
                _count: {
                    select: { events: true },
                },
                office: true,
            },
        });

        return readers.map(reader => ({
            name: reader.name,
            office: reader.office.name,
            eventCount: reader._count.events,
            status: reader.status,
        }));
    }

    async getOfficeDistribution() {
        const tags = await this.prisma.rfidTag.findMany({
            where: {
                asset: {
                    isNot: null,
                },
            },
            include: {
                asset: {
                    include: {
                        currentOffice: true,
                    },
                },
            },
        });

        const distribution = tags.reduce((acc, tag) => {
            if (tag.asset?.currentOffice) {
                const officeName = tag.asset.currentOffice.name;
                acc[officeName] = (acc[officeName] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(distribution).map(([office, count]) => ({
            office,
            count,
        }));
    }

    async getDashboardSummary() {
        const [
            totalTags,
            activeTags,
            assignedTags,
            totalReaders,
            activeReaders,
            recentEvents,
        ] = await Promise.all([
            this.prisma.rfidTag.count(),
            this.prisma.rfidTag.count({ where: { isActive: true } }),
            this.prisma.rfidTag.count({ where: { asset: { isNot: null } } }),
            this.prisma.rfidReader.count(),
            this.prisma.rfidReader.count({ where: { status: 'active' } }),
            this.prisma.rfidEvent.count({
                where: {
                    detectedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                    },
                },
            }),
        ]);

        return {
            tags: {
                total: totalTags,
                active: activeTags,
                assigned: assignedTags,
                unassigned: totalTags - assignedTags,
            },
            readers: {
                total: totalReaders,
                active: activeReaders,
                inactive: totalReaders - activeReaders,
            },
            events: {
                last24Hours: recentEvents,
            },
        };
    }
}
