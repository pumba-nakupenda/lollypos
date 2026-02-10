import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    create(createExpenseDto: CreateExpenseDto): Promise<any>;
    findAll(shopId?: string): Promise<any[]>;
    update(id: string, updateExpenseDto: Partial<CreateExpenseDto>): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
