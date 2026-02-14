import { createClient } from '@/utils/supabase/server';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

// 1. GENERATE DYNAMIC METADATA (For WhatsApp, Google, Facebook)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (!product) {
        return { title: 'Produit non trouvé - Lollyshop' };
    }

    const title = `${product.name} - Lollyshop Dakar`;
    const description = product.description || `Découvrez ${product.name} chez Lolly. Qualité premium et livraison rapide au Sénégal.`;
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: product.image ? [product.image] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: product.image ? [product.image] : [],
        },
    };
}

// 2. PAGE CONTENT (Redirects to Home with the product ID in URL to open modal)
export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    
    // Redirect to home page with a query param that will trigger the product modal
    // Example: lollyshop.sn/?openProduct=123
    redirect(`/?openProduct=${id}`);
}
