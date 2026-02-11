
'use client'

import React from 'react';
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ProductProvider } from "@/context/ProductContext";
import { AiProvider } from "@/context/AiContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            <WishlistProvider>
                <ProductProvider>
                    <AiProvider>
                        {children}
                    </AiProvider>
                </ProductProvider>
            </WishlistProvider>
        </CartProvider>
    );
}
