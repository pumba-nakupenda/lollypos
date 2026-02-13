
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, User, MapPin, ChevronDown, Sparkles, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';
import MegaMenu from './MegaMenu';
import { useRouter, useSearchParams } from 'next/navigation';

interface NavbarProps {
    settings?: any
    categories?: string[]
}

export default function Navbar({ settings, categories = [] }: NavbarProps) {
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
            {/* Main Amazon-Style Navbar */}
            <header className="z-[100] w-full bg-[#131921] text-white">
                <div className="max-w-[1500px] mx-auto px-4 py-2 flex items-center gap-3 md:gap-8">
                    
                    {/* Brand Logo - Updated to Image */}
                    <Link href="/" className="flex-shrink-0 pt-1.5 hover:outline-1 hover:outline-white p-1 rounded-sm transition-all">
                        <img 
                            src="/logo_white.png" 
                            alt="Lolly Shop" 
                            className="h-8 md:h-10 w-auto object-contain"
                        />
                    </Link>

                    {/* Delivery Info (Hidden on Mobile) */}
                    <div className="hidden lg:flex items-center hover:outline-1 hover:outline-white p-2 rounded-sm cursor-pointer transition-all">
                        <MapPin className="w-4 h-4 mt-2 mr-1 text-gray-300" />
                        <div className="text-left">
                            <p className="text-[11px] text-gray-400 font-medium leading-none">Livrer au</p>
                            <p className="text-sm font-black uppercase tracking-tight">Sénégal</p>
                        </div>
                    </div>

                    {/* MASSIVE SEARCH BAR */}
                    <form onSubmit={handleSearch} className="flex-1 group min-w-0">
                        <div className="relative w-full flex h-9 md:h-11">
                            <div className="hidden md:flex bg-[#f3f3f3] hover:bg-[#dadada] px-3 rounded-l-md border-r border-gray-300 text-[11px] font-bold items-center text-gray-600 cursor-pointer transition-all shrink-0">
                                Tout <ChevronDown className="w-3 h-3 ml-1" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Chercher..."
                                className="flex-1 bg-white border-none px-3 md:px-4 text-sm md:text-base text-black focus:ring-2 focus:ring-[#ff9900] outline-none rounded-l-md md:rounded-none min-w-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="bg-[#febd69] hover:bg-[#f3a847] text-[#131921] px-3 md:px-5 rounded-r-md transition-all flex items-center justify-center shrink-0">
                                <Search className="w-5 h-5 md:w-6 md:h-6 stroke-[3px]" />
                            </button>
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 md:gap-6 shrink-0">
                        {/* Help / Support (Hidden on tiny mobile) */}
                        <a 
                            href={`https://wa.me/${settings?.whatsapp_number || "221772354747"}`}
                            target="_blank"
                            className="hidden xs:flex flex-col items-start hover:outline-1 hover:outline-white p-1.5 md:p-2 rounded-sm transition-all"
                        >
                            <span className="text-[10px] md:text-[11px] font-medium leading-none">Aide &</span>
                            <span className="text-xs md:text-sm font-black tracking-tight uppercase">Support</span>
                        </a>

                        {/* Cart Button */}
                        <button 
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center hover:outline-1 hover:outline-white p-1.5 md:p-2 rounded-sm transition-all group"
                        >
                            <div className="relative flex items-end">
                                <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[#f08804] text-xs md:text-base font-black">
                                    {cartCount}
                                </span>
                            </div>
                            <div className="hidden md:block text-left mt-3 ml-1">
                                <p className="text-sm font-black uppercase tracking-tight">Panier</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Sub-Navbar - RESPONSIVE HEIGHT */}
                <div className="bg-[#232f3e] pl-4 pr-0 py-0 overflow-x-auto no-scrollbar flex items-center shadow-md h-10 md:h-[60px]">
                    <div className="flex items-center space-x-4 md:space-x-6 h-full py-1 pr-4 shrink-0">
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            className="flex items-center space-x-1 hover:outline-1 hover:outline-white px-2 py-1 rounded-sm text-xs md:text-sm font-bold whitespace-nowrap"
                        >
                            <Menu className="w-4 h-4 md:w-6 md:h-6 mr-1" /> Tous
                        </button>
                        <Link href="/?shop=1" className="text-xs md:text-sm font-medium hover:outline-1 hover:outline-white px-2 py-1 rounded-sm whitespace-nowrap flex items-center group">
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-600 mr-1.5 md:mr-2 shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                            Luxya
                        </Link>
                        <Link href="/?shop=2" className="text-xs md:text-sm font-medium hover:outline-1 hover:outline-white px-2 py-1 rounded-sm whitespace-nowrap flex items-center group">
                            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-600 mr-1.5 md:mr-2 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                            Homtek
                        </Link>
                        <div className="h-4 md:h-6 w-[1.5px] bg-white/20 shrink-0" />
                        <Link href="/?sort=promo" className="text-xs md:text-sm font-medium hover:outline-1 hover:outline-white px-2 py-1 rounded-sm whitespace-nowrap">Promos</Link>
                        <Link href="/?sort=best" className="text-xs md:text-sm font-medium hover:outline-1 hover:outline-white px-2 py-1 rounded-sm whitespace-nowrap">Ventes</Link>
                    </div>
                    
                    {/* Mini Image - Hidden on small mobile to avoid layout breaking */}
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
        </>
    );
}
