import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetTypesService } from './asset-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Asset Types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('asset-types')
export class AssetTypesController {
    constructor(private readonly assetTypesService: AssetTypesService) { }

    @Get()
    findAll() {
        return this.assetTypesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.assetTypesService.findOne(id);
    }
}
