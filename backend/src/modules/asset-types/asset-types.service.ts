import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetTypesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.assetType.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.assetType.findUnique({
            where: { id },
        });
    }
}
