import { IsString, IsDateString } from 'class-validator';

export class SyncCustomerDto {
    @IsString()
    name: string;

    @IsDateString()
    date: string;
}
