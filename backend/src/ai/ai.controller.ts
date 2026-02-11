import { Controller, Post, Body, Query, UseGuards, Get } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
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
        console.log(`[TRAFFIC] Requête IA reçue : "${question}" pour Shop: ${shopId}`);
        const id = shopId ? parseInt(shopId) : undefined;
        try {
            const answer = await this.aiService.analyzeBusiness(question, id);
            console.log(`[TRAFFIC] Réponse générée avec succès`);
            return { answer };
        } catch (err) {
            console.error(`[TRAFFIC] CRASH dans le contrôleur :`, err.message);
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

    @Get('forecast')
    async getForecast(@Query('shopId') shopId?: string) {
        return this.aiService.getForecast(shopId ? parseInt(shopId) : undefined);
    }
}