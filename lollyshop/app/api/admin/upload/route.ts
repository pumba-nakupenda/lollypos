import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        
        // Verifier admin
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user?.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bucketName = formData.get('bucket') as string || 'products'; // Default to 'products'

        if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

        const fileExt = file.name.split('.').pop();
        // For event images, store in a 'banners' folder, otherwise 'products' root
        const folderPath = bucketName === 'events' ? 'banners' : ''; 
        const fileName = `${folderPath ? `${folderPath}/` : ''}${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
