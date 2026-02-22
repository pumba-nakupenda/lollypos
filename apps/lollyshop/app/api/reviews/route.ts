import { createClient } from '../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('product_id');

        if (!productId) return NextResponse.json({ error: 'ID produit manquant' }, { status: 400 });

        const { data, error } = await supabase
            .from('product_reviews')
            .select(`
                *,
                profiles:profile_id (full_name)
            `)
            .eq('product_id', productId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        
        // Verify user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Veuillez vous connecter pour laisser un avis' }, { status: 401 });

        const body = await req.json();
        
        // Check if user already reviewed this product
        const { data: existing } = await supabase
            .from('product_reviews')
            .select('id')
            .eq('product_id', body.product_id)
            .eq('profile_id', user.id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Vous avez déjà laissé un avis pour ce produit' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('product_reviews')
            .insert([{
                ...body,
                profile_id: user.id,
                status: 'pending' // New reviews are always pending
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
