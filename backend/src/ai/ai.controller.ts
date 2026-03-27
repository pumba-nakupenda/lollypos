import { Controller, Post, Body, Query, UseGuards, Get, BadRequestException, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('ai')
export class AiController {
    private readonly logger = new Logger(AiController.name);
    constructor(private readonly aiService: AiService) {}

    @Get('status')
    async getStatus() {
        return this.aiService.getStatus();
    }

    @Post('analyze')
    async analyze(
        @Body('question') question: string,
        @Query('shopId') shopId?: string
    ) {
        if (!question || typeof question !== 'string') {
            throw new BadRequestException('Le champ "question" est requis.');
        }
        if (question.length > 1000) {
            throw new BadRequestException('La question ne peut pas dépasser 1000 caractères.');
        }
        const id = shopId ? parseInt(shopId) : undefined;
        try {
            const answer = await this.aiService.analyzeBusiness(question, id);
            return { answer };
        } catch (err) {
            this.logger.error(`[AI] analyzeBusiness failed: ${err.message}`);
            return { answer: "Erreur fatale interne au serveur." };
        }
    }

    @Post('suggest-photo')
    async suggestPhoto(@Body('name') name: string) {
        return this.aiService.suggestProductPhoto(name);
    }

    @Post('generate-banner')
    async generateBanner() {
        return this.aiService.generatePromoBanner();
    }

    @Post('generate-description')
    async generateDescription(@Body('name') name: string) {
        return this.aiService.generateDescription(name);
    }

    @Get('forecast')
    async getForecast(@Query('shopId') shopId?: string) {
        return this.aiService.getForecast(shopId ? parseInt(shopId) : undefined);
    }
}