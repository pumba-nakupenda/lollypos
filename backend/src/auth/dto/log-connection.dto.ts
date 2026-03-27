import { IsString, IsUUID, IsEmail } from 'class-validator';

export class LogConnectionDto {
    @IsString()
    @IsUUID()
    userId: string;

    @IsEmail()
    email: string;

    @IsString()
    device: string;

    @IsString()
    ip: string;
}
