import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { data, error } = await supabase
            .from('customer_addresses')
            .select('*')
            .eq('profile_id', user.id)
            .order('is_default', { ascending: false })
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

        const body = await req.json();
        
        // If this is the first address or set as default, unset others
        if (body.is_default) {
            await supabase
                .from('customer_addresses')
                .update({ is_default: false })
                .eq('profile_id', user.id);
        }

        const { data, error } = await supabase
            .from('customer_addresses')
            .insert([{
                ...body,
                profile_id: user.id
            }])
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
