import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

interface ImportTagRow {
    epc: string;
    tid?: string;
    tagType?: string;
    assetCode?: string;
}

@Injectable()
export class RfidImportService {
    constructor(private prisma: PrismaService) { }

    async importTags(csvContent: string): Promise<{
        summary: { total: number; successful: number; failed: number };
        results: {
            successful: Array<{ epc: string; message: string }>;
            failed: Array<{ row: number; epc: string; error: string }>;
        };
    }> {
        const results = {
            successful: [] as Array<{ epc: string; message: string }>,
            failed: [] as Array<{ row: number; epc: string; error: string }>,
        };

        const rows: ImportTagRow[] = [];

        // Parse CSV
        await new Promise<void>((resolve, reject) => {
            const stream = Readable.from([csvContent]);
            stream
                .pipe(csv())
                .on('data', (row) => rows.push(row))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header

            try {
                // Validate required fields
                if (!row.epc || row.epc.trim() === '') {
                    results.failed.push({
                        row: rowNumber,
                        epc: row.epc || 'N/A',
                        error: 'EPC is required',
                    });
                    continue;
                }

                // Check if tag already exists
                const existingTag = await this.prisma.rfidTag.findFirst({
                    where: { epc: row.epc },
                });

                if (existingTag) {
                    results.failed.push({
                        row: rowNumber,
                        epc: row.epc,
                        error: 'Tag with this EPC already exists',
                    });
                    continue;
                }

                // Prepare tag data
                const tagData: any = {
                    epc: row.epc.trim(),
                    tid: row.tid?.trim() || null,
                    tagType: row.tagType?.trim() || 'Gen2v2',
                    isActive: true,
                };

                // If asset code is provided, try to find and assign the asset
                if (row.assetCode && row.assetCode.trim() !== '') {
                    const asset = await this.prisma.asset.findFirst({
                        where: { assetCode: row.assetCode.trim() },
                    });

                    if (asset) {
                        tagData.assetId = asset.id;
                    } else {
                        results.failed.push({
                            row: rowNumber,
                            epc: row.epc,
                            error: `Asset with code '${row.assetCode}' not found`,
                        });
                        continue;
                    }
                }

                // Create the tag
                await this.prisma.rfidTag.create({
                    data: tagData,
                });

                results.successful.push({
                    epc: row.epc,
                    message: tagData.assetId ? 'Tag created and assigned' : 'Tag created',
                });
            } catch (error) {
                results.failed.push({
                    row: rowNumber,
                    epc: row.epc || 'N/A',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            summary: {
                total: rows.length,
                successful: results.successful.length,
                failed: results.failed.length,
            },
            results,
        };
    }
}
