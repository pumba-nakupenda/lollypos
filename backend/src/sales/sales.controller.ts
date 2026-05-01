import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { SupabaseService } from '../supabase.service';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private async assertShopAccess(
    request: AuthenticatedRequest,
    shopId?: number | null,
  ) {
    if (shopId === undefined || shopId === null) return;
    await this.supabaseService.assertShopAccess(
      request.user?.id ?? '',
      Number(shopId),
    );
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    await this.assertShopAccess(request, createSaleDto.shopId);
    return this.salesService.create(createSaleDto);
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    await this.assertShopAccess(request, updateSaleDto.shopId);
    return this.salesService.update(id, updateSaleDto);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.salesService.findAll(id);
  }

  @Get('items')
  async findItems(
    @Req() request: AuthenticatedRequest,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.salesService.getSaleItems(id);
  }

  @Get(':id/items')
  findSaleItems(@Param('id') id: string) {
    return this.salesService.getSaleItemsBySaleId(id);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }

  @Post(':id/cancel')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Query('shopId') shopId?: string,
  ) {
    const parsedShopId = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, parsedShopId);
    return this.salesService.cancel(id, parsedShopId);
  }
}
