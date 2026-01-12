import { IsString, IsOptional, IsUUID, IsNumber, IsDateString } from 'class-validator';

export class CreateAssetDto {
    @IsString()
    assetCode: string;

    @IsString()
    name: string;

    @IsUUID()
    assetTypeId: string;

    @IsUUID()
    @IsOptional()
    currentOfficeId?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    specifications?: any;

    @IsNumber()
    @IsOptional()
    purchaseValue?: number;

    @IsDateString()
    @IsOptional()
    purchaseDate?: string;

    @IsString()
    @IsOptional()
    serialNumber?: string;

    @IsUUID()
    @IsOptional()
    rfidTagId?: string;
}

export class UpdateAssetDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsUUID()
    @IsOptional()
    assetTypeId?: string;

    @IsUUID()
    @IsOptional()
    currentOfficeId?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    specifications?: any;

    @IsNumber()
    @IsOptional()
    purchaseValue?: number;

    @IsDateString()
    @IsOptional()
    purchaseDate?: string;

    @IsString()
    @IsOptional()
    serialNumber?: string;
}
