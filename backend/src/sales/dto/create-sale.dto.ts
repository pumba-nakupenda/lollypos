import {
    IsString, IsNumber, IsOptional, IsBoolean, IsArray,
    IsEnum, IsUUID, Min, MaxLength, IsInt, ValidateNested, IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemDto {
    @IsInt()
    @Min(1)
    @Type(() => Number)
    productId: number;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsString()
    variantId?: string;
}

export class CreateSaleDto {
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    totalAmount: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    paymentMethod: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    shopId: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    customer_name?: string;

    @IsOptional()
    @IsUUID()
    customer_id?: string;

    @IsOptional()
    @IsUUID()
    created_by?: string;

    @IsOptional()
    @IsBoolean()
    with_tva?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    type?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    paid_amount?: number;

    @IsOptional()
    @IsUUID()
    parent_id?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    invoice_number?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    linked_doc_number?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    status?: string;

    @IsOptional()
    @IsUUID()
    project_id?: string;

    @IsOptional()
    @IsDateString()
    created_at?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SaleItemDto)
    items: SaleItemDto[];
}
