import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
    private readonly logger = new Logger(ProductsController.name);
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get()
    findAll(@Query('shopId') shopId?: string) {
        return this.productsService.findAll(shopId ? +shopId : undefined);
    }

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

    @Post(':id/view')
    recordView(@Param('id') id: string, @Body('shopId') shopId?: number) {
        return this.productsService.recordView(+id, shopId);
    }
}
