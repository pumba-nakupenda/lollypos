
'use client'

import { useEffect, useState } from 'react';
import { useProducts } from '@/context/ProductContext';
import ProductDetailsModal from './ProductDetailsModal';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Initializer({ products }: { products: any[] }) {
    const { setProducts } = useProducts();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [autoOpenProduct, setAutoOpenProduct] = useState<any>(null);

    useEffect(() => {
        setProducts(products);
        
        const openId = searchParams.get('openProduct');
        if (openId) {
            const product = products.find(p => p.id.toString() === openId);
            if (product) setAutoOpenProduct(product);
        }
    }, [products, setProducts, searchParams]);

    const handleClose = () => {
        setAutoOpenProduct(null);
        // Clean up URL without refreshing
        const params = new URLSearchParams(searchParams.toString());
        params.delete('openProduct');
        router.replace(`/?${params.toString()}`, { scroll: false });
    };

    return (
        <>
            {autoOpenProduct && (
                <ProductDetailsModal 
                    product={autoOpenProduct} 
                    isOpen={true} 
                    onClose={handleClose} 
                />
            )}
        </>
    );
}
