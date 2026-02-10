import { OnModuleInit } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { SupabaseService } from '../supabase.service';
export declare class ExpensesService implements OnModuleInit {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    onModuleInit(): Promise<void>;
    private get supabase();
    processRecurringExpenses(): Promise<void>;
    create(createExpenseDto: CreateExpenseDto): Promise<any>;
    findAll(shopId?: number): Promise<any[]>;
    update(id: number, updateExpenseDto: Partial<CreateExpenseDto>): Promise<any>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
