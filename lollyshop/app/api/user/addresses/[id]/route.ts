import { createClient } from '../../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        const { error } = await supabase
            .from('customer_addresses')
            .delete()
            .eq('id', id)
            .eq('profile_id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

        // Set all addresses to non-default first
        await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('profile_id', user.id);

        // Set this one as default
        const { error } = await supabase
            .from('customer_addresses')
            .update({ is_default: true })
            .eq('id', id)
            .eq('profile_id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
