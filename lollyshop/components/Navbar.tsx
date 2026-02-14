
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, User, MapPin, ChevronDown, Sparkles, X, Tags, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import CartDrawer from './CartDrawer';
import MegaMenu from './MegaMenu';
import { useRouter, useSearchParams } from 'next/navigation';

interface NavbarProps {
    settings?: any
    categories?: string[]
}

export default function Navbar({ settings, categories = [] }: NavbarProps) {
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const { user, isAdmin, signOut } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setMounted(true);
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set('q', searchQuery);
        else params.delete('q');
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="w-full">
            {/* Main Modern Navbar */}
            <header className="z-[100] w-full bg-[#131921]/95 backdrop-blur-md text-white sticky top-0 md:relative border-b border-white/5">
                <div className="max-w-[1500px] mx-auto px-4 py-2">
                    
                    {/* Top Row: Logo & Actions */}
                    <div className="flex items-center justify-between mb-2 md:mb-0 md:gap-8">
                        {/* Brand Logo */}
                        <Link href="/" className="flex-shrink-0 pt-1.5 hover:opacity-80 transition-all">
                            <img 
                                src="/logo_white.png" 
                                alt="Lolly Shop" 
                                className="h-7 md:h-10 w-auto object-contain"
                            />
                        </Link>

                        {/* Desktop Delivery Info */}
                        <div className="hidden lg:flex items-center hover:outline-1 hover:outline-white p-2 rounded-sm cursor-pointer transition-all">
                            <MapPin className="w-4 h-4 mt-2 mr-1 text-gray-300" />
                            <div className="text-left">
                                <p className="text-[11px] text-gray-400 font-medium leading-none">Livrer au</p>
                                <p className="text-sm font-black uppercase tracking-tight">Sénégal</p>
                            </div>
                        </div>

                        {/* Desktop Search Bar (Hidden on Mobile) */}
                        <form onSubmit={handleSearch} className="hidden md:flex flex-1 group min-w-0 mx-4">
                            <div className="relative w-full flex h-11">
                                <div className="bg-[#f3f3f3] hover:bg-[#dadada] px-3 rounded-l-md border-r border-gray-300 text-[11px] font-bold items-center text-gray-600 cursor-pointer transition-all shrink-0 flex">
                                    Tout <ChevronDown className="w-3 h-3 ml-1" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Chercher un produit, une marque..."
                                    className="flex-1 bg-white border-none px-4 text-base text-black focus:ring-2 focus:ring-[#ff9900] outline-none min-w-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button type="submit" className="bg-[#febd69] hover:bg-[#f3a847] text-[#131921] px-5 rounded-r-md transition-all flex items-center justify-center shrink-0">
                                    <Search className="w-6 h-6 stroke-[3px]" />
                                </button>
                            </div>
                        </form>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 md:gap-6 shrink-0">
                            {/* Account / Login */}
                            {user ? (
                                <div className="flex flex-col items-center md:items-start p-1 rounded-sm transition-all cursor-pointer relative group">
                                    <User className="w-5 h-5 md:hidden text-gray-300" />
                                    <div className="hidden md:block">
                                        <p className="text-[10px] md:text-[11px] font-medium leading-none text-gray-400">Bonjour, {user.email?.split('@')[0]}</p>
                                        <p className="text-xs md:text-sm font-black tracking-tight uppercase flex items-center">Mon Compte <ChevronDown className="w-3 h-3 ml-1" /></p>
                                    </div>
                                    
                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full right-0 mt-0 w-48 bg-white text-black shadow-2xl rounded-xl border border-gray-200 hidden group-hover:block z-50 overflow-hidden">
                                        <div className="p-4 space-y-3">
                                            <Link href="/account" className="flex items-center text-xs font-bold hover:text-lolly"><User className="w-3 h-3 mr-2" /> Mon Compte</Link>
                                            {isAdmin && (
                                                <Link href="/admin" className="flex items-center text-xs font-bold text-red-600 hover:underline"><ShieldCheck className="w-3 h-3 mr-2" /> Admin Lolly</Link>
                                            )}
                                            <div className="h-px bg-gray-100 my-1" />
                                            <button onClick={signOut} className="w-full text-left text-xs font-black uppercase text-gray-500 hover:text-black">Déconnexion</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link href="/login" className="flex flex-col items-center md:items-start p-1 transition-all">
                                    <User className="w-5 h-5 md:hidden text-gray-300" />
                                    <div className="hidden md:block">
                                        <span className="text-[10px] md:text-[11px] font-medium leading-none text-gray-400">Identifiez-vous</span>
                                        <span className="text-xs md:text-sm font-black tracking-tight uppercase block">Compte</span>
                                    </div>
                                </Link>
                            )}

                            {/* Cart Button */}
                            <button 
                                onClick={() => setIsCartOpen(true)}
                                className="relative flex items-center p-1 rounded-sm transition-all group"
                            >
                                <div className="relative">
                                    <ShoppingBag className="w-6 h-6 md:w-9 md:h-9 text-white" />
                                    {mounted && cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-[#f08804] text-[#131921] text-[9px] md:text-xs font-black px-1 rounded-full min-w-[16px] md:min-w-[22px] flex items-center justify-center border-2 border-[#131921] shadow-lg animate-in zoom-in">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                                <div className="hidden md:block text-left ml-2 mt-2">
                                    <p className="text-xs font-black uppercase tracking-tight leading-none">Panier</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Bar (Only visible on mobile) */}
                    <div className="md:hidden w-full pb-2">
                        <form onSubmit={handleSearch} className="relative flex h-10 w-full">
                            <input 
                                type="text" 
                                placeholder="Chercher un article..."
                                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 pl-10 text-sm text-white placeholder:text-gray-400 focus:bg-white focus:text-black focus:placeholder:text-gray-300 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </form>
                    </div>
                </div>

                {/* Sub-Navbar - RESPONSIVE HEIGHT */}
                <div className="bg-[#232f3e] pl-4 pr-0 py-0 overflow-x-auto no-scrollbar flex items-center shadow-md h-10 md:h-[60px] border-t border-white/5">
                    <div className="flex items-center space-x-4 md:space-x-6 h-full py-1 pr-4 shrink-0">
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            className="flex items-center space-x-1 hover:outline-1 hover:outline-white px-2 py-1 rounded-sm text-xs md:text-sm font-bold whitespace-nowrap"
                        >
                            <Menu className="w-4 h-4 md:w-6 md:h-6 mr-1" /> Tous
                        </button>
                        <Link href="/?shop=1" className="hover:scale-105 transition-all whitespace-nowrap shrink-0 group">
                            <div className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:bg-red-500/20 group-hover:border-red-500/40 transition-all flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_#ef4444]" />
                                Luxya
                            </div>
                        </Link>
                        <Link href="/?shop=2" className="hover:scale-105 transition-all whitespace-nowrap shrink-0 group">
                            <div className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-all flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 shadow-[0_0_8px_#3b82f6]" />
                                Homtek
                            </div>
                        </Link>
                        <div className="h-4 md:h-6 w-[1.5px] bg-white/20 shrink-0" />
                        <Link href="/?sort=promo" className="text-xs md:text-sm font-medium hover:outline-1 hover:outline-white px-2 py-1 rounded-sm whitespace-nowrap">Promos</Link>
                        <Link href="/?sort=best" className="text-xs md:text-sm font-medium hover:outline-1 hover:outline-white px-2 py-1 rounded-sm whitespace-nowrap">Ventes</Link>
                    </div>
                    
                    {/* Mini Image */}
                    {settings?.event?.mini_image && (
                        <Link href={settings.event.link || "/?sort=promo"} className="ml-auto hidden sm:block h-full transition-all overflow-hidden shrink-0">
                            <img 
                                src={settings.event.mini_image} 
                                alt="Promo" 
                                className="h-full w-auto object-contain max-w-[250px] md:max-w-[600px]"
                            />
                        </Link>
                    )}
                </div>
            </header>

            <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                whatsappNumber={settings?.whatsapp_number}
            />

            <MegaMenu 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                categories={categories}
            />
        </div>
    );
}
