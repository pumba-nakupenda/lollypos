'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';
import { useUser } from './UserContext';

interface WishlistContextType {
    wishlist: Product[];
    toggleWishlist: (product: Product) => Promise<void>;
    isInWishlist: (productId: number) => boolean;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('lollyshop-wishlist');
        if (saved) {
            try {
                setWishlist(JSON.parse(saved));
            } catch (e) {}
        }
    }, []);

    // Sync with DB if user is logged in
    useEffect(() => {
        if (user) {
            fetchWishlistFromDb();
        }
    }, [user]);

    const fetchWishlistFromDb = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/wishlist');
            const data = await res.json();
            if (Array.isArray(data)) {
                // Extract products from the joined query
                const products = data.map(item => item.products).filter(Boolean);
                setWishlist(products);
                localStorage.setItem('lollyshop-wishlist', JSON.stringify(products));
            }
        } catch (error) {
            console.error("Wishlist sync error:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (product: Product) => {
        // Optimistic UI Update
        const exists = wishlist.some((item) => item.id === product.id);
        const newWishlist = exists 
            ? wishlist.filter((item) => item.id !== product.id)
            : [...wishlist, product];
        
        setWishlist(newWishlist);
        localStorage.setItem('lollyshop-wishlist', JSON.stringify(newWishlist));

        // Sync with DB if logged in
        if (user) {
            try {
                const res = await fetch('/api/user/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: product.id })
                });
                
                if (!res.ok) {
                    // Revert if API fails
                    fetchWishlistFromDb();
                }
            } catch (error) {
                console.error("Wishlist API error:", error);
                fetchWishlistFromDb();
            }
        }
    };

    const isInWishlist = (productId: number) => {
        return wishlist.some((item) => item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading }}>
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
