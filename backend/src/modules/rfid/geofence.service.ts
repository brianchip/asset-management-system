import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface GeofenceCheck {
    isInside: boolean;
    distance: number;
    geofence: any;
}

@Injectable()
export class GeofenceService {
    constructor(private prisma: PrismaService) { }

    /**
     * Calculate distance between two points using Haversine formula
     * Returns distance in meters
     */
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number,
    ): number {
        const R = 6371000; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Check if a point is within a geofence
     */
    async checkGeofence(
        lat: number,
        lon: number,
        geofenceId: string,
    ): Promise<GeofenceCheck> {
        const geofence = await this.prisma.geofence.findUnique({
            where: { id: geofenceId },
            include: { office: true },
        });

        if (!geofence) {
            throw new Error('Geofence not found');
        }

        // For circular geofences, we need center coordinates
        // In a real implementation, these would be stored in the geofence
        // For now, we'll use the office location if available
        const contactInfo = geofence.office.contactInfo as any;
        const centerLat = contactInfo?.lat || 0;
        const centerLon = contactInfo?.lon || 0;

        const distance = this.calculateDistance(lat, lon, centerLat, centerLon);
        const radiusMeters = geofence.radiusMeters || 0;
        const isInside = distance <= radiusMeters;

        return {
            isInside,
            distance,
            geofence,
        };
    }

    /**
     * Check asset against all office geofences
     */
    async checkAssetLocation(assetId: string, lat: number, lon: number) {
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
            include: {
                currentOffice: {
                    include: { geofences: true },
                },
            },
        });

        if (!asset) {
            throw new Error('Asset not found');
        }

        // Get all geofences for the asset's office
        const allGeofences = await this.prisma.geofence.findMany({
            include: { office: true },
        });

        const results = [];

        for (const geofence of allGeofences) {
            const contactInfo = geofence.office.contactInfo as any;
            const centerLat = contactInfo?.lat || 0;
            const centerLon = contactInfo?.lon || 0;

            const distance = this.calculateDistance(lat, lon, centerLat, centerLon);
            const radiusMeters = geofence.radiusMeters || 0;
            const isInside = distance <= radiusMeters;

            results.push({
                geofenceId: geofence.id,
                geofenceName: geofence.name,
                officeId: geofence.officeId,
                officeName: geofence.office.name,
                isInside,
                distance,
                radiusMeters: geofence.radiusMeters,
            });
        }

        return {
            assetId: asset.id,
            assetName: asset.name,
            currentOfficeId: asset.currentOfficeId,
            location: { lat, lon },
            geofenceChecks: results,
        };
    }

    /**
     * Process RFID event and check geofencing
     */
    async processRfidEvent(eventId: string) {
        const event = await this.prisma.rfidEvent.findUnique({
            where: { id: eventId },
            include: {
                rfidTag: {
                    include: { asset: true },
                },
                rfidReader: {
                    include: {
                        office: {
                            include: { geofences: true },
                        },
                    },
                },
            },
        });

        if (!event || !event.rfidTag.asset) {
            return null;
        }

        const asset = event.rfidTag.asset;
        const reader = event.rfidReader;
        const locationCoords = reader.locationCoordinates as any;
        const readerLat = locationCoords?.lat || 0;
        const readerLon = locationCoords?.lon || 0;

        // Check if asset is in the expected office
        const isInExpectedOffice = asset.currentOfficeId === reader.officeId;

        // Check geofences
        const geofenceResults = await this.checkAssetLocation(
            asset.id,
            readerLat,
            readerLon,
        );

        // Determine if alert should be triggered
        const alerts = [];

        for (const geo of geofenceResults.geofenceChecks) {
            const geofence = reader.office.geofences.find((g) => g.id === geo.geofenceId);

            if (geofence) {
                const config = geofence.config as any;

                // Alert on exit (asset was inside, now outside)
                if (config?.alertOnExit && !geo.isInside && isInExpectedOffice) {
                    alerts.push({
                        type: 'geofence_exit',
                        geofenceId: geo.geofenceId,
                        geofenceName: geo.geofenceName,
                        message: `Asset "${asset.name}" has exited geofence "${geo.geofenceName}"`,
                        distance: geo.distance,
                    });
                }

                // Alert on entry (asset was outside, now inside)
                if (config?.alertOnEntry && geo.isInside && !isInExpectedOffice) {
                    alerts.push({
                        type: 'geofence_entry',
                        geofenceId: geo.geofenceId,
                        geofenceName: geo.geofenceName,
                        message: `Asset "${asset.name}" has entered geofence "${geo.geofenceName}"`,
                        distance: geo.distance,
                    });
                }
            }
        }

        return {
            eventId: event.id,
            asset: {
                id: asset.id,
                name: asset.name,
                currentOfficeId: asset.currentOfficeId,
            },
            reader: {
                id: reader.id,
                name: reader.name,
                officeId: reader.officeId,
            },
            geofenceResults,
            alerts,
        };
    }

    /**
     * Get geofence violations (assets outside their expected office)
     */
    async getGeofenceViolations() {
        // Get recent RFID events (last 5 minutes)
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
                    include: { asset: true },
                },
                rfidReader: {
                    include: { office: true },
                },
            },
            orderBy: {
                detectedAt: 'desc',
            },
        });

        const violations = [];

        for (const event of recentEvents) {
            if (event.rfidTag.asset) {
                const asset = event.rfidTag.asset;
                const reader = event.rfidReader;

                // Violation: asset detected in different office than assigned
                if (asset.currentOfficeId !== reader.officeId) {
                    violations.push({
                        assetId: asset.id,
                        assetName: asset.name,
                        assetCode: asset.assetCode,
                        expectedOfficeId: asset.currentOfficeId,
                        detectedOfficeId: reader.officeId,
                        detectedOfficeName: reader.office.name,
                        detectedAt: event.detectedAt,
                        readerId: reader.id,
                        readerName: reader.name,
                    });
                }
            }
        }

        return violations;
    }
}
