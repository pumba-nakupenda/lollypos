import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';
import { ExpensesService } from '../expenses/expenses.service';
export declare class AiService {
    private configService;
    private supabaseService;
    private productsService;
    private salesService;
    private expensesService;
    private readonly logger;
    private genAI;
    private model;
    private chatSessions;
    constructor(configService: ConfigService, supabaseService: SupabaseService, productsService: ProductsService, salesService: SalesService, expensesService: ExpensesService);
    private get supabase();
    analyzeBusiness(userQuestion: string, shopId?: number): Promise<string>;
    suggestProductPhoto(productName: string): Promise<{
        urls: string[];
    }>;
    private getDetailedSalesAnalytics;
    private getTopProducts;
    private getFinancialHealth;
    private getDetailedExpenseAnalytics;
    private getDebts;
    private getConversionAnalytics;
    private getBusinessContext;
}
