import { Controller, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    @Post('status') // Using POST for consistency with other AI routes if needed, or GET
    async getStatus() {
        return this.aiService.getStatus();
    }

    @Post('analyze')
    async analyze(
        @Body('question') question: string,
        @Query('shopId') shopId?: string
    ) {
        const id = shopId ? parseInt(shopId) : undefined;
        const answer = await this.aiService.analyzeBusiness(question, id);
        return { answer };
    }

    @Post('suggest-photo')
    async suggestPhoto(@Body('name') name: string) {
        return this.aiService.suggestProductPhoto(name);
    }

    @Post('generate-banner')
    async generateBanner() {
        return this.aiService.generatePromoBanner();
    }
}