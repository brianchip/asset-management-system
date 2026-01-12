import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkAssignTagsDto {
    @ApiProperty({
        description: 'Array of tag assignment pairs',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                tagId: { type: 'string', format: 'uuid' },
                assetId: { type: 'string', format: 'uuid' },
            },
        },
        example: [
            { tagId: '123e4567-e89b-12d3-a456-426614174000', assetId: '234e5678-e89b-12d3-a456-426614174001' },
            { tagId: '345e6789-e89b-12d3-a456-426614174002', assetId: '456e7890-e89b-12d3-a456-426614174003' },
        ],
    })
    @IsArray()
    @ArrayNotEmpty()
    assignments: Array<{ tagId: string; assetId: string }>;
}
