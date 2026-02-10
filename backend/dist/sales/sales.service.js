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
var SalesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase.service");
let SalesService = SalesService_1 = class SalesService {
    supabaseService;
    logger = new common_1.Logger(SalesService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    get supabase() {
        return this.supabaseService.getClient();
    }
    async create(createSaleDto) {
        this.logger.log(`[SALES] Starting creation for shop ${createSaleDto.shopId}, amount ${createSaleDto.totalAmount}`);
        try {
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .insert({
                total_amount: createSaleDto.totalAmount,
                payment_method: createSaleDto.paymentMethod,
                shop_id: createSaleDto.shopId,
                customer_name: createSaleDto.customer_name,
                with_tva: createSaleDto.with_tva ?? true,
                type: createSaleDto.type || 'invoice',
                paid_amount: createSaleDto.paid_amount || 0,
                linked_doc_number: createSaleDto.linked_doc_number
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
                description: item.productId === 0 ? item.name : undefined
            }));
            const { error: itemsError } = await this.supabase
                .from('sale_items')
                .insert(saleItems);
            if (itemsError) {
                this.logger.error(`[SALES] Items insert FAILED: ${JSON.stringify(itemsError)}`);
                throw new Error(`Erreur Items: ${itemsError.message} (Code: ${itemsError.code})`);
            }
            for (const item of createSaleDto.items) {
                if (!item.productId || item.productId === 0)
                    continue;
                this.logger.debug(`[SALES] Updating stock for PID ${item.productId}: -${item.quantity}`);
                const { error: rpcError } = await this.supabase.rpc('decrement_stock', {
                    p_id: item.productId,
                    p_qty: item.quantity
                });
                if (rpcError) {
                    this.logger.warn(`[SALES] Stock RPC Error for PID ${item.productId}: ${rpcError.message}`);
                }
            }
            return sale;
        }
        catch (err) {
            this.logger.error(`[SALES] Critical Failure: ${err.message}`);
            throw err;
        }
    }
    async findAll(shopId) {
        let query = this.supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });
        if (shopId) {
            query = query.eq('shop_id', shopId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getSaleItems(shopId) {
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
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getSaleItemsBySaleId(saleId) {
        const { data, error } = await this.supabase
            .from('sale_items')
            .select(`
                quantity,
                price,
                description,
                products (
                    name
                )
            `)
            .eq('sale_id', saleId);
        if (error)
            throw new Error(error.message);
        return data;
    }
    findOne(id) {
        return `This action returns a #${id} sale`;
    }
    async update(id, updateSaleDto) {
        this.logger.log(`[SALES] Updating sale ID: ${id}`);
        try {
            const { data: sale, error: saleError } = await this.supabase
                .from('sales')
                .update({
                total_amount: updateSaleDto.totalAmount,
                customer_name: updateSaleDto.customer_name,
                with_tva: updateSaleDto.with_tva,
                type: updateSaleDto.type,
                payment_method: updateSaleDto.paymentMethod,
                paid_amount: updateSaleDto.paid_amount,
                linked_doc_number: updateSaleDto.linked_doc_number
            })
                .eq('id', id)
                .select('*')
                .single();
            if (saleError)
                throw new Error(`Update Sales Error: ${saleError.message}`);
            const { error: deleteError } = await this.supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', id);
            if (deleteError)
                throw new Error(`Delete Items Error: ${deleteError.message}`);
            const saleItems = updateSaleDto.items.map(item => ({
                sale_id: id,
                product_id: item.productId === 0 ? null : item.productId,
                quantity: item.quantity,
                price: item.price,
                description: item.productId === 0 ? item.name : undefined
            }));
            const { error: itemsError } = await this.supabase
                .from('sale_items')
                .insert(saleItems);
            if (itemsError)
                throw new Error(`Insert Items Error: ${itemsError.message}`);
            return sale;
        }
        catch (err) {
            this.logger.error(`[SALES] Update Failure: ${err.message}`);
            throw err;
        }
    }
    async remove(id) {
        this.logger.log(`[SALES] Deleting sale ID: ${id}`);
        const { error } = await this.supabase
            .from('sales')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
        return { success: true };
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = SalesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], SalesService);
//# sourceMappingURL=sales.service.js.map