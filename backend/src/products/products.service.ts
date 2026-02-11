
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    constructor(
        private readonly supabaseService: SupabaseService,
        @Inject(forwardRef(() => AiService))
        private readonly aiService: AiService,
    ) { }

    private get supabase() {
        return (this.supabaseService as any).getAdminClient();
    }

    async create(createProductDto: CreateProductDto) {
        this.logger.log(`[PRODUCTS] Creating "${createProductDto.name}" for shop ${createProductDto.shop_id}`);
        try {
            // Generate Embedding for RAG
            const embeddingText = `${createProductDto.name} ${createProductDto.description || ''} ${createProductDto.category || ''}`;
            const embedding = await this.aiService.generateEmbedding(embeddingText);

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
                    is_featured: createProductDto.is_featured || false,
                    embedding: embedding
                }])
                .select()
                .single();

            if (error) {
                this.logger.error(`[PRODUCTS] Insert FAILED: ${error.message} (${error.code})`);
                throw new Error(error.message);
            }

            this.logger.log(`[PRODUCTS] Success! ID: ${data.id}`);
            return data;
        } catch (err) {
            this.logger.error(`[PRODUCTS] Critical Failure: ${err.message}`);
            throw err;
        }
    }

    async findAll(shopId?: number) {
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

    async findOne(id: number) {
        const { data, error } = await this.supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        this.logger.log(`[PRODUCTS] Updating product ID: ${id}`);
        try {
            const updates: any = { ...updateProductDto };
            
            // Re-generate embedding if key info changed
            if (updateProductDto.name || updateProductDto.description || updateProductDto.category) {
                const current = await this.findOne(id);
                const embeddingText = `${updateProductDto.name || current.name} ${updateProductDto.description || current.description || ''} ${updateProductDto.category || current.category || ''}`;
                updates.embedding = await this.aiService.generateEmbedding(embeddingText);
            }

            const { data, error } = await this.supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                this.logger.error(`[PRODUCTS] Update FAILED: ${error.message}`);
                throw new Error(error.message);
            }

            this.logger.log(`[PRODUCTS] Update Success: ${data.id}`);
            return data;
        } catch (err) {
            this.logger.error(`[PRODUCTS] Critical Update Failure: ${err.message}`);
            throw err;
        }
    }

    async remove(id: number) {
        const { data, error } = await this.supabase
            .from('products')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateCategory(oldName: string, newName: string, shopId?: number) {
        this.logger.log(`[PRODUCTS] Renaming category from "${oldName}" to "${newName}"`);
        let query = this.supabase.from('products').update({ category: newName }).eq('category', oldName);
        if (shopId) query = query.eq('shop_id', shopId);
        
        const { data, error } = await query.select();
        if (error) throw new Error(error.message);
        return { count: data?.length || 0 };
    }

    async recordView(productId: number, shopId?: number) {
        this.logger.debug(`[TRACKING] Recording view for product ID: ${productId}`);
        const { error } = await this.supabase
            .from('product_views')
            .insert({
                product_id: productId,
                shop_id: shopId
            });
        if (error) this.logger.error(`[TRACKING] Failed: ${error.message}`);
        return { success: !error };
    }

    async deleteCategory(name: string, shopId?: number) {
        this.logger.log(`[PRODUCTS] Deleting category "${name}" (resetting to Général)`);
        let query = this.supabase.from('products').update({ category: 'Général' }).eq('category', name);
        if (shopId) query = query.eq('shop_id', shopId);

        const { data, error } = await query.select();
        if (error) throw new Error(error.message);
        return { count: data?.length || 0 };
    }
}
