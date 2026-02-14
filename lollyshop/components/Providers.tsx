
'use client'

import React from 'react';
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ProductProvider } from "@/context/ProductContext";
import { AiProvider } from "@/context/AiContext";
import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <UserProvider>
                <CartProvider>
                    <WishlistProvider>
                        <ProductProvider>
                            <AiProvider>
                                {children}
                            </AiProvider>
                        </ProductProvider>
                    </WishlistProvider>
                </CartProvider>
            </UserProvider>
        </ToastProvider>
    );
}
