import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RfidService } from './rfid.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchRfidDto, SearchTagsDto } from './dto/search-rfid.dto';
import { BulkAssignTagsDto } from './dto/bulk-assign.dto';
import { RfidExportService } from './rfid-export.service';
import { RfidImportService } from './rfid-import.service';
import { RfidAnalyticsService } from './rfid-analytics.service';

@ApiTags('RFID')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rfid')
export class RfidController {
    constructor(
        private readonly rfidService: RfidService,
        private readonly exportService: RfidExportService,
        private readonly importService: RfidImportService,
        private readonly analyticsService: RfidAnalyticsService,
    ) { }

    // Readers
    @Get('readers')
    @ApiOperation({ summary: 'Get all RFID readers' })
    findAllReaders() {
        return this.rfidService.findAllReaders();
    }

    @Get('readers/:id')
    @ApiOperation({ summary: 'Get RFID reader by ID' })
    findReaderById(@Param('id') id: string) {
        return this.rfidService.findReaderById(id);
    }

    @Post('readers')
    @ApiOperation({ summary: 'Create new RFID reader' })
    createReader(
        @Body()
        body: {
            readerId: string;
            name: string;
            officeId: string;
            locationCoordinates?: any;
            config?: any;
        },
    ) {
        return this.rfidService.createReader(body);
    }

