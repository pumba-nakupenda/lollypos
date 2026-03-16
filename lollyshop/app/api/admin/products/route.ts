import { createClient, createAdminClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        
        // Verifier admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user?.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Admin/Products] GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const supabaseAdmin = await createAdminClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user?.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

        const body = await req.json();
        const { id } = body;
        const ALLOWED_FIELDS = ['name', 'description', 'price', 'promo_price', 'cost_price', 'stock',
            'min_stock', 'category', 'brand', 'image', 'images', 'video_url', 'type',
            'show_on_pos', 'show_on_website', 'is_featured', 'expiry_date', 'variants', 'status'];
        const updates = Object.fromEntries(
            Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
        );

        const { error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin/Products] PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
