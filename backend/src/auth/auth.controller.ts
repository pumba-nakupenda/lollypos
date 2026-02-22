import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Throttle({ default: { ttl: 60000, limit: 5 } })
    @Post('log-connection')
    async log(@Body() body: { userId: string, email: string, device: string, ip: string }) {
        return this.authService.logConnection(body.userId, body.email, body.device, body.ip);
    }

    @Get('logs')
    async getLogs() {
        return this.authService.getLogs();
    }
}
