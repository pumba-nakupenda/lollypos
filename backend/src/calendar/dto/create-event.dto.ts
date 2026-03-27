import { IsString, IsDateString } from 'class-validator';

export class CreateEventDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsDateString()
    start: string;

    @IsDateString()
    end: string;
}
