import { SupabaseService } from '../supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    private get supabase();
    create(createProductDto: CreateProductDto): Promise<any>;
    findAll(shopId?: number): Promise<any[]>;
    findOne(id: number): Promise<any>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<any>;
    remove(id: number): Promise<any>;
    updateCategory(oldName: string, newName: string, shopId?: number): Promise<{
        count: number;
    }>;
    recordView(productId: number, shopId?: number): Promise<{
        success: boolean;
    }>;
    deleteCategory(name: string, shopId?: number): Promise<{
        count: number;
    }>;
}