    @Patch('readers/:id/status')
    @ApiOperation({ summary: 'Update reader status' })
    updateReaderStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return this.rfidService.updateReaderStatus(id, body.status);
    }

    @Patch('readers/:id')
    @ApiOperation({ summary: 'Update RFID reader configuration' })
    updateReader(
        @Param('id') id: string,
        @Body()
        body: {
            name?: string;
            locationCoordinates?: any;
            config?: any;
        },
    ) {
        return this.rfidService.updateReader(id, body);
    }

    @Delete('readers/:id')
    @ApiOperation({ summary: 'Delete RFID reader' })
    deleteReader(@Param('id') id: string) {
        return this.rfidService.deleteReader(id);
    }

    // Tags
    @Get('tags')
    @ApiOperation({ summary: 'Get all RFID tags' })
    findAllTags(@Query('isActive') isActive?: string) {
        return this.rfidService.findAllTags({
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        });
    }

    @Get('tags/:id')
    @ApiOperation({ summary: 'Get RFID tag by ID' })
    findTagById(@Param('id') id: string) {
        return this.rfidService.findTagById(id);
    }

    @Post('tags')
    @ApiOperation({ summary: 'Create new RFID tag' })
    createTag(@Body() body: { epc: string; tid?: string; tagType: string }) {
        return this.rfidService.createTag(body);
    }

    @Post('tags/:tagId/assign/:assetId')
    @ApiOperation({ summary: 'Assign tag to asset' })
    assignTagToAsset(@Param('tagId') tagId: string, @Param('assetId') assetId: string) {
        return this.rfidService.assignTagToAsset(tagId, assetId);
    }

    @Post('tags/:tagId/unassign')
    @ApiOperation({ summary: 'Unassign tag from asset' })
    unassignTag(@Param('tagId') tagId: string) {
        return this.rfidService.unassignTag(tagId);
    }

    @Patch('tags/:id')
    @ApiOperation({ summary: 'Update RFID tag' })
    updateTag(
        @Param('id') id: string,
        @Body() body: { tagType?: string; isActive?: boolean },
    ) {
        return this.rfidService.updateTag(id, body);
    }

    @Delete('tags/:id')
    @ApiOperation({ summary: 'Delete RFID tag' })
    deleteTag(@Param('id') id: string) {
        return this.rfidService.deleteTag(id);
    }

    // Events
    @Get('events')
    @ApiOperation({ summary: 'Get recent RFID events' })
    findRecentEvents(@Query('limit') limit?: string) {
        return this.rfidService.findRecentEvents(limit ? parseInt(limit) : 50);
    }

    @Post('events')
    @ApiOperation({ summary: 'Create RFID event (for reader integration)' })
    createEvent(
        @Body()
        body: {
            rfidTagId: string;
            rfidReaderId: string;
            rssi?: number;
            metadata?: any;
        },
    ) {
        return this.rfidService.createEvent(body);
    }

    @Get('tracking/active')
    @ApiOperation({ summary: 'Get currently active assets' })
    getActiveAssets() {
        return this.rfidService.getActiveAssets();
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get RFID statistics' })
    getStats() {
        return this.rfidService.getStats();
    }

    @Get('geofence/violations')
    @ApiOperation({ summary: 'Get assets outside their expected office' })
    getGeofenceViolations() {
        return this.rfidService.getGeofenceViolations();
    }

    @Post('geofence/check/:assetId')
    @ApiOperation({ summary: 'Check asset against geofences' })
    checkAssetGeofence(
        @Param('assetId') assetId: string,
        @Body() body: { lat: number; lon: number },
    ) {
        return this.rfidService.checkAssetLocation(assetId, body.lat, body.lon);
    }

    // Search and Filter Endpoints
    @Get('search/readers')
    @ApiOperation({ summary: 'Search and filter RFID readers' })
    searchReaders(@Query() searchDto: SearchRfidDto) {
        return this.rfidService.searchReaders(searchDto);
    }

    @Get('search/tags')
    @ApiOperation({ summary: 'Search and filter RFID tags' })
    searchTags(@Query() searchDto: SearchTagsDto) {
        return this.rfidService.searchTags(searchDto);
    }

    // Bulk Operations
    @Post('tags/bulk-assign')
    @ApiOperation({ summary: 'Bulk assign RFID tags to assets' })
    bulkAssignTags(@Body() bulkAssignDto: BulkAssignTagsDto) {
        return this.rfidService.bulkAssignTags(bulkAssignDto.assignments);
    }

    // Export Endpoints
    @Get('export/readers')
    @ApiOperation({ summary: 'Export readers to CSV' })
    async exportReaders() {
        const csv = await this.exportService.exportReaders();
        return { csv, filename: `rfid-readers-${new Date().toISOString().split('T')[0]}.csv` };
    }

    @Get('export/tags')
    @ApiOperation({ summary: 'Export tags to CSV' })
    async exportTags() {
        const csv = await this.exportService.exportTags();
        return { csv, filename: `rfid-tags-${new Date().toISOString().split('T')[0]}.csv` };
    }

    @Get('export/events')
    @ApiOperation({ summary: 'Export events to CSV' })
    async exportEvents(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
        const from = fromDate ? new Date(fromDate) : undefined;
        const to = toDate ? new Date(toDate) : undefined;
        const csv = await this.exportService.exportEvents(from, to);
        return { csv, filename: `rfid-events-${new Date().toISOString().split('T')[0]}.csv` };
    }

    // Import Endpoint
    @Post('import/tags')
    @ApiOperation({ summary: 'Import tags from CSV' })
    async importTags(@Body() body: { csv: string }) {
        return this.importService.importTags(body.csv);
    }

    // Analytics Endpoints
    @Get('analytics/summary')
    @ApiOperation({ summary: 'Get dashboard summary' })
    getDashboardSummary() {
        return this.analyticsService.getDashboardSummary();
    }

    @Get('analytics/usage-trends')
    @ApiOperation({ summary: 'Get tag usage trends' })
    getUsageTrends(@Query('days') days?: string) {
        return this.analyticsService.getTagUsageTrends(days ? parseInt(days) : 30);
    }

    @Get('analytics/reader-activity')
    @ApiOperation({ summary: 'Get reader activity statistics' })
    getReaderActivity() {
        return this.analyticsService.getReaderActivity();
    }

    @Get('analytics/office-distribution')
    @ApiOperation({ summary: 'Get office distribution' })
    getOfficeDistribution() {
        return this.analyticsService.getOfficeDistribution();
    }
}
