import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all assets' })
    @ApiResponse({ status: 200, description: 'Return all assets' })
    findAll(@Query() query: { search?: string; status?: string; officeId?: string }) {
        return this.assetsService.findAll(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get asset statistics' })
    @ApiResponse({ status: 200, description: 'Return asset stats' })
    getStats() {
        return this.assetsService.getStats();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get asset by ID' })
    @ApiResponse({ status: 200, description: 'Return asset details' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    findOne(@Param('id') id: string) {
        return this.assetsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create new asset' })
    @ApiResponse({ status: 201, description: 'Asset created successfully' })
    @ApiResponse({ status: 409, description: 'Asset code already exists' })
    create(@Body() createAssetDto: CreateAssetDto, @Request() req: any) {
        return this.assetsService.create(createAssetDto, req.user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update asset' })
    @ApiResponse({ status: 200, description: 'Asset updated successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    update(
        @Param('id') id: string,
        @Body() updateAssetDto: UpdateAssetDto,
        @Request() req: any,
    ) {
        return this.assetsService.update(id, updateAssetDto, req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete asset' })
    @ApiResponse({ status: 200, description: 'Asset deleted successfully' })
    @ApiResponse({ status: 404, description: 'Asset not found' })
    remove(@Param('id') id: string) {
        return this.assetsService.remove(id);
    }
}
