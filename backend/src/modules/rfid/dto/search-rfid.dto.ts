import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchRfidDto {
    @ApiPropertyOptional({
        description: 'Search term for name, ID, EPC, or location',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: ['active', 'inactive'],
    })
    @IsOptional()
    @IsEnum(['active', 'inactive'])
    status?: string;

    @ApiPropertyOptional({
        description: 'Filter by office ID',
    })
    @IsOptional()
    @IsString()
    officeId?: string;

    @ApiPropertyOptional({
        description: 'Filter from date (ISO format)',
    })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({
        description: 'Filter to date (ISO format)',
    })
    @IsOptional()
    @IsDateString()
    toDate?: string;

    @ApiPropertyOptional({
        description: 'Page number',
        default: 1,
    })
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({
        description: 'Items per page',
        default: 20,
    })
    @IsOptional()
    limit?: number;
}

export class SearchTagsDto extends SearchRfidDto {
    @ApiPropertyOptional({
        description: 'Filter by tag type',
    })
    @IsOptional()
    @IsString()
    tagType?: string;

    @ApiPropertyOptional({
        description: 'Filter by assignment status',
        enum: ['assigned', 'unassigned', 'all'],
    })
    @IsOptional()
    @IsEnum(['assigned', 'unassigned', 'all'])
    assignmentStatus?: string;
}
