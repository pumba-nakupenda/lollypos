import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('site_settings')
            .select('content')
            .eq('name', 'lolly_shop_config')
            .single();

        if (error) throw error;
        return NextResponse.json(data.content);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        
        // Verifier que l'utilisateur est admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
        
        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const newContent = await req.json();

        const { error } = await supabase
            .from('site_settings')
            .update({ content: newContent, updated_at: new Date().toISOString() })
            .eq('name', 'lolly_shop_config');

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
