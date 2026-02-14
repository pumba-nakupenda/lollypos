import { createClient } from '../../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        
        // Verify admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
        if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

        const resolvedParams = await params;
        const orderId = resolvedParams.id;

        const { data: order, error } = await supabase
            .from('sales')
            .select(`
                *,
                profiles:customer_id (
                    email,
                    full_name,
                    phone
                ),
                sale_items (
                    id,
                    quantity,
                    price,
                    products (name)
                )
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;
        return NextResponse.json(order);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
