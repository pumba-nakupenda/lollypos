import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        // Fetch wishlist items with product details
        const { data, error } = await supabase
            .from('wishlist')
            .select(`
                id,
                product_id,
                created_at,
                products (*)
            `)
            .eq('profile_id', user.id)
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { product_id } = await req.json();

        // Check if item already exists
        const { data: existing } = await supabase
            .from('wishlist')
            .select('id')
            .eq('profile_id', user.id)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            // Remove it (Toggle behavior)
            const { error: deleteError } = await supabase
                .from('wishlist')
                .delete()
                .eq('id', existing.id);
            if (deleteError) throw deleteError;
            return NextResponse.json({ action: 'removed' });
        } else {
            // Add it
            const { error: insertError } = await supabase
                .from('wishlist')
                .insert([{
                    profile_id: user.id,
                    product_id
                }]);
            if (insertError) throw insertError;
            return NextResponse.json({ action: 'added' });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
