import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SupabaseModule } from '../supabase.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => AiModule)],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService]
})
export class ProductsModule { }
