
'use client'

import React from 'react';
import { ShoppingCart, Heart, Search, Home, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAi } from '@/context/AiContext';
import Link from 'next/link';

export default function MobileNav() {
    const { cartCount, setIsCartOpen } = useCart();
    const { wishlist } = useWishlist();
    const { setIsAiOpen } = useAi();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const focusSearch = () => {
        const searchInput = document.querySelector('input[placeholder="Rechercher..."]') as HTMLInputElement;
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            scrollToTop();
        }
    };

    return (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[90%] max-w-sm pointer-events-none">
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-full p-2 px-6 flex items-center justify-between shadow-2xl pointer-events-auto">
                <Link href="/" onClick={scrollToTop} className="p-3 text-white hover:text-[#0055ff] transition-colors">
                    <Home className="w-5 h-5" />
                </Link>
                
                <button 
                    onClick={scrollToTop} // Wishlist page/anchor not ready, so scroll to top
                    className="p-3 text-white hover:text-[#0055ff] transition-colors relative"
                >
                    <Heart className="w-5 h-5" />
                    {wishlist.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border border-black" />
                    )}
                </button>

                <div className="relative -translate-y-4">
                    <button 
                        onClick={focusSearch}
                        className="w-14 h-14 bg-[#0055ff] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#0055ff]/40 border-4 border-black active:scale-90 transition-all"
                    >
                        <Search className="w-6 h-6" />
                    </button>
                </div>

                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="p-3 text-white hover:text-[#0055ff] transition-colors relative"
                >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute top-2 right-2 min-w-[14px] h-[14px] bg-white text-black text-[8px] font-black rounded-full flex items-center justify-center px-1 border border-black">
                            {cartCount}
                        </span>
                    )}
                </button>

                <button 
                    onClick={() => setIsAiOpen(true)}
                    className="p-3 text-[#0055ff] animate-pulse"
                >
                    <Sparkles className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
