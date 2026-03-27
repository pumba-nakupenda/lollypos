import { Injectable, Logger } from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class SalesService {
    private readonly logger = new Logger(SalesService.name);

    constructor(private readonly supabaseService: SupabaseService) { }

    private get supabase() {
        return (this.supabaseService as any).getAdminClient();
    }

    async create(createSaleDto: CreateSaleDto) {
        this.logger.log(`[SALES] Starting creation for shop ${createSaleDto.shopId}, amount ${createSaleDto.totalAmount}`);

        try {
            // 1. Insert the main sale
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .insert({
                    total_amount: createSaleDto.totalAmount,
                    payment_method: createSaleDto.paymentMethod || 'cash',
                    shop_id: createSaleDto.shopId,
                    customer_name: createSaleDto.customer_name,
                    customer_id: createSaleDto.customer_id,
                    created_by: createSaleDto.created_by,
                    with_tva: createSaleDto.with_tva ?? true,
                    type: createSaleDto.type || 'invoice',
                    status: createSaleDto.status || 'completed',
                    paid_amount: createSaleDto.paid_amount || 0,
                    invoice_number: createSaleDto.invoice_number,
                    parent_id: createSaleDto.parent_id,
                    project_id: createSaleDto.project_id,
                    created_at: createSaleDto.created_at
                })
                .select('*')
                .single();

            if (saleError) {
                this.logger.error(`[SALES] Main insert FAILED: ${JSON.stringify(saleError)}`);
                throw new Error(`Erreur Sales: ${saleError.message} (Code: ${saleError.code})`);
            }

            this.logger.log(`[SALES] Master record created: ${sale.id}`);

            const saleItems = createSaleDto.items.map(item => ({
                sale_id: sale.id,
                product_id: item.productId === 0 ? null : item.productId,
                quantity: item.quantity,
                price: item.price,
                variant_id: item.variantId || null,
                description: item.productId === 0 ? item.name : undefined
            }));

            const { error: itemsError } = await this.supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) {
                this.logger.error(`[SALES] Items insert FAILED: ${JSON.stringify(itemsError)}`);
                throw new Error(`Erreur Items: ${itemsError.message} (Code: ${itemsError.code})`);
            }

            return sale;
        } catch (err) {
            this.logger.error(`[SALES] Critical Failure: ${err.message}`);
            throw err;
        }
    }

    async findAll(shopId?: number) {
        let query = this.supabase
            .from('sales')
            .select('*, profiles!sales_created_by_fkey(email, role)')
            .order('created_at', { ascending: false });

        if (shopId) {
            query = query.eq('shop_id', shopId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
    }

    async getSaleItems(shopId?: number) {
        let query = this.supabase
            .from('sale_items')
            .select(`
                sale_id,
                quantity,
                price,
                products!inner (
                    name,
                    category,
                    cost_price,
                    shop_id
                )
            `);

        if (shopId) {
            query = query.eq('products.shop_id', shopId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data;
    }

    async getSaleItemsBySaleId(saleId: string) {
        const { data, error } = await this.supabase
            .from('sale_items')
            .select(`
                quantity,
                price,
                description,
                variant_id,
                products (
                    name
                )
            `)
            .eq('sale_id', saleId);

        if (error) throw new Error(error.message);
        return data;
    }

    async findOne(id: number) {
        const { data, error } = await this.supabase
            .from('sales')
            .select('*, sale_items(quantity, price, description, variant_id, products(name))')
            .eq('id', id)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async update(id: string, updateSaleDto: any) {
        this.logger.log(`[SALES] Updating sale ID: ${id}`);

        try {
            // 1. Update master record
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .update({
                    total_amount: updateSaleDto.totalAmount,
                    customer_name: updateSaleDto.customer_name,
                    with_tva: updateSaleDto.with_tva,
                    type: updateSaleDto.type,
                    payment_method: updateSaleDto.paymentMethod,
                    paid_amount: updateSaleDto.paid_amount,
                    linked_doc_number: updateSaleDto.linked_doc_number,
                    project_id: updateSaleDto.project_id,
                    created_at: updateSaleDto.created_at
                })
                .eq('id', id)
                .select('*')
                .single();

            if (saleError) throw new Error(`Update Sales Error: ${saleError.message}`);

            // 2. Delete old items
            const { error: deleteError } = await this.supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', id);

            if (deleteError) throw new Error(`Delete Items Error: ${deleteError.message}`);

            const saleItems = updateSaleDto.items.map(item => ({
                sale_id: id,
                product_id: item.productId === 0 ? null : item.productId,
                quantity: item.quantity,
                price: item.price,
                variant_id: item.variantId || null,
                description: item.productId === 0 ? item.name : undefined
            }));

            const { error: itemsError } = await this.supabase
                .from('sale_items')
                .insert(saleItems);

            if (itemsError) throw new Error(`Insert Items Error: ${itemsError.message}`);

            return sale;
        } catch (err) {
            this.logger.error(`[SALES] Update Failure: ${err.message}`);
            throw err;
        }
    }

    async remove(id: string) {
        this.logger.log(`[SALES] Deleting sale ID: ${id}`);
        const { error } = await this.supabase
            .from('sales')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return { success: true };
    }

    async cancel(id: string, shopId?: number) {
        this.logger.log(`[SALES] Cancelling sale ID: ${id}`);
        try {
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .select('shop_id, status')
                .eq('id', id)
                .single();

            if (saleError) throw new Error(`Fetch Sale Error: ${saleError.message}`);
            if (sale.status === 'cancelled') throw new Error('Sale already cancelled');
            const actualShopId = shopId || sale.shop_id;

            const { data: items, error: itemsError } = await this.supabase
                .from('sale_items')
                .select('product_id, quantity, variant_id')
                .eq('sale_id', id);

            if (itemsError) throw new Error(`Fetch Items Error: ${itemsError.message}`);

            const { error: updateError } = await this.supabase
                .from('sales')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (updateError) throw new Error(`Update Status Error: ${updateError.message}`);

            return { success: true };
        } catch (err) {
            this.logger.error(`[SALES] Cancel Failure: ${err.message}`);
            throw err;
        }
    }
}