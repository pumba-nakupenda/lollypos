import {
    IsString, IsNumber, IsOptional, IsBoolean, IsArray,
    IsUrl, IsDateString, IsEnum, IsUUID, Min, MaxLength, IsInt
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    description?: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    cost_price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    promo_price?: number;

    @IsInt()
    @Min(0)
    @Type(() => Number)
    stock: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    min_stock?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    shop_id: number;

    @IsOptional()
    @IsUUID()
    created_by?: string;

    @IsOptional()
    @IsArray()
    variants?: any[];

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsString()
    video_url?: string;

    @IsOptional()
    @IsDateString()
    expiry_date?: string;

    @IsOptional()
    @IsEnum(['product', 'service'])
    type?: 'product' | 'service';

    @IsOptional()
    @IsBoolean()
    show_on_pos?: boolean;

    @IsOptional()
    @IsBoolean()
    show_on_website?: boolean;

    @IsOptional()
    @IsBoolean()
    is_featured?: boolean;
}
