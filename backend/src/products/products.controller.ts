import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Public } from '../auth/public.decorator';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Post('bulk')
    bulkCreate(@Body() createProductDtos: CreateProductDto[]) {
        return this.productsService.bulkCreate(createProductDtos);
    }

    @Post('bulk-stock')
    bulkUpdateStock(@Body() updates: { id: number, stock: number, variants?: any[] }[]) {
        return this.productsService.bulkUpdateStock(updates);
    }

    @Public()
    @Get()
    findAll(@Query('shopId') shopId?: string) {
        return this.productsService.findAll(shopId ? +shopId : undefined);
    }

    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(+id, updateProductDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productsService.remove(+id);
    }

    @Post('reset-stock')
    resetStock(@Query('shopId') shopId: string) {
        const id = parseInt(shopId, 10);
        if (!shopId || isNaN(id) || id <= 0) {
            throw new BadRequestException('shopId valide est requis.');
        }
        return this.productsService.resetStock(id);
    }

    @Patch('categories/rename')
    renameCategory(
        @Body('oldName') oldName: string,
        @Body('newName') newName: string,
        @Query('shopId') shopId?: string
    ) {
        return this.productsService.updateCategory(oldName, newName, shopId ? +shopId : undefined);
    }

    @Delete('categories/:name')
    deleteCategory(
        @Param('name') name: string,
        @Query('shopId') shopId?: string
    ) {
        return this.productsService.deleteCategory(name, shopId ? +shopId : undefined);
    }

    @Patch('brands/rename')
    renameBrand(
        @Body('oldName') oldName: string,
        @Body('newName') newName: string,
        @Query('shopId') shopId?: string
    ) {
        return this.productsService.updateBrand(oldName, newName, shopId ? +shopId : undefined);
    }

    @Delete('brands/delete')
    deleteBrand(
        @Body('name') name: string,
        @Query('shopId') shopId?: string
    ) {
        return this.productsService.deleteBrand(name, shopId ? +shopId : undefined);
    }

    @Patch('colors/rename')
    renameColor(
        @Body('oldName') oldName: string,
        @Body('newName') newName: string,
        @Query('shopId') shopId?: string
    ) {
        return this.productsService.updateColor(oldName, newName, shopId ? +shopId : undefined);
    }

    @Delete('colors/delete')
    deleteColor(
        @Body('name') name: string,
        @Query('shopId') shopId?: string
    ) {
        return this.productsService.deleteColor(name, shopId ? +shopId : undefined);
    }

    @Public()
    @Post(':id/view')
    recordView(@Param('id') id: string, @Body('shopId') shopId?: number) {
        return this.productsService.recordView(+id, shopId);
    }
}
