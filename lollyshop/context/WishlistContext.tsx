
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

interface WishlistContextType {
    wishlist: Product[];
    toggleWishlist: (product: Product) => void;
    isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [wishlist, setWishlist] = useState<Product[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('lollyshop-wishlist');
        if (saved) {
            try {
                setWishlist(JSON.parse(saved));
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('lollyshop-wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (product: Product) => {
        setWishlist((prev) => {
            const exists = prev.find((item) => item.id === product.id);
            if (exists) {
                return prev.filter((item) => item.id !== product.id);
            }
            return [...prev, product];
        });
    };

    const isInWishlist = (productId: number) => {
        return wishlist.some((item) => item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
