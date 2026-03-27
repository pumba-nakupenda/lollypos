import { Controller, Get, Post, Body, Query, Param, Delete, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    @Throttle({default: {limit: 10, ttl: 60000}})
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto);
    }

    @Patch(':id')
    @Throttle({default: {limit: 10, ttl: 60000}})
    update(@Param('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
        return this.salesService.update(id, updateSaleDto);
    }

    @Get()
    findAll(@Query('shopId') shopId?: string) {
        return this.salesService.findAll(shopId ? +shopId : undefined);
    }

    @Get('items')
    findItems(@Query('shopId') shopId?: string) {
        return this.salesService.getSaleItems(shopId ? +shopId : undefined);
    }

    @Get(':id/items')
    findSaleItems(@Param('id') id: string) {
        return this.salesService.getSaleItemsBySaleId(id);
    }

    @Delete(':id')
    @Throttle({default: {limit: 10, ttl: 60000}})
    remove(@Param('id') id: string) {
        return this.salesService.remove(id); // Sales IDs are UUIDs
    }

    @Post(':id/cancel')
    @Throttle({default: {limit: 10, ttl: 60000}})
    cancel(@Param('id') id: string, @Query('shopId') shopId?: string) {
        return this.salesService.cancel(id, shopId ? +shopId : undefined);
    }
}