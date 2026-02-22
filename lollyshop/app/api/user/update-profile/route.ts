import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { full_name, phone } = await req.json();

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name,
                phone,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[UpdateProfile] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
