import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(createSaleDto: CreateSaleDto): Promise<any>;
    update(id: string, updateSaleDto: any): Promise<any>;
    findAll(shopId?: string): Promise<any[]>;
    findItems(shopId?: string): Promise<{
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
    findSaleItems(id: string): Promise<{
        quantity: any;
        price: any;
        description: any;
        products: {
            name: any;
        }[];
    }[]>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
