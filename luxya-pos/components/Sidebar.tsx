
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
    Lock,
    RefreshCw,
    Globe,
    FileText
} from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useShop } from '@/context/ShopContext'
import ShopSelector from './ShopSelector'

const navGroups = [
    {
        title: "Pilotage",
        items: [
            { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
            { name: 'Lolly AI', href: '/ai', icon: Sparkles, superAdminOnly: true },
        ]
    },
    {
        title: "Opérations",
        items: [
            { name: 'Caisse POS', href: '/sales', icon: ShoppingBag },
            { name: 'Clients', href: '/customers', icon: Users, roles: ['admin', 'manager'] },
            { name: 'Dettes', href: '/debts', icon: CreditCard, roles: ['admin', 'manager'] },
        ]
    },
    {
        title: "Gestion Stock",
        items: [
            { name: 'Achats', href: '/purchase-orders', icon: FileText, roles: ['admin', 'manager'] },
            { name: 'Inventaire', href: '/inventory', icon: Package, roles: ['admin', 'manager'] },
            { name: 'Fournisseurs', href: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
            { name: 'Inventaire Rapide', href: '/inventory/quick', icon: RefreshCw, roles: ['admin', 'manager'] },
        ]
    },
    {
        title: "Finance & Frais",
        items: [
            { name: 'Depenses', href: '/expenses', icon: Receipt, roles: ['admin', 'manager'] },
        ]
    },
    {
        title: "Configuration",
        items: [
            // { name: 'Gestion Web', href: '/admin/web', icon: Globe, superAdminOnly: true },
            { name: 'Administration', href: '/admin', icon: Shield, superAdminOnly: true },
        ]
    }
]

export default function Sidebar() {
    const pathname = usePathname()
    const { profile } = useUser()
    const { activeShop } = useShop()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // ERP/POS Separation: No sidebar for login page OR for simple cashiers
    if (pathname === '/login' || profile?.role === 'cashier') return null

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
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsMobileOpen(false)} className="lg:hidden p-2 glass-card rounded-lg">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="mb-6">
                    <ShopSelector />
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar pb-20">
                {navGroups.map((group) => {
                    const filteredItems = group.items.filter((item: any) => {
                        if (item.superAdminOnly && !profile?.is_super_admin) return false
                        if (!item.roles) return true
                        if (item.name === 'Inventaire' && profile?.has_stock_access) return true
                        return item.roles.includes(profile?.role || '')
                    }).map((item: any) => {
                        // NEW: Dynamic naming for the Agency
                        if (item.href === '/sales') {
                            return { ...item, name: activeShop?.id === 3 ? 'Facturation' : 'Caisse POS' }
                        }
                        return item
                    })

                    // Add Personal Expenses dynamically to Finance group for Agency
                    if (group.title === "Finance & Frais" && activeShop?.id === 3 && (profile?.role === 'admin' || profile?.role === 'manager')) {
                        filteredItems.push({ 
                            name: 'Dépenses Perso', 
                            href: '/personal-expenses', 
                            icon: Tag 
                        });
                    }

                    if (filteredItems.length === 0) return null

                    return (
                        <div key={group.title} className="glass-panel p-3 rounded-[28px] border-white/5 bg-white/[0.02] shadow-inner">
                            <p className="px-3 text-[8px] font-black uppercase tracking-[0.3em] text-shop mb-3 opacity-80">{group.title}</p>
                            <div className="space-y-1">
                                {filteredItems.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                                ? 'bg-white/5 text-white border border-white/10 shadow-xl'
                                                : 'text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-shop' : 'text-muted-foreground group-hover:text-white'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            {isActive && <div className="w-1 h-1 rounded-full bg-shop animate-pulse" />}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
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
            {/* Mobile Toggle Button */}
            <div className="lg:hidden fixed top-4 left-4 z-[150]">
                <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="p-3 bg-shop text-white rounded-2xl shadow-2xl shadow-shop/40 active:scale-90 transition-all border border-white/10 backdrop-blur-xl"
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
                <div className="lg:hidden fixed inset-0 z-[200] flex">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileOpen(false)} />
                    <aside className="relative w-[85%] max-w-[320px] bg-[#0a0a0c] h-full shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-500">
                        <SidebarContent />
                    </aside>
                </div>
            )}
        </>
    )
}
