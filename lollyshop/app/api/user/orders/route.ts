import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        // Fetch sales with items and product details
        const { data, error } = await supabase
            .from('sales')
            .select(`
                id,
                total_amount,
                payment_method,
                status,
                created_at,
                sale_items (
                    id,
                    quantity,
                    price,
                    products (
                        name,
                        image
                    )
                )
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
