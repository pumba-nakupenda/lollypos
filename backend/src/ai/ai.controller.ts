import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { SupabaseService } from '../supabase.service';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private async assertShopAccess(
    request: AuthenticatedRequest,
    shopId?: number,
  ) {
    if (shopId === undefined) return;
    await this.supabaseService.assertShopAccess(request.user?.id ?? '', shopId);
  }

  @Get('status')
  async getStatus() {
    return this.aiService.getStatus();
  }

  @Post('analyze')
  async analyze(
    @Req() request: AuthenticatedRequest,
    @Body('question') question: string,
    @Query('shopId') shopId?: string,
  ) {
    if (!question || typeof question !== 'string') {
      throw new BadRequestException('Le champ "question" est requis.');
    }
    if (question.length > 1000) {
      throw new BadRequestException(
        'La question ne peut pas dépasser 1000 caractères.',
      );
    }

    const id = shopId ? Number(shopId) : undefined;
    await this.assertShopAccess(request, id);

    try {
      const answer = await this.aiService.analyzeBusiness(question, id);
      return { answer };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`[AI] analyzeBusiness failed: ${message}`);
      return { answer: 'Erreur fatale interne au serveur.' };
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
  async getForecast(
    @Req() request: AuthenticatedRequest,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? Number(shopId) : undefined;
    await this.assertShopAccess(request, id);
    return this.aiService.getForecast(id);
  }
}
