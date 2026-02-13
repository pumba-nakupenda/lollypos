'use client'

import React from 'react';
import { Home, ShoppingBag, User, Sparkles, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function MobileNav() {
    const { cartCount, setIsCartOpen } = useCart();

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white/90 backdrop-blur-xl border-t border-black/5 px-6 py-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <Link href="/" className="flex flex-col items-center space-y-1 group">
                    <Home className="w-5 h-5 text-black group-active:scale-90 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-active:text-black">Accueil</span>
                </Link>
                
                <Link href="/?shop=1" className="flex flex-col items-center space-y-1 group">
                    <div className="w-2 h-2 rounded-full bg-red-600 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-active:text-black">Luxya</span>
                </Link>

                <div className="relative -mt-8">
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-14 h-14 bg-[#febd69] text-[#131921] rounded-full flex items-center justify-center shadow-2xl border-4 border-white active:scale-90 transition-transform"
                    >
                        <ShoppingCart className="w-6 h-6 stroke-[3px]" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>

                <Link href="/?shop=2" className="flex flex-col items-center space-y-1 group">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-active:text-black">Homtek</span>
                </Link>

                <Link href="/?sort=best" className="flex flex-col items-center space-y-1 group">
                    <Sparkles className="w-5 h-5 text-[#febd69] group-active:scale-90 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-active:text-black">Best</span>
                </Link>
            </div>
        </div>
    );
}
