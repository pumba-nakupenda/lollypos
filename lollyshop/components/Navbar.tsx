
'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Menu, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import CartDrawer from './CartDrawer';

interface NavbarProps {
    settings?: any
}

export default function Navbar({ settings }: NavbarProps) {
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: 'Collections', href: '/' },
        { name: 'Luxya Beauté', href: '/?shop=1' },
        { name: 'Homtek Tech', href: '/?shop=2' },
    ];

    return (
        <>
            <div className="fixed w-full z-[100] px-4 sm:px-8 py-6 transition-all duration-500">
                <nav className={`max-w-7xl mx-auto rounded-[32px] transition-all duration-500 border bg-white border-black/5 shadow-2xl py-3 px-8`}>
                    <div className="flex justify-between items-center text-black">
                        
                        {/* Brand */}
                        <Link href="/" className="group relative" aria-label="Lolly Shop Accueil">
                            <div className="flex items-baseline">
                                <span className="brand-lolly text-3xl sm:text-4xl tracking-tighter transition-transform group-hover:-rotate-3 duration-300 uppercase">
                                    LOLLY<span className="ml-1 text-[#0055ff]">SHOP</span>
                                </span>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden lg:flex items-center space-x-12">
                            {navItems.map((item) => (
                                <Link key={item.name} href={item.href} className="text-[11px] font-black uppercase tracking-[0.2em] hover:text-[#0055ff] transition-all relative group" aria-label={item.name}>
                                    {item.name}
                                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-1 bg-[#0055ff] rounded-full transition-all group-hover:w-4"></span>
                                </Link>
                            ))}
                        </div>

                        {/* Action Icons */}
                        <div className="flex items-center space-x-2 sm:space-x-5">
                            <button 
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-3 bg-black text-[#0055ff] rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-black/10"
                                aria-label={`Voir le panier (${cartCount} articles)`}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#0055ff] text-black text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black">
                                        {cartCount}
                                    </span>
                                )}
                            </button>

                            <button className="lg:hidden p-2 text-black" aria-label="Ouvrir le menu">
                                <Menu className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </nav>
            </div>

            <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                whatsappNumber={settings?.whatsapp_number}
            />
        </>
    );
}
