'use client'

import React, { useState, useEffect } from 'react'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    ArrowLeft,
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Store,
    PieChart,
    Filter,
    ChevronDown,
    Tag
} from 'lucide-react'
import Link from 'next/link'
import { useShop } from '@/context/ShopContext'
import ShopSelector from '@/components/ShopSelector'
import CustomDropdown from '@/components/CustomDropdown'

export default function AnalyticsPage() {
    const { activeShop } = useShop()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('Toutes')

    useEffect(() => {
        fetchAnalytics()
    }, [activeShop, selectedCategory])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const shopId = activeShop?.id || 'all'
            const res = await fetch(`/api/analytics?shopId=${shopId}&category=${selectedCategory}`)
            if (res.ok) {
                const analyticsData = await res.json()
                setData(analyticsData)
            }
        } catch (err) {
            console.error('Failed to fetch analytics')
        } finally {
            setLoading(false)
        }
    }

    if (loading && !data) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-shop border-t-transparent rounded-full animate-spin" />
        </div>
    )

    const metrics = data?.metrics || { totalSales: 0, totalExpenses: 0, profit: 0 }
    const topProducts = data?.topProducts || []
    const trend = data?.trend || []
    const categories = ['Toutes', ...(data?.availableCategories || [])]
    const categoryOptions = categories.map(cat => ({ 
        label: cat, 
        value: cat, 
        icon: <Tag className="w-3.5 h-3.5" /> 
    }))

    return (
        <div className="min-h-screen flex flex-col bg-[#050505] text-white">
            {/* Header */}
            <header className="glass-panel sticky top-0 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-shop rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Intelligence</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Analytics Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        {/* Category Filter */}
                        <CustomDropdown 
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(val) => setSelectedCategory(val)}
                            className="min-w-[180px]"
                        />
                        
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-shop mr-2 animate-pulse" />
                            Temps réel
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 space-y-12">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard
                        title="Ventes (Période)"
                        value={metrics.totalSales}
                        icon={<DollarSign className="w-6 h-6" />}
                        trend="+12.5%"
                        isUp={true}
                        color="shop"
                    />
                    <MetricCard
                        title="Dépenses (Période)"
                        value={metrics.totalExpenses}
                        icon={<TrendingDown className="w-6 h-6" />}
                        trend="-2.4%"
                        isUp={true}
                        color="red-500"
                    />
                    <MetricCard
                        title="Bénéfice Net"
                        value={metrics.profit}
                        icon={<TrendingUp className="w-6 h-6" />}
                        trend="+18.2%"
                        isUp={true}
                        color="green-400"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Chart (Income vs Expenses) */}
                    <div className="lg:col-span-2 glass-panel rounded-[40px] p-8 border-white/5 bg-white/[0.01] relative overflow-hidden">
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Flux de Trésorerie</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Entrées vs Sorties (7j)</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-shop" />
                                    <span className="text-[8px] font-black uppercase text-muted-foreground">Entrées</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-[8px] font-black uppercase text-muted-foreground">Sorties</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-72 flex items-end justify-between space-x-6 mt-4 px-4">
                            {trend.map((day: any, i: number) => {
                                const maxVal = Math.max(...trend.map((d: any) => Math.max(d.income, d.outcome))) || 1
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                        <div className="flex w-full justify-center items-end space-x-1 h-full pb-2">
                                            {/* Income Bar */}
                                            <div 
                                                className="w-full bg-shop/40 border-t border-shop/50 rounded-t-sm transition-all group-hover:bg-shop group-hover:shadow-[0_0_15px_rgba(var(--shop-primary),0.3)]"
                                                style={{ height: `${(day.income / maxVal) * 100}%` }}
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-shop text-white px-2 py-1 rounded text-[8px] font-black transition-opacity whitespace-nowrap z-20">
                                                    +{day.income.toLocaleString()}
                                                </div>
                                            </div>
                                            {/* Outcome Bar */}
                                            <div 
                                                className="w-full bg-red-500/20 border-t border-red-500/30 rounded-t-sm transition-all group-hover:bg-red-500/60"
                                                style={{ height: `${(day.outcome / maxVal) * 100}%` }}
                                            >
                                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-[8px] font-black transition-opacity whitespace-nowrap z-20">
                                                    -{day.outcome.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2 opacity-50 text-center">
                                            {day.date.split('-').slice(2)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="glass-panel rounded-[40px] p-8 border-white/5 bg-white/[0.01]">
                        <div className="mb-8">
                            <h3 className="text-xl font-black uppercase tracking-tight">Best Sellers</h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                {selectedCategory === 'Toutes' ? 'Top 5 Produits' : `Top en ${selectedCategory}`}
                            </p>
                        </div>

                        <div className="space-y-6">
                            {topProducts.map((p: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-4 glass-card rounded-2xl hover:border-shop/50 transition-all border-transparent group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-shop text-xs border border-white/5 group-hover:bg-shop group-hover:text-white transition-colors">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white pr-2 truncate max-w-[120px]">{p.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                                                {p.totalQuantity} vendus
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-shop">{p.totalRevenue.toLocaleString()} FCFA</p>
                                    </div>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <div className="h-64 flex flex-col items-center justify-center opacity-20 text-center">
                                    <PieChart className="w-16 h-16 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Aucune vente</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function MetricCard({ title, value, icon, trend, isUp, color }: any) {
    // Correct color handling for tailwind classes in template literals
    const colorClass = color === 'shop' ? 'shop' : color;
    
    return (
        <div className="glass-card p-8 rounded-[40px] relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform group-hover:scale-110 group-hover:-rotate-12`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-24 h-24' })}
            </div>

            <div className="relative z-10 space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: `w-6 h-6 text-${colorClass}` })}
                </div>

                <div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
                    <div className="flex items-baseline space-x-2">
                        <h2 className="text-3xl font-black tracking-tight">{value.toLocaleString()}</h2>
                        <span className="text-[10px] font-bold opacity-50">FCFA</span>
                    </div>
                </div>

                <div className={`flex items-center text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {trend} vs hier
                </div>
            </div>
        </div>
    )
}