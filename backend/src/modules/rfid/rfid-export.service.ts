import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createObjectCsvStringifier } from 'csv-writer';

@Injectable()
export class RfidExportService {
    constructor(private prisma: PrismaService) { }

    async exportReaders(): Promise<string> {
        const readers = await this.prisma.rfidReader.findMany({
            include: {
                office: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'readerId', title: 'Reader ID' },
                { id: 'name', title: 'Name' },
                { id: 'status', title: 'Status' },
                { id: 'officeName', title: 'Office' },
                { id: 'officeCode', title: 'Office Code' },
                { id: 'lastSeen', title: 'Last Seen' },
                { id: 'createdAt', title: 'Created At' },
            ],
        });

        const records = readers.map(reader => ({
            readerId: reader.readerId,
            name: reader.name,
            status: reader.status,
            officeName: reader.office.name,
            officeCode: reader.office.code,
            lastSeen: reader.lastSeen || '',
            createdAt: reader.createdAt,
        }));

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    }

    async exportTags(): Promise<string> {
        const tags = await this.prisma.rfidTag.findMany({
            include: {
                asset: {
                    include: {
                        assetType: true,
                        currentOffice: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'epc', title: 'EPC' },
                { id: 'tid', title: 'TID' },
                { id: 'tagType', title: 'Tag Type' },
                { id: 'isActive', title: 'Active' },
                { id: 'assetName', title: 'Asset Name' },
                { id: 'assetCode', title: 'Asset Code' },
                { id: 'assetType', title: 'Asset Type' },
                { id: 'office', title: 'Current Office' },
                { id: 'createdAt', title: 'Created At' },
            ],
        });

        const records = tags.map(tag => ({
            epc: tag.epc,
            tid: tag.tid || '',
            tagType: tag.tagType,
            isActive: tag.isActive,
            assetName: tag.asset?.name || '',
            assetCode: tag.asset?.assetCode || '',
            assetType: tag.asset?.assetType?.name || '',
            office: tag.asset?.currentOffice?.name || '',
            createdAt: tag.createdAt,
        }));

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    }

    async exportEvents(fromDate?: Date, toDate?: Date): Promise<string> {
        const where: any = {};

        if (fromDate || toDate) {
            where.detectedAt = {};
            if (fromDate) where.detectedAt.gte = fromDate;
            if (toDate) where.detectedAt.lte = toDate;
        }

        const events = await this.prisma.rfidEvent.findMany({
            where,
            include: {
                rfidTag: true,
                rfidReader: {
                    include: {
                        office: true,
                    },
                },
            },
            orderBy: { detectedAt: 'desc' },
            take: 10000, // Limit to prevent memory issues
        });

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'tagEpc', title: 'Tag EPC' },
                { id: 'readerName', title: 'Reader Name' },
                { id: 'officeName', title: 'Office' },
                { id: 'detectedAt', title: 'Detected At' },
            ],
        });

        const records = events.map(event => ({
            tagEpc: event.rfidTag.epc,
            readerName: event.rfidReader.name,
            officeName: event.rfidReader.office.name,
            detectedAt: event.detectedAt,
        }));

        return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    }
}
