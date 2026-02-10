export declare class CreateExpenseDto {
    description: string;
    amount: number;
    category: string;
    date?: Date;
    shopId?: number;
    is_recurring?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
