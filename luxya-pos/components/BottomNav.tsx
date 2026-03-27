
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingBag,
    Menu,
    Receipt,
    CreditCard,
    Wallet
} from 'lucide-react'

export default function BottomNav({ onMenuClick }: { onMenuClick: () => void }) {
    const pathname = usePathname()

    if (pathname === '/login') return null

    const navItems = [
        { name: 'Home', href: '/', icon: LayoutDashboard },
        { name: 'POS', href: '/sales', icon: ShoppingBag },
        { name: 'Caisse', href: '/cash-management', icon: Wallet },
        { name: 'Dette', href: '/debts', icon: CreditCard },
        { name: 'Frais', href: '/expenses', icon: Receipt },
    ]

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-2 pb-6 pt-2">
            <div className="glass-panel bg-background/80 backdrop-blur-xl border-white/10 rounded-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-around p-1.5">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                                isActive 
                                ? 'bg-shop text-white shadow-lg shadow-shop/20 scale-105 -translate-y-1' 
                                : 'text-muted-foreground active:scale-90'
                            }`}
                        >
                            <item.icon className="w-4.5 h-4.5" />
                            <span className="text-[8px] font-black uppercase tracking-tighter mt-1">{item.name}</span>
                        </Link>
                    )
                })}
                
                {/* Menu Button to trigger the Sidebar Drawer */}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-muted-foreground active:scale-90 transition-all"
                >
                    <Menu className="w-4.5 h-4.5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Menu</span>
                </button>
            </div>
        </nav>
    )
}
