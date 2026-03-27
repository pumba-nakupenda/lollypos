import { Controller, Get, Post, Body, Query, Param, Delete, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  @Post()
  @Throttle({default: {limit: 10, ttl: 60000}})
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Get()
  findAll(
    @Query('shopId') shopId?: string,
    @Query('category') category?: string,
    @Query('includePersonal') includePersonal?: string
  ) {
    return this.expensesService.findAll(
      shopId ? +shopId : undefined,
      category,
      includePersonal === 'true'
    );
  }

  @Patch(':id')
  @Throttle({default: {limit: 10, ttl: 60000}})
  update(@Param('id') id: string, @Body() updateExpenseDto: Partial<CreateExpenseDto>) {
    return this.expensesService.update(+id, updateExpenseDto);
  }

  @Delete(':id')
  @Throttle({default: {limit: 10, ttl: 60000}})
  remove(@Param('id') id: string) {
    return this.expensesService.remove(+id);
  }

  // --- GESTION DES CATÉGORIES ---
  @Get('categories/list')
  getCategories(@Query('shopId') shopId: string, @Query('isPersonal') isPersonal: string) {
    return this.expensesService.findAllCategories(+shopId, isPersonal === 'true');
  }

  @Post('categories')
  createCategory(@Body() body: { name: string, shopId: number, isPersonal: boolean, budget?: number }) {
    return this.expensesService.createCategory(body.name, body.shopId, body.isPersonal, body.budget);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: { name?: string, budget?: number }) {
    return this.expensesService.updateCategory(+id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.expensesService.deleteCategory(+id);
  }
}