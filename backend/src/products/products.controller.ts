import {
  BadRequestException,
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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Public } from '../auth/public.decorator';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { SupabaseService } from '../supabase.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
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

  private async assertShopAccessForMany(
    request: AuthenticatedRequest,
    shopIds: Array<number | null | undefined>,
  ) {
    const uniqueShopIds = [
      ...new Set(shopIds.filter((shopId) => shopId != null).map(Number)),
    ];
    await Promise.all(
      uniqueShopIds.map((shopId) => this.assertShopAccess(request, shopId)),
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() createProductDto: CreateProductDto,
  ) {
    await this.assertShopAccess(request, createProductDto.shop_id);
    return this.productsService.create(createProductDto);
  }

  @Post('bulk')
  async bulkCreate(
    @Req() request: AuthenticatedRequest,
    @Body() createProductDtos: CreateProductDto[],
  ) {
    await this.assertShopAccessForMany(
      request,
      createProductDtos.map((dto) => dto.shop_id),
    );
    return this.productsService.bulkCreate(createProductDtos);
  }

  @Post('bulk-stock')
  bulkUpdateStock(
    @Body() updates: { id: number; stock: number; variants?: any[] }[],
  ) {
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
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    await this.assertShopAccess(request, updateProductDto.shop_id);
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post('reset-stock')
  async resetStock(
    @Req() request: AuthenticatedRequest,
    @Query('shopId') shopId: string,
  ) {
    const id = parseInt(shopId, 10);
    if (!shopId || isNaN(id) || id <= 0) {
      throw new BadRequestException('shopId valide est requis.');
    }
    await this.assertShopAccess(request, id);
    return this.productsService.resetStock(id);
  }

  @Patch('categories/rename')
  async renameCategory(
    @Req() request: AuthenticatedRequest,
    @Body('oldName') oldName: string,
    @Body('newName') newName: string,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.productsService.updateCategory(oldName, newName, id);
  }

  @Delete('categories/:name')
  async deleteCategory(
    @Req() request: AuthenticatedRequest,
    @Param('name') name: string,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.productsService.deleteCategory(name, id);
  }

  @Patch('brands/rename')
  async renameBrand(
    @Req() request: AuthenticatedRequest,
    @Body('oldName') oldName: string,
    @Body('newName') newName: string,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.productsService.updateBrand(oldName, newName, id);
  }

  @Delete('brands/delete')
  async deleteBrand(
    @Req() request: AuthenticatedRequest,
    @Body('name') name: string,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.productsService.deleteBrand(name, id);
  }

  @Patch('colors/rename')
  async renameColor(
    @Req() request: AuthenticatedRequest,
    @Body('oldName') oldName: string,
    @Body('newName') newName: string,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.productsService.updateColor(oldName, newName, id);
  }

  @Delete('colors/delete')
  async deleteColor(
    @Req() request: AuthenticatedRequest,
    @Body('name') name: string,
    @Query('shopId') shopId?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.productsService.deleteColor(name, id);
  }

  @Public()
  @Post(':id/view')
  recordView(@Param('id') id: string, @Body('shopId') shopId?: number) {
    return this.productsService.recordView(+id, shopId);
  }
}
