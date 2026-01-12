import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OfficesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.office.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.office.findUnique({
            where: { id },
            include: {
                geofences: true,
            },
        });
    }
}
