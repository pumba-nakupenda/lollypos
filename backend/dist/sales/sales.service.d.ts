import { CreateSaleDto } from './dto/create-sale.dto';
import { SupabaseService } from '../supabase.service';
export declare class SalesService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    private get supabase();
    create(createSaleDto: CreateSaleDto): Promise<any>;
    findAll(shopId?: number): Promise<any[]>;
    getSaleItems(shopId?: number): Promise<{
        sale_id: any;
        quantity: any;
        price: any;
        products: {
            name: any;
            category: any;
            cost_price: any;
            shop_id: any;
        }[];
    }[]>;
    getSaleItemsBySaleId(saleId: string): Promise<{
        quantity: any;
        price: any;
        description: any;
        products: {
            name: any;
        }[];
    }[]>;
    findOne(id: number): string;
    update(id: string, updateSaleDto: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
