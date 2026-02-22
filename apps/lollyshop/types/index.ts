
export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    promo_price?: number;
    image?: string;
    images?: string[];
    video_url?: string;
    category?: string;
    stock?: number;
    rating?: number;
    shop_id?: number;
    type?: 'product' | 'service';
}
