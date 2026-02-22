import {
    IsString, IsNumber, IsOptional, IsBoolean,
    IsEnum, IsDateString, Min, MaxLength, IsInt, IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    description: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    amount: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    category: string;

    @IsOptional()
    @IsString()
    created_by?: string;

    @IsOptional()
    @IsDateString()
    date?: Date;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    shopId?: number;

    @IsOptional()
    @IsBoolean()
    is_recurring?: boolean;

    @IsOptional()
    @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
