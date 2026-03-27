import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';

const MONTH_RE = /^(0[1-9]|1[0-2])$/;
const YEAR_RE = /^\d{4}$/;

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Get()
    getAnalytics(
        @Query('shopId') shopId?: string,
        @Query('category') category?: string,
        @Query('month') month?: string,
        @Query('year') year?: string,
    ) {
        if (month && !MONTH_RE.test(month)) throw new BadRequestException('month doit être entre 01 et 12');
        if (year && !YEAR_RE.test(year)) throw new BadRequestException('year doit être une année à 4 chiffres');
        if (shopId && shopId !== 'all' && isNaN(Number(shopId))) throw new BadRequestException('shopId invalide');
        return this.analyticsService.getAnalytics(shopId, category, month, year);
    }

    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Get('history')
    getHistory(
        @Query('shopId') shopId?: string,
        @Query('year') year?: string,
    ) {
        if (year && !YEAR_RE.test(year)) throw new BadRequestException('year doit être une année à 4 chiffres');
        if (shopId && shopId !== 'all' && isNaN(Number(shopId))) throw new BadRequestException('shopId invalide');
        return this.analyticsService.getHistory(shopId, year);
    }
}
