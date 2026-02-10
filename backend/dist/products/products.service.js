"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase.service");
let ProductsService = ProductsService_1 = class ProductsService {
    supabaseService;
    logger = new common_1.Logger(ProductsService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    get supabase() {
        return this.supabaseService.getClient();
    }
    async create(createProductDto) {
        this.logger.log(`[PRODUCTS] Creating "${createProductDto.name}" for shop ${createProductDto.shop_id}`);
        try {
            const { data, error } = await this.supabase
                .from('products')
                .insert([{
                    name: createProductDto.name,
                    description: createProductDto.description,
                    price: createProductDto.price,
                    cost_price: createProductDto.cost_price,
                    promo_price: createProductDto.promo_price,
                    stock: createProductDto.stock,
                    min_stock: createProductDto.min_stock || 2,
                    category: createProductDto.category,
                    shop_id: createProductDto.shop_id,
                    image: createProductDto.image,
                    images: createProductDto.images || [],
                    video_url: createProductDto.video_url,
                    expiry_date: createProductDto.expiry_date,
                    type: createProductDto.type || 'product',
                    show_on_pos: createProductDto.show_on_pos !== false,
                    show_on_website: createProductDto.show_on_website !== false,
                    is_featured: createProductDto.is_featured || false
                }])
                .select()
                .single();
            if (error) {
                this.logger.error(`[PRODUCTS] Insert FAILED: ${error.message} (${error.code})`);
                throw new Error(error.message);
            }
            this.logger.log(`[PRODUCTS] Success! ID: ${data.id}`);
            return data;
        }
        catch (err) {
            this.logger.error(`[PRODUCTS] Critical Failure: ${err.message}`);
            throw err;
        }
    }
    async findAll(shopId) {
        this.logger.debug(`[PRODUCTS] Fetching list for shop: ${shopId || 'ALL'}`);
        let query = this.supabase.from('products').select('*');
        if (shopId) {
            query = query.eq('shop_id', shopId);
        }
        const { data, error } = await query.order('name');
        if (error) {
            this.logger.error(`[PRODUCTS] Fetch FAILED: ${error.message}`);
            throw new Error(error.message);
        }
        return data;
    }
    async findOne(id) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async update(id, updateProductDto) {
        this.logger.log(`[PRODUCTS] Updating product ID: ${id}`);
        try {
            const { data, error } = await this.supabase
                .from('products')
                .update({
                name: updateProductDto.name,
                description: updateProductDto.description,
                price: updateProductDto.price,
                cost_price: updateProductDto.cost_price,
                promo_price: updateProductDto.promo_price,
                stock: updateProductDto.stock,
                min_stock: updateProductDto.min_stock,
                category: updateProductDto.category,
                image: updateProductDto.image,
                images: updateProductDto.images,
                video_url: updateProductDto.video_url,
                expiry_date: updateProductDto.expiry_date,
                type: updateProductDto.type,
                show_on_pos: updateProductDto.show_on_pos,
                show_on_website: updateProductDto.show_on_website,
                is_featured: updateProductDto.is_featured
            })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                this.logger.error(`[PRODUCTS] Update FAILED: ${error.message}`);
                throw new Error(error.message);
            }
            this.logger.log(`[PRODUCTS] Update Success: ${data.id}`);
            return data;
        }
        catch (err) {
            this.logger.error(`[PRODUCTS] Critical Update Failure: ${err.message}`);
            throw err;
        }
    }
    async remove(id) {
        const { data, error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async updateCategory(oldName, newName, shopId) {
        this.logger.log(`[PRODUCTS] Renaming category from "${oldName}" to "${newName}"`);
        let query = this.supabase.from('products').update({ category: newName }).eq('category', oldName);
        if (shopId)
            query = query.eq('shop_id', shopId);
        const { data, error } = await query.select();
        if (error)
            throw new Error(error.message);
        return { count: data?.length || 0 };
    }
    async recordView(productId, shopId) {
        this.logger.debug(`[TRACKING] Recording view for product ID: ${productId}`);
        const { error } = await this.supabase
            .from('product_views')
            .insert({
            product_id: productId,
            shop_id: shopId
        });
        if (error)
            this.logger.error(`[TRACKING] Failed: ${error.message}`);
        return { success: !error };
    }
    async deleteCategory(name, shopId) {
        this.logger.log(`[PRODUCTS] Deleting category "${name}" (resetting to Général)`);
        let query = this.supabase.from('products').update({ category: 'Général' }).eq('category', name);
        if (shopId)
            query = query.eq('shop_id', shopId);
        const { data, error } = await query.select();
        if (error)
            throw new Error(error.message);
        return { count: data?.length || 0 };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ProductsService);
//# sourceMappingURL=products.service.js.map