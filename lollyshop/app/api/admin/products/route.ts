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

        const { id, ...updates } = await req.json();

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
