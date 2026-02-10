import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { SupabaseModule } from '../supabase.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [SupabaseModule, ProductsModule, SalesModule, ExpensesModule],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule {}
