import { Module } from '@nestjs/common';
import { RfidService } from './rfid.service';
import { RfidController } from './rfid.controller';
import { GeofenceService } from './geofence.service';
import { RfidExportService } from './rfid-export.service';
import { RfidImportService } from './rfid-import.service';
import { RfidAnalyticsService } from './rfid-analytics.service';

@Module({
    controllers: [RfidController],
    providers: [RfidService, GeofenceService, RfidExportService, RfidImportService, RfidAnalyticsService],
    exports: [RfidService],
})
export class RfidModule { }
