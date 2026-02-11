'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, User, MapPin, ChevronDown, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';
import { useRouter, useSearchParams } from 'next/navigation';

interface NavbarProps {
    settings?: any
}

export default function Navbar({ settings }: NavbarProps) {
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('q', searchQuery);
        else params.delete('q');
        router.push(`/?${params.toString()}`);
    };

    return (
        <>
            {/* Top Minimal Bar */}
            <div className="bg-black text-white text-[9px] font-black uppercase tracking-[0.3em] py-2 px-6 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center text-[#0055ff]"><MapPin className="w-3 h-3 mr-1" /> Dakar, Sénégal</span>
                    <span className="hidden sm:inline opacity-50">Livraison Express en 24h</span>
                </div>
                <div className="flex items-center space-x-6">
                    <Link href="#" className="hover:text-[#0055ff] transition-colors">Vendre</Link>
                    <Link href="#" className="hover:text-[#0055ff] transition-colors">Aide</Link>
                </div>
            </div>

            {/* Main Amazon-Style Navbar */}
            <header className="sticky top-0 z-[100] w-full bg-white border-b border-black/5 shadow-sm">
                <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center gap-4 lg:gap-8">
                    
                    {/* Brand */}
                    <Link href="/" className="flex-shrink-0">
                        <h1 className="brand-lolly text-2xl lg:text-3xl tracking-tighter text-black uppercase leading-none">
                            LOLLY<span className="text-[#0055ff]">SHOP</span>
                        </h1>
                    </Link>

                    {/* Mobile Menu Trigger */}
                    <button className="lg:hidden p-2 text-black"><Menu className="w-6 h-6" /></button>

                    {/* Central Search Bar (Amazon core feature) */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-3xl hidden sm:flex group">
                        <div className="relative w-full flex">
                            <button type="button" className="bg-gray-100 px-4 rounded-l-xl border-r border-black/5 text-[10px] font-black uppercase flex items-center hover:bg-gray-200 transition-all">
                                Tout <ChevronDown className="w-3 h-3 ml-1" />
                            </button>
                            <input 
                                type="text" 
                                placeholder="Chercher un parfum, un sac, un ordinateur..."
                                className="flex-1 bg-gray-50 border-none px-6 py-3.5 text-sm font-medium focus:ring-2 focus:ring-[#0055ff]/20 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="bg-[#0055ff] text-white px-6 rounded-r-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-2 lg:space-x-6">
                        {/* Account */}
                        <button className="flex items-center space-x-2 p-2 hover:bg-black/5 rounded-xl transition-all group">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-[#0055ff]/10 group-hover:text-[#0055ff]">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="hidden lg:block text-left leading-tight">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Compte</p>
                                <p className="text-xs font-black text-black uppercase">S'identifier</p>
                            </div>
                        </button>

                        {/* Cart */}
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center space-x-2 p-2 hover:bg-black/5 rounded-xl transition-all group"
                        >
                            <div className="relative">
                                <ShoppingBag className="w-6 h-6 group-hover:text-[#0055ff] transition-colors" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#0055ff] text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <div className="hidden lg:block text-left leading-tight">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Panier</p>
                                <p className="text-xs font-black text-black uppercase">Commander</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Sub-nav Category Bar - Enhanced Universes */}
                <div className="bg-gray-50/50 border-t border-black/5 px-4 lg:px-8 py-2 overflow-x-auto no-scrollbar hidden lg:flex items-center justify-center space-x-12">
                    <Link href="/?shop=1" className="group flex items-center space-x-3 transition-all">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black">Luxya Beauté</span>
                    </Link>

                    <div className="h-6 w-px bg-black/5" />

                    <Link href="/?shop=2" className="group flex items-center space-x-3 transition-all">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#0055ff] group-hover:bg-[#0055ff] group-hover:text-white transition-all">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-black">Homtek Tech</span>
                    </Link>
                </div>
            </header>

            <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                whatsappNumber={settings?.whatsapp_number}
            />
        </>
    );
}
