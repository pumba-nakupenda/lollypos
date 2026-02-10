import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('log-connection')
    async log(@Body() body: { userId: string, email: string, device: string, ip: string }) {
        return this.authService.logConnection(body.userId, body.email, body.device, body.ip);
    }

    @Get('logs')
    async getLogs() {
        return this.authService.getLogs();
    }
}
