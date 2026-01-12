import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OfficesService } from './offices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Offices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('offices')
export class OfficesController {
    constructor(private readonly officesService: OfficesService) { }

    @Get()
    findAll() {
        return this.officesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.officesService.findOne(id);
    }
}
