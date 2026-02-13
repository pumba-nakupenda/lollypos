
export class CreateExpenseDto {
    description: string;
    amount: number;
    category: string;
    created_by?: string;
    date?: Date;
    shopId?: number;
    is_recurring?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
