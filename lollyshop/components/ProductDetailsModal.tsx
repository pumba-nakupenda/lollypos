import React from 'react';
import { useProducts } from '@/context/ProductContext';
import ProductDisplay from './ProductDisplay';

interface ProductDetailsModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
    const { getRelatedProducts } = useProducts();

    if (!isOpen) return null;

    const related = getRelatedProducts(product.id, product.category);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <ProductDisplay
                    product={product}
                    related={related}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}