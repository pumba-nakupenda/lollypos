import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class ExpensesService implements OnModuleInit {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

  async onModuleInit() {
    this.logger.log('[EXPENSES ROBOT] Initializing automation engine...');
    // Run initial check after 10 seconds, then every 6 hours
    setTimeout(() => this.processRecurringExpenses(), 10000);
    setInterval(() => this.processRecurringExpenses(), 1000 * 60 * 60 * 6);
  }

      private get supabase() {
          return (this.supabaseService as any).getAdminClient();
      }
  async processRecurringExpenses() {
    this.logger.log('[EXPENSES ROBOT] Checking for due recurring expenses...');
    try {
      // 1. Fetch all template recurring expenses
      const { data: recurringTemplates, error } = await this.supabase
        .from('expenses')
        .select('*')
        .eq('is_recurring', true);

      if (error) throw error;
      if (!recurringTemplates || recurringTemplates.length === 0) return;

      const now = new Date();

      for (const template of recurringTemplates) {
        const lastDate = template.last_automated_at ? new Date(template.last_automated_at) : new Date(template.date);
        let isDue = false;

        if (template.frequency === 'daily') {
          isDue = now.getTime() - lastDate.getTime() >= 24 * 60 * 60 * 1000;
        } else if (template.frequency === 'weekly') {
          isDue = now.getTime() - lastDate.getTime() >= 7 * 24 * 60 * 60 * 1000;
        } else if (template.frequency === 'monthly') {
          // Check if it's a different month
          isDue = now.getMonth() !== lastDate.getMonth() || now.getFullYear() !== lastDate.getFullYear();
        } else if (template.frequency === 'yearly') {
          isDue = now.getFullYear() !== lastDate.getFullYear();
        }

        if (isDue) {
          this.logger.log(`[EXPENSES ROBOT] Generating new entry for: ${template.description}`);
          
          // Create the new expense entry
          const { error: insertError } = await this.supabase
            .from('expenses')
            .insert({
              description: `${template.description} (Auto)`,
              amount: template.amount,
              category: template.category,
              date: now.toISOString(),
              shop_id: template.shop_id,
              is_recurring: false // The generated one is a fixed transaction
            });

          if (!insertError) {
            // Update the template to mark it as processed
            await this.supabase
              .from('expenses')
              .update({ last_automated_at: now.toISOString() })
              .eq('id', template.id);
          }
        }
      }
    } catch (err) {
      this.logger.error(`[EXPENSES ROBOT] Failure: ${err.message}`);
    }
  }

  async create(createExpenseDto: CreateExpenseDto) {
    this.logger.log(`[EXPENSES] Creating expense for shop ${createExpenseDto.shopId}: ${createExpenseDto.description}`);
    
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .insert({
          description: createExpenseDto.description,
          amount: createExpenseDto.amount,
          category: createExpenseDto.category,
          created_by: createExpenseDto.created_by,
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
    } catch (err) {
      this.logger.error(`[EXPENSES] Critical Failure: ${err.message}`);
      throw err;
    }
  }

  async findAll(shopId?: number, category?: string, includePersonal?: boolean) {
    let query = this.supabase
      .from('expenses')
      .select('*, profiles!expenses_created_by_fkey(email)')
      .order('date', { ascending: false });

    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    if (category) {
      query = query.eq('category', category);
    } else if (!includePersonal) {
      // Par défaut, on cache les dépenses Perso des listes classiques
      query = query.neq('category', 'Perso');
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: number, updateExpenseDto: Partial<CreateExpenseDto>) {
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

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: number) {
    this.logger.log(`[EXPENSES] Deleting expense ID: ${id}`);
    const { error } = await this.supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  // --- LOGIQUE DES CATÉGORIES ---
  async findAllCategories(shopId: number, isPersonal: boolean) {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_personal', isPersonal);
    if (error) throw error;
    return data;
  }

  async createCategory(name: string, shopId: number, isPersonal: boolean) {
    this.logger.log(`[CATEGORIES] Creating category: ${name} for shop ${shopId} (Personal: ${isPersonal})`);
    try {
      const { data, error } = await this.supabase
        .from('expense_categories')
        .insert({ name, shop_id: shopId, is_personal: isPersonal })
        .select()
        .single();
      
      if (error) {
        this.logger.error(`[CATEGORIES] Insert error: ${error.message}`);
        throw error;
      }
      
      this.logger.log(`[CATEGORIES] Success! Created ID: ${data.id}`);
      return data;
    } catch (err) {
      this.logger.error(`[CATEGORIES] Critical failure: ${err.message}`);
      throw err;
    }
  }

  async deleteCategory(id: number) {
    const { error } = await this.supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
}