'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    BarChart3,
    Shield,
    Receipt,
    Settings,
    ChevronRight,
    LogOut,
    Store,
    Menu,
    X,
    Users,
    Sparkles,
    CreditCard,
    Truck,
    Tag,
    Lock
} from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useShop } from '@/context/ShopContext'
import ShopSelector from './ShopSelector'

const navItems = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Caisse POS', href: '/sales', icon: ShoppingBag },
    { name: 'Lolly AI', href: '/ai', icon: Sparkles, roles: ['admin', 'manager'] },
    { name: 'Inventaire', href: '/inventory', icon: Package, roles: ['admin', 'manager'] },
    { name: 'Clients', href: '/customers', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Dettes', href: '/debts', icon: CreditCard, roles: ['admin', 'manager'] },
    { name: 'Depenses', href: '/expenses', icon: Receipt, roles: ['admin', 'manager'] },
    { name: 'Gestion Web', href: '/admin/web', icon: BarChart3, roles: ['admin'] },
    { name: 'Administration', href: '/admin', icon: Shield, roles: ['admin'] },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { profile } = useUser()
    const { activeShop } = useShop()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // ERP/POS Separation: No sidebar for login page OR for simple cashiers
    if (pathname === '/login' || profile?.role === 'cashier') return null

    const filteredItems = navItems.filter(item => {
        if (!item.roles) return true
        if (item.name === 'Inventaire' && profile?.has_stock_access) return true
        return item.roles.includes(profile?.role || '')
    }).map(item => {
        // NEW: Dynamic naming for the Agency
        if (item.href === '/sales') {
            return { ...item, name: activeShop?.id === 3 ? 'Facturation' : 'Caisse POS' }
        }
        return item
    })

    // NEW: Add Personal Expenses for Agency ONLY
    if (activeShop?.id === 3 && (profile?.role === 'admin' || profile?.role === 'manager')) {
        filteredItems.push({ 
            name: 'Dépenses Perso', 
            href: '/personal-expenses', 
            icon: Tag 
        });
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-shop rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                                            <div>
                                                <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Gestion</h1>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1"><span className="brand-lolly">Lolly</span> System</p>
                                            </div>                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-2 glass-card rounded-lg">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="mb-6">
                    <ShopSelector />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 opacity-50">Menu Principal</p>
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-shop/10 text-shop border border-shop/20'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className="w-5 h-5 shrink-0" />
                                <span className={`text-xs font-black uppercase tracking-widest ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>
                                    {item.name}
                                </span>
                            </div>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-shop animate-pulse" />}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 mt-auto">
                <div className="glass-card rounded-[32px] p-4 border-white/5 bg-white/[0.01]">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-shop/10 flex items-center justify-center font-black text-shop text-sm border border-shop/20">
                            {profile?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-tight truncate text-white">
                                {profile?.email?.split('@')[0]}
                            </p>
                            <span className="text-[8px] font-black uppercase tracking-widest text-shop/60 px-2 py-0.5 bg-shop/5 rounded-full border border-shop/10">
                                {profile?.role || 'User'}
                            </span>
                        </div>
                    </div>

                    <form action="/auth/signout" method="post">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/10"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Déconnexion</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Toggle Button - Moved to bottom left for better accessibility */}
            <div className="lg:hidden fixed bottom-8 left-8 z-[70]">
                <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="p-4 bg-shop/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl shadow-shop/20 active:scale-90 transition-all border border-white/20"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-background border-r border-white/5 flex-col h-screen sticky top-0 z-[60]">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Drawer */}
            {isMobileOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] flex">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
                    <aside className="relative w-80 bg-[#0a0a0c] h-full shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-300">
                        <SidebarContent />
                    </aside>
                </div>
            )}
        </>
    )
}