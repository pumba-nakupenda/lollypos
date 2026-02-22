
'use client'

import { useEffect } from 'react';
import { useProducts } from '@/context/ProductContext';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Initializer({ products }: { products: any[] }) {
    const { setProducts } = useProducts();
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        setProducts(products);

        const openId = searchParams.get('openProduct');
        if (openId) {
            router.push(`/product/${openId}`);
        }
    }, [products, setProducts, searchParams, router]);

    return null;
}
