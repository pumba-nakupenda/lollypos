import { createClient } from '../../../../utils/supabase/server';
import { NextResponse } from 'next/server';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_BUCKETS = ['products', 'events'];

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Vérifier admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role, is_super_admin').eq('id', user.id).single();
        if (profile?.role !== 'admin' && !profile?.is_super_admin) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const bucketName = formData.get('bucket') as string || 'products';

        if (!file) return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });

        // Validation du bucket
        if (!ALLOWED_BUCKETS.includes(bucketName)) {
            return NextResponse.json({ error: 'Bucket invalide' }, { status: 400 });
        }

        // Validation de la taille
        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'Fichier trop volumineux (max 5 MB)' }, { status: 400 });
        }

        // Validation du type MIME
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, AVIF, GIF' }, { status: 400 });
        }

        // Validation de l'extension
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
            return NextResponse.json({ error: 'Extension de fichier non autorisée' }, { status: 400 });
        }

        const folderPath = bucketName === 'events' ? 'banners' : '';
        const fileName = `${folderPath ? `${folderPath}/` : ''}${Date.now()}_${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
