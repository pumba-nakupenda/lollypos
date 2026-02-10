import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductsController {
    private readonly productsService;
    private readonly logger;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): Promise<any>;
    findAll(shopId?: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<any>;
    remove(id: string): Promise<any>;
    renameCategory(oldName: string, newName: string, shopId?: string): Promise<{
        count: number;
    }>;
    deleteCategory(name: string, shopId?: string): Promise<{
        count: number;
    }>;
    recordView(id: string, shopId?: number): Promise<{
        success: boolean;
    }>;
}
