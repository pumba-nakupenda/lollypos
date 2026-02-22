import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get('shopId');

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user?.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        let query = supabase
            .from('products')
            .select('category', { distinct: true })
            .neq('show_on_website', false);

        if (shopId && shopId !== 'all') {
            query = query.eq('shop_id', shopId);
        }

        const { data, error } = await query;

        if (error) throw error;

        const categories = data.map((item: any) => item.category).filter(Boolean).sort();

        return NextResponse.json(categories);
    } catch (error: any) {
        console.error("API Categories Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
