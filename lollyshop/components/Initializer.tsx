
'use client'

import { useEffect } from 'react';
import { useProducts } from '@/context/ProductContext';

export default function Initializer({ products }: { products: any[] }) {
    const { setProducts } = useProducts();

    useEffect(() => {
        setProducts(products);
    }, [products, setProducts]);

    return null;
}
