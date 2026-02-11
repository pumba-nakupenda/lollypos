
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, User, MapPin, ChevronDown, Sparkles, X } from 'lucide-react';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('q', searchQuery);
        else params.delete('q');
        router.push(`/?${params.toString()}`);
    };

    return (
        <>
            {/* Top Bar - Delivery & Links */}
            <div className="bg-[#131921] text-white text-[10px] font-bold py-2 px-4 sm:px-10 flex justify-between items-center overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-6 shrink-0">
                    <button className="flex items-center hover:text-lolly transition-colors group">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 group-hover:text-lolly" />
                        <div className="text-left leading-none">
                            <p className="text-[8px] text-gray-400 font-medium">Livrer à</p>
                            <p className="uppercase tracking-widest">Dakar, Sénégal</p>
                        </div>
                    </button>
                    <span className="h-4 w-px bg-white/10 hidden sm:block" />
                    <span className="hidden sm:inline uppercase tracking-[0.2em] text-gray-400">Livraison Express en 24h</span>
                </div>
                <div className="flex items-center space-x-6 shrink-0 ml-4">
                    <Link href="#" className="hover:text-lolly transition-colors uppercase tracking-widest">Aide</Link>
                    <Link href="#" className="hover:text-lolly transition-colors uppercase tracking-widest">Suivre Commande</Link>
                </div>
            </div>

            {/* Main Amazon-Style Navbar */}
            <header className="sticky top-0 z-[100] w-full bg-[#232f3e] border-b border-black/5">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-10 py-3 flex items-center gap-4 lg:gap-10">
                    
                    {/* Brand */}
                    <Link href="/" className="flex-shrink-0 group">
                        <h1 className="brand-lolly text-2xl lg:text-3xl tracking-tighter text-white uppercase leading-none group-hover:scale-105 transition-transform">
                            LOLLY<span className="text-lolly">.</span>
                        </h1>
                    </Link>

                    {/* All Menu Trigger (Departments) */}
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="hidden lg:flex items-center space-x-1.5 text-white p-2 hover:ring-1 hover:ring-white rounded transition-all"
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Tous</span>
                    </button>

                    {/* Central Search Bar (Amazon core feature) */}
                    <form onSubmit={handleSearch} className="flex-1 max-w-4xl group">
                        <div className="relative w-full flex">
                            <div className="hidden md:flex bg-gray-100 px-4 rounded-l-md border-r border-gray-300 text-[10px] font-black uppercase items-center text-gray-600 hover:bg-gray-200 cursor-pointer transition-all">
                                Tout <ChevronDown className="w-3 h-3 ml-1.5" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Que cherchez-vous aujourd'hui ?"
                                className="flex-1 bg-white border-none px-5 py-3 text-sm font-medium focus:ring-0 outline-none rounded-l-md md:rounded-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="bg-lolly text-white px-6 rounded-r-md hover:brightness-110 transition-all shadow-lg active:scale-95">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-2 lg:space-x-8">
                        {/* Account */}
                        <button className="flex items-center space-x-2 p-2 hover:ring-1 hover:ring-white rounded transition-all group">
                            <User className="w-6 h-6 text-white" />
                            <div className="hidden xl:block text-left leading-none">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bonjour, Invité</p>
                                <p className="text-xs font-black text-white uppercase">Compte <ChevronDown className="inline w-3 h-3 ml-0.5" /></p>
                            </div>
                        </button>

                        {/* Cart */}
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center space-x-2 p-2 hover:ring-1 hover:ring-white rounded transition-all group"
                        >
                            <div className="relative flex items-end">
                                <ShoppingBag className="w-7 h-7 text-white" />
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-lolly text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-xl border-2 border-[#232f3e]">
                                    {cartCount}
                                </span>
                            </div>
                            <div className="hidden lg:block text-left leading-none mt-1">
                                <p className="text-xs font-black text-white uppercase tracking-tighter">Panier</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="bg-[#232f3e] border-t border-white/5 px-4 lg:px-10 py-1.5 overflow-x-auto no-scrollbar flex items-center space-x-8">
                    <Link href="/?shop=1" className="text-[10px] font-black text-white uppercase tracking-widest hover:ring-1 hover:ring-white px-2 py-1 rounded transition-all flex items-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5 mr-2 text-pink-400" /> Luxya Beauté
                    </Link>
                    <Link href="/?shop=2" className="text-[10px] font-black text-white uppercase tracking-widest hover:ring-1 hover:ring-white px-2 py-1 rounded transition-all flex items-center shrink-0">
                        <ShoppingBag className="w-3.5 h-3.5 mr-2 text-lolly" /> Homtek Tech
                    </Link>
                    <div className="h-4 w-px bg-white/10 shrink-0" />
                    {['Promotions', 'Nouveautés', 'Meilleures Ventes', 'Service Client'].map(item => (
                        <Link key={item} href="#" className="text-[10px] font-black text-white uppercase tracking-widest hover:ring-1 hover:ring-white px-2 py-1 rounded transition-all shrink-0">
                            {item}
                        </Link>
                    ))}
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
