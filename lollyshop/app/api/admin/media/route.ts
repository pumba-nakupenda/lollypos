import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        
        // Verifier admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user?.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { data: files, error } = await supabase.storage
            .from('products')
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) throw error;

        // Add public URLs to each file
        const filesWithUrls = files.map(file => {
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(file.name);
            return { ...file, url: publicUrl };
        });

        return NextResponse.json(filesWithUrls);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { fileName } = await req.json();

        // Verifier admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user?.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const { error } = await supabase.storage
            .from('products')
            .remove([fileName]);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
