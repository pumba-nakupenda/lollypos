import { Controller, Get, Post, Body, Query, Param, Delete, Patch } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    create(@Body() createSaleDto: CreateSaleDto) {
        return this.salesService.create(createSaleDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSaleDto: any) {
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
    remove(@Param('id') id: string) {
        return this.salesService.remove(id); // Sales IDs are UUIDs
    }
}