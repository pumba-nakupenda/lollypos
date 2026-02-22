
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProductContextType {
    products: any[];
    setProducts: (products: any[]) => void;
    getRelatedProducts: (productId: number, category: string, limit?: number) => any[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
    const [products, setProducts] = useState<any[]>([]);

    const getRelatedProducts = (productId: number, category: string, limit: number = 4) => {
        return products
            .filter(p => p.category === category && p.id !== productId)
            .slice(0, limit);
    };

    return (
        <ProductContext.Provider value={{ products, setProducts, getRelatedProducts }}>
            {children}
        </ProductContext.Provider>
    );
}

export function useProducts() {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
}
