import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { items, customer_info, total_amount, shipping_cost, shipping_method, coupon_id } = body;

        // 1. Get user ID if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Create the Sale record
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert([{
                customer_id: user?.id || null,
                total_amount,
                shipping_cost,
                shipping_method,
                coupon_id,
                status: 'pending',
                payment_method: 'cash', // Default for web orders
                // Optional: store guest info in a metadata or separate field if needed
                // But for now we rely on the customer_id link or the WhatsApp message details
            }])
            .select()
            .single();

        if (saleError) throw saleError;

        // 3. Create the Sale Items
        const saleItems = items.map((item: any) => ({
            sale_id: sale.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItems);

        if (itemsError) throw itemsError;

        // 4. DECREMENT STOCK for each physical product
        for (const item of items) {
            // Only decrement if it's not a service
            if (item.type !== 'service') {
                await supabase.rpc('decrement_stock', { 
                    product_id: item.id, 
                    quantity: item.quantity 
                });
            }
        }

        // 5. Update coupon usage if applicable
        if (coupon_id) {
            await supabase.rpc('increment_coupon_usage', { coupon_uuid: coupon_id });
        }

        return NextResponse.json({ success: true, order_id: sale.id });

    } catch (error: any) {
        console.error("Order creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
