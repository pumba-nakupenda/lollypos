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

// 2. PAGE CONTENT
import Navbar from '@/components/Navbar';
import ProductDisplay from '@/components/ProductDisplay';

export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch product details
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-center flex-col items-center justify-center p-10">
                    <h1 className="text-2xl font-black uppercase mb-4">Produit non trouvé</h1>
                    <a href="/" className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-xs">Retour à l'accueil</a>
                </div>
            </div>
        );
    }

    // Fetch related products (same category)
    const { data: related } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', product.id)
        .limit(4);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-1">
                <ProductDisplay product={product} related={related || []} isPage={true} />
            </main>
        </div>
    );
}
