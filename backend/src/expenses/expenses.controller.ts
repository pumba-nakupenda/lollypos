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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { SupabaseService } from '../supabase.service';

@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
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
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    await this.assertShopAccess(request, createExpenseDto.shopId);
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('shopId') shopId?: string,
    @Query('category') category?: string,
    @Query('includePersonal') includePersonal?: string,
  ) {
    const id = shopId ? +shopId : undefined;
    await this.assertShopAccess(request, id);
    return this.expensesService.findAll(
      id,
      category,
      includePersonal === 'true',
    );
  }

  @Patch(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateExpenseDto: Partial<CreateExpenseDto>,
  ) {
    await this.assertShopAccess(request, updateExpenseDto.shopId);
    return this.expensesService.update(+id, updateExpenseDto);
  }

  @Delete(':id')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  remove(@Param('id') id: string) {
    return this.expensesService.remove(+id);
  }

  @Get('categories/list')
  async getCategories(
    @Req() request: AuthenticatedRequest,
    @Query('shopId') shopId: string,
    @Query('isPersonal') isPersonal: string,
  ) {
    const id = +shopId;
    await this.assertShopAccess(request, id);
    return this.expensesService.findAllCategories(id, isPersonal === 'true');
  }

  @Post('categories')
  async createCategory(
    @Req() request: AuthenticatedRequest,
    @Body()
    body: {
      name: string;
      shopId: number;
      isPersonal: boolean;
      budget?: number;
    },
  ) {
    await this.assertShopAccess(request, body.shopId);
    return this.expensesService.createCategory(
      body.name,
      body.shopId,
      body.isPersonal,
      body.budget,
    );
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; budget?: number },
  ) {
    return this.expensesService.updateCategory(+id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.expensesService.deleteCategory(+id);
  }
}
