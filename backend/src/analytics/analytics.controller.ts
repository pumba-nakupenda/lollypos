import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get()
    getAnalytics(
        @Query('shopId') shopId?: string,
        @Query('category') category?: string,
        @Query('month') month?: string,
        @Query('year') year?: string,
    ) {
        return this.analyticsService.getAnalytics(shopId, category, month, year);
    }

    @Get('history')
    getHistory(
        @Query('shopId') shopId?: string,
        @Query('year') year?: string,
    ) {
        return this.analyticsService.getHistory(shopId, year);
    }
}
