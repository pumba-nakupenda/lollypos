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
var ExpensesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase.service");
let ExpensesService = ExpensesService_1 = class ExpensesService {
    supabaseService;
    logger = new common_1.Logger(ExpensesService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async onModuleInit() {
        this.logger.log('[EXPENSES ROBOT] Initializing automation engine...');
        setTimeout(() => this.processRecurringExpenses(), 10000);
        setInterval(() => this.processRecurringExpenses(), 1000 * 60 * 60 * 6);
    }
    get supabase() {
        return this.supabaseService.getClient();
    }
    async processRecurringExpenses() {
        this.logger.log('[EXPENSES ROBOT] Checking for due recurring expenses...');
        try {
            const { data: recurringTemplates, error } = await this.supabase
                .from('expenses')
                .select('*')
                .eq('is_recurring', true);
            if (error)
                throw error;
            if (!recurringTemplates || recurringTemplates.length === 0)
                return;
            const now = new Date();
            for (const template of recurringTemplates) {
                const lastDate = template.last_automated_at ? new Date(template.last_automated_at) : new Date(template.date);
                let isDue = false;
                if (template.frequency === 'daily') {
                    isDue = now.getTime() - lastDate.getTime() >= 24 * 60 * 60 * 1000;
                }
                else if (template.frequency === 'weekly') {
                    isDue = now.getTime() - lastDate.getTime() >= 7 * 24 * 60 * 60 * 1000;
                }
                else if (template.frequency === 'monthly') {
                    isDue = now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear();
                }
                else if (template.frequency === 'yearly') {
                    isDue = now.getFullYear() !== lastDate.getFullYear();
                }
                if (isDue) {
                    this.logger.log(`[EXPENSES ROBOT] Generating new entry for: ${template.description}`);
                    const { error: insertError } = await this.supabase
                        .from('expenses')
                        .insert({
                        description: `${template.description} (Auto)`,
                        amount: template.amount,
                        category: template.category,
                        date: now.toISOString(),
                        shop_id: template.shop_id,
                        is_recurring: false
                    });
                    if (!insertError) {
                        await this.supabase
                            .from('expenses')
                            .update({ last_automated_at: now.toISOString() })
                            .eq('id', template.id);
                    }
                }
            }
        }
        catch (err) {
            this.logger.error(`[EXPENSES ROBOT] Failure: ${err.message}`);
        }
    }
    async create(createExpenseDto) {
        this.logger.log(`[EXPENSES] Creating expense for shop ${createExpenseDto.shopId}: ${createExpenseDto.description}`);
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .insert({
                description: createExpenseDto.description,
                amount: createExpenseDto.amount,
                category: createExpenseDto.category,
                date: createExpenseDto.date || new Date().toISOString(),
                shop_id: createExpenseDto.shopId,
                is_recurring: createExpenseDto.is_recurring || false,
                frequency: createExpenseDto.frequency || null,
                last_automated_at: createExpenseDto.is_recurring ? new Date().toISOString() : null
            })
                .select()
                .single();
            if (error) {
                this.logger.error(`[EXPENSES] Insert FAILED: ${error.message} (${error.code})`);
                throw new Error(`DB Error: ${error.message}`);
            }
            this.logger.log(`[EXPENSES] Success! ID: ${data.id}`);
            return data;
        }
        catch (err) {
            this.logger.error(`[EXPENSES] Critical Failure: ${err.message}`);
            throw err;
        }
    }
    async findAll(shopId) {
        let query = this.supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        if (shopId) {
            query = query.eq('shop_id', shopId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        return data;
    }
    async update(id, updateExpenseDto) {
        this.logger.log(`[EXPENSES] Updating expense ID: ${id}`);
        const { data, error } = await this.supabase
            .from('expenses')
            .update({
            description: updateExpenseDto.description,
            amount: updateExpenseDto.amount,
            category: updateExpenseDto.category,
            date: updateExpenseDto.date,
            is_recurring: updateExpenseDto.is_recurring,
            frequency: updateExpenseDto.frequency,
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async remove(id) {
        this.logger.log(`[EXPENSES] Deleting expense ID: ${id}`);
        const { error } = await this.supabase
            .from('expenses')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        return { success: true };
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = ExpensesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ExpensesService);
//# sourceMappingURL=expenses.service.js.map