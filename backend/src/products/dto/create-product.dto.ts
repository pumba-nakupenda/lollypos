export class CreateProductDto {
    name: string;
    description?: string;
    price: number;
    cost_price?: number;
    promo_price?: number;
    stock: number;
    min_stock?: number;
    category?: string;
    brand?: string;
    shop_id: number;
    created_by?: string;
    variants?: any[];
    image?: string;
    images?: string[];
    video_url?: string;
    expiry_date?: string; // ISO date string
    type?: 'product' | 'service';
    show_on_pos?: boolean;
    show_on_website?: boolean;
    is_featured?: boolean;
}