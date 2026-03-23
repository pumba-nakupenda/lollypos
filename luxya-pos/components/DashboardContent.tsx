'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    ShoppingBag,
    Package,
    LogOut,
    User,
    ArrowRight,
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    DollarSign,
    History,
    ShieldAlert,
    BarChart3,
    Calendar,
    Clock,
    Banknote,
    CreditCard,
    ArrowUpRight,
    Tag,
    Receipt,
    PieChart,
    AlertCircle,
    Target,
    RefreshCw,
    Scale,
    PiggyBank
} from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import ShopSelector from './ShopSelector'
import CustomDropdown from './CustomDropdown'
import ReceiptModal from './ReceiptModal'
import ExpiryAlertBanner from './ExpiryAlertBanner'
import AiInsights from './AiInsights'
import { API_URL, authFetch } from '@/utils/api'
import { ProfitabilityIndicator, ProfitabilityHistory } from './ProfitabilityComponents'

function SecondaryMiniCard({ title, value, color }: { title: string, value: number, color: string }) {
    const colorStyles: any = {
        "blue-400": "text-blue-400 bg-blue-400/10 border-blue-400/20",
        "orange-400": "text-orange-400 bg-orange-400/10 border-orange-400/20"
    }
    return (
        <div className="glass-card p-5 rounded-[24px] border-white/5 flex items-center justify-between group">
            <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-lg font-black text-white italic">{value?.toLocaleString()} <span className="text-[10px] opacity-30">CFA</span></h4>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles[color] || 'bg-white/10'}`}>
                <ArrowUpRight className="w-5 h-5" />
            </div>
        </div>
    )
}

function Legend({ badge, label }: { badge: string, label: string }) {
    return (
        <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <div className={`w-2 h-2 rounded-full ${badge}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
    )
}

export default function DashboardContent({ user }: { user: any }) {
    const { profile, loading: userLoading, error: profileError } = useUser()
    const { activeShop } = useShop()
    const { showToast } = useToast()

    // States for merged data
    const [analytics, setAnalytics] = useState<any>(null)
    const [sales, setSales] = useState<any[]>([])
    const [historyData, setHistoryData] = useState<any[]>([])
    const [aiForecast, setAiForecast] = useState<number[]>([0, 0, 0])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('Toutes')

    // NEW: Month selection state
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'))
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

    // Receipt reprint states
    const [isReceiptOpen, setIsReceiptOpen] = useState(false)
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any>(null)

    useEffect(() => {
        if (activeShop) {
            fetchDashboardData()
        }
    }, [activeShop, selectedCategory, selectedMonth, selectedYear])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            // Use 'all' if id is 0 or undefined
            const shopId = (!activeShop || activeShop.id === 0) ? 'all' : activeShop.id

            // Fetch everything in parallel with month/year
            const ts = Date.now()
            const [aData, sData, fData, hData] = await Promise.all([
                authFetch(`${API_URL}/analytics?shopId=${shopId}&category=${selectedCategory}&month=${selectedMonth}&year=${selectedYear}&_=${ts}`),
                authFetch(`${API_URL}/sales?shopId=${shopId === 'all' ? '' : shopId}&_=${ts}`),
                authFetch(`${API_URL}/ai/forecast?shopId=${shopId === 'all' ? '' : shopId}&_=${ts}`),
                authFetch(`${API_URL}/analytics/history?shopId=${shopId}&year=${selectedYear}&_=${ts}`)
            ])
            setAnalytics(aData)
            setAiForecast(fData.predictions || [0, 0, 0])
            setHistoryData(hData)

            // Filter recent sales list to match the selected month too for consistency
            const filteredRecentSales = sData.filter((s: any) => {
                const d = new Date(s.created_at)
                return (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth && d.getFullYear().toString() === selectedYear
            })
            setSales(filteredRecentSales.slice(0, 8))
        } catch (err) {
            // Error handled silently
        } finally {
            setLoading(false)
        }
    }

    const handleViewReceipt = async (sale: any) => {
        try {
            // Fetch items for this specific sale using the new efficient endpoint
            const saleItems = await authFetch(`${API_URL}/sales/${sale.id}/items`)

            setSelectedSaleForReceipt({
                ...sale,
                paymentMethod: sale.payment_method,
                totalAmount: sale.total_amount,
                items: saleItems.map((i: any) => ({
                    name: i.products?.name || 'Article inconnu',
                    price: i.price,
                    quantity: i.quantity
                }))
            })
            setIsReceiptOpen(true)
        } catch (err) {
            showToast("Erreur lors de la récupération du ticket", "error")
        }
    }

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-shop border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const metrics = analytics?.metrics || {
        totalSales: 0,
        totalExpenses: 0,
        profit: 0,
        tva: 0,
        margeBrute: 0,
        margeNet: 0,
        totalDebts: 0,
        totalSalesHT: 0,
        seuilRentabilite: 0,
        pointMortDate: new Date().toISOString(),
        isPointMortOutOfRange: false,
        tauxMarge: 0
    }
    const trend = analytics?.trend || []
    const topProducts = analytics?.topProducts || []
    const categoryOptions = ['Toutes', ...(analytics?.availableCategories || [])].map(cat => ({
        label: cat, value: cat, icon: <Tag className="w-3.5 h-3.5" />
    }))

    const monthOptions = [
        { label: 'Janvier', value: '01', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Février', value: '02', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Mars', value: '03', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Avril', value: '04', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Mai', value: '05', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Juin', value: '06', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Juillet', value: '07', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Août', value: '08', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Septembre', value: '09', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Octobre', value: '10', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Novembre', value: '11', icon: <Calendar className="w-3.5 h-3.5" /> },
        { label: 'Décembre', value: '12', icon: <Calendar className="w-3.5 h-3.5" /> }
    ]

    return (
        <div className="min-h-screen flex flex-col pb-24">
            {/* Header / Navigation - Optimized for mobile */}
            <header className="glass-panel sticky top-0 z-[60] border-b-0 m-0 sm:m-4 rounded-none sm:rounded-[24px] shadow-xl bg-background/80 backdrop-blur-md">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shop rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="flex items-center pl-10 lg:pl-0">
                                <h1 className="text-sm sm:text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">
                                    <span className="brand-lolly">Lolly</span>
                                </h1>
                                <span className="ml-2 px-2 py-0.5 bg-shop/20 text-[8px] sm:text-[10px] font-black rounded-full border border-shop/40 text-shop animate-pulse shadow-[0_0_15px_rgba(var(--shop-primary),0.1)] whitespace-nowrap hidden xs:inline">
                                    v1.5
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="hidden sm:block">
                            <ShopSelector />
                        </div>
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
                            <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${profile?.is_super_admin ? 'text-yellow-400 animate-pulse' : 'text-shop/60'}`}>
                                {profile?.is_super_admin ? 'Super Admin' : profile?.role}
                            </span>
                        </div>
                        <form action="/auth/signout" method="post">
                            <button className="p-2 sm:p-2.5 glass-card rounded-lg sm:rounded-xl text-muted-foreground hover:text-red-400 transition-all" type="submit">
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-8 py-2 sm:py-4 space-y-6 sm:space-y-8 animate-in fade-in duration-700">

                {/* Expiry Alert Banner */}
                <ExpiryAlertBanner shopId={activeShop?.id} />

                {/* 0. AI GROWTH INSIGHTS - Only for Global View */}
                {(!activeShop || activeShop.id === 0) && <AiInsights />}

                {/* 1. KEY METRICS & FINANCIAL HEALTH */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8 items-start">
                    {/* Main Stats Cluster */}
                    <div className="xl:col-span-3 space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <MetricMiniCard title="Revenus TTC" value={metrics.totalSales} icon={<DollarSign />} color="shop" trend="Global" />
                            <MetricMiniCard title="Encaissé Réel" value={metrics.actualCash || 0} icon={<Banknote />} color="green-400" trend="Cash" />
                            <MetricMiniCard title="Profit Net" value={metrics.profit} icon={<TrendingUp />} color="purple-400" trend="Résultat" />
                            <MetricMiniCard title="Dépenses" value={metrics.totalExpenses} icon={<TrendingDown />} color="red-400" trend="Sorties" />
                        </div>

                        {/* Chart Area */}
                        <div className="glass-panel rounded-[40px] p-6 sm:p-10 border-white/5 bg-white/[0.01] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                <TrendingUp className="w-64 h-64 rotate-12" />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-10 space-y-6 sm:space-y-0 relative z-10">
                                <div>
                                    <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tighter leading-none italic">Trésorerie <span className="text-shop">& Flux.</span></h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2">Cycle d'exploitation des 7 derniers jours</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Legend badge="bg-shop" label="Ventes" />
                                    <Legend badge="border border-shop border-dashed bg-transparent" label="Prévisions" />
                                    <Legend badge="bg-red-500" label="Dépenses" />
                                </div>
                            </div>
                            <div className="h-64 sm:h-80 flex items-end justify-between space-x-2 sm:space-x-6 px-2 relative z-10">
                                {trend.map((day: any, i: number) => {
                                    const maxVal = Math.max(...trend.map((d: any) => Math.max(d.income, d.outcome)), ...aiForecast) || 1
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            <div className="flex w-full justify-center items-end space-x-1 sm:space-x-1.5 h-full pb-3">
                                                <div
                                                    className="w-full max-w-[20px] bg-shop/20 border-t-2 border-shop/40 rounded-t-lg transition-all group-hover:bg-shop group-hover:shadow-[0_0_20px_rgba(var(--shop-primary),0.4)] animate-in slide-in-from-bottom-full duration-1000 relative"
                                                    style={{ height: `${(day.income / maxVal) * 100}%`, animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                                                >
                                                    <ChartTooltip value={day.income} label="Ventes" />
                                                </div>
                                                <div
                                                    className="w-full max-w-[20px] bg-red-500/10 border-t-2 border-red-500/30 rounded-t-lg transition-all group-hover:bg-red-500/40 animate-in slide-in-from-bottom-full duration-1000 relative"
                                                    style={{ height: `${(day.outcome / maxVal) * 100}%`, animationDelay: `${(i * 50) + 200}ms`, animationFillMode: 'both' }}
                                                >
                                                    <ChartTooltip value={day.outcome} label="Sorties" color="bg-red-900/90" />
                                                </div>
                                            </div>
                                            <span className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase opacity-30 group-hover:opacity-100 transition-opacity">{day.date.split('-')[2]}</span>
                                        </div>
                                    )
                                })}
                                {/* IA FORECAST */}
                                {aiForecast.map((value, i) => {
                                    const maxVal = Math.max(...trend.map((d: any) => Math.max(d.income, d.outcome)), ...aiForecast) || 1
                                    return (
                                        <div key={`f-${i}`} className="flex-1 flex flex-col items-center group relative h-full justify-end opacity-40">
                                            <div className="flex w-full justify-center items-end h-full pb-3">
                                                <div
                                                    className="w-full max-w-[20px] border-2 border-shop/40 border-dashed rounded-t-lg bg-shop/5 transition-all group-hover:bg-shop/20 animate-in slide-in-from-bottom-full duration-1000 relative"
                                                    style={{ height: `${(value / maxVal) * 100}%`, animationDelay: `${(trend.length + i) * 50}ms`, animationFillMode: 'both' }}
                                                >
                                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-14 left-1/2 -translate-x-1/2 bg-shop/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap shadow-2xl z-50 pointer-events-none border border-white/20 transition-all scale-90 group-hover:scale-100">
                                                        IA PRÉDIT<br /><span className="text-sm">+{Math.round(value).toLocaleString()} CFA</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[8px] font-black text-shop/40 uppercase">J+{i + 1}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics / Financial Health */}
                    <div className="space-y-6 sm:space-y-8">
                        <div className="glass-panel rounded-[40px] p-8 border-white/5 bg-white/[0.01] space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center"><ShieldAlert className="w-4 h-4 mr-3 text-shop-secondary" /> Santé Cash</h3>
                                <span className={`w-3 h-3 rounded-full shadow-[0_0_10px] ${metrics.totalDebts > metrics.margeNet ? 'bg-red-500 shadow-red-500/50' : 'bg-green-500 shadow-green-500/50'}`} />
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Marge Brute</span><span>{((metrics.margeBrute / (metrics.totalSales || 1)) * 100).toFixed(0)}%</span></div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-shop shadow-[0_0_10px_rgba(var(--shop-primary),0.5)] transition-all duration-1000" style={{ width: `${(metrics.margeBrute / (metrics.totalSales || 1)) * 100}%` }} /></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Dépenses / CA</span><span>{((metrics.totalExpenses / (metrics.totalSales || 1)) * 100).toFixed(0)}%</span></div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(metrics.totalExpenses / (metrics.totalSales || 1)) * 100}%` }} /></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>Dettes Clients</span><span>{metrics.totalDebts?.toLocaleString()}</span></div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${Math.min(100, (metrics.totalDebts / (metrics.margeNet || 1)) * 100)}%` }} /></div>
                                </div>
                            </div>

                            <div className={`p-5 rounded-[24px] border ${metrics.totalDebts > metrics.margeNet ? 'bg-red-500/5 border-red-500/20' : 'bg-shop/5 border-shop/20'}`}>
                                <p className="text-[9px] font-bold text-white leading-relaxed uppercase italic">
                                    {metrics.totalDebts > metrics.margeNet
                                        ? "Risque de trésorerie : les dettes dépassent vos profits nets."
                                        : "Trésorerie saine : vos dettes sont inférieures à votre rentabilité."}
                                </p>
                            </div>
                        </div>

                        {/* Small Secondary Metrics */}
                        <div className="grid grid-cols-1 gap-4">
                            <SecondaryMiniCard title="CA Hors Taxes" value={metrics.totalSalesHT} color="blue-400" />
                            <SecondaryMiniCard title="TVA Estimée" value={metrics.tva} color="orange-400" />
                        </div>
                    </div>
                </div>

                {(profile?.is_super_admin || profile?.role === 'admin' || profile?.role === 'manager') && (
                    <div className="space-y-6 sm:space-y-8">
                        <ProfitabilityIndicator
                            currentTurnover={metrics.totalSalesHT || 0}
                            breakEvenPoint={metrics.seuilRentabilite || 0}
                            pointMortDate={metrics.pointMortDate}
                            isOutOfRange={metrics.isPointMortOutOfRange}
                            actualCash={metrics.actualCash}
                        />
                        <ProfitabilityHistory history={historyData} />
                    </div>
                )}

                {/* 2.5 FINANCIAL ANALYSIS SECTION - SUPER ADMIN ONLY */}
                {(profile?.is_super_admin || profile?.role === 'admin' || profile?.role === 'manager') && (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border-white/5 bg-white/[0.01]">
                                <div className="flex items-center space-x-3 mb-8">
                                    <BarChart3 className="w-5 h-5 text-shop" />
                                    <h3 className="text-lg font-black uppercase tracking-tight">Analyse de Performance</h3>
                                </div>

                                <div className="space-y-8">
                                    <FinancialProgressBar
                                        label="Recettes"
                                        value={metrics.totalSales}
                                        total={metrics.totalSales + metrics.totalDebts}
                                        color="bg-shop"
                                        subLabel={`${((metrics.totalSales / (metrics.totalSales + metrics.totalDebts || 1)) * 100).toFixed(0)}% encaissé`}
                                    />
                                    <FinancialProgressBar
                                        label="Dépenses"
                                        value={metrics.totalExpenses}
                                        total={metrics.totalSales}
                                        color="bg-red-500"
                                        subLabel={`${((metrics.totalExpenses / (metrics.totalSales || 1)) * 100).toFixed(0)}% du CA`}
                                    />
                                    <FinancialProgressBar
                                        label="Dettes Clients"
                                        value={metrics.totalDebts}
                                        total={metrics.totalSales + metrics.totalDebts}
                                        color="bg-orange-500"
                                        subLabel="À recouvrer"
                                    />
                                </div>
                            </div>

                            <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border-white/5 bg-white/[0.01] flex flex-col justify-center">
                                <div className="flex items-center space-x-3 mb-6">
                                    <ShieldAlert className="w-5 h-5 text-shop-secondary" />
                                    <h3 className="text-lg font-black uppercase tracking-tight">Santé Financière</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Profit Net</p>
                                        <h4 className={`text-xl font-black ${(metrics.margeNet || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(metrics.margeNet || 0).toLocaleString()} <span className="text-[10px]">CFA</span>
                                        </h4>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Cash Immobilisé</p>
                                        <h4 className="text-xl font-black text-orange-400">
                                            {(metrics.totalDebts || 0).toLocaleString()} <span className="text-[10px]">CFA</span>
                                        </h4>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-shop/5 border border-shop/10 rounded-2xl">
                                    <div className="flex items-start space-x-3">
                                        <AlertCircle className="w-4 h-4 text-shop mt-0.5" />
                                        <p className="text-[10px] font-bold text-white leading-relaxed uppercase">
                                            {metrics.totalDebts > metrics.margeNet
                                                ? "Attention : Vos dettes clients dépassent votre profit net. Risque de trésorerie élevé."
                                                : "Bonne gestion : Vos dettes sont maîtrisées par rapport à votre rentabilité."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* NEW: ADVANCED INDICATORS */}
                        <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border-white/5 bg-white/[0.01]">
                            <div className="flex items-center space-x-3 mb-6">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                                <h3 className="text-lg font-black uppercase tracking-tight">Indicateurs Stratégiques</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* 1. Seuil de Rentabilité */}
                                {/* Good if Total Sales >= Seuil Rentabilité */}
                                <FinancialCard
                                    title="Seuil de Rentabilité"
                                    value={metrics.seuilRentabilite}
                                    subValue={`Date: ${new Date(metrics.pointMortDate).toLocaleDateString()}`}
                                    desc={metrics.totalSales >= metrics.seuilRentabilite ? "Objectif Atteint" : "Objectif Non Atteint"}
                                    color={metrics.totalSales >= metrics.seuilRentabilite ? "green-400" : "red-400"}
                                    icon={<Target className="w-4 h-4" />}
                                />
                                {/* 2. Rotation Stocks */}
                                {/* Standard: Higher is better. Let's say > 3 is Good, < 1 is Bad */}
                                <FinancialCard
                                    title="Rotation Stock"
                                    value={metrics.stockRotation?.toFixed(2)}
                                    suffix=" fois/an"
                                    subValue={`Durée moy: ${metrics.stockDurationDays?.toFixed(0)} jours`}
                                    desc="Vitesse d'écoulement"
                                    color={(metrics.stockRotation || 0) > 3 ? "green-400" : (metrics.stockRotation || 0) > 1 ? "orange-400" : "red-400"}
                                    icon={<RefreshCw className="w-4 h-4" />}
                                />
                                {/* 3. BFR */}
                                {/* If CAF > BFR, it's good (Auto-financed). If BFR is huge, it's bad. */}
                                <FinancialCard
                                    title="B.F.R"
                                    value={metrics.bfr}
                                    subValue="Besoin en Fonds de Roulement"
                                    desc={(metrics.caf || 0) >= (metrics.bfr || 0) ? "Couvert par la CAF" : "Besoin de financement"}
                                    color={(metrics.caf || 0) >= (metrics.bfr || 0) ? "green-400" : "orange-400"}
                                    icon={<Scale className="w-4 h-4" />}
                                />
                                {/* 4. CAF */}
                                {/* Positive is Good */}
                                <FinancialCard
                                    title="C.A.F"
                                    value={metrics.caf}
                                    subValue="Capacité d'Autofinancement"
                                    desc="Ressource interne générée"
                                    color={(metrics.caf || 0) > 0 ? "green-400" : "red-400"}
                                    icon={<PiggyBank className="w-4 h-4" />}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* 3. SALES JOURNAL */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Ventes Récentes</h3>
                            <Link href="/sales/history" className="text-[9px] sm:text-[10px] font-black text-shop hover:underline uppercase tracking-widest">Voir tout</Link>
                        </div>
                        <div className="glass-panel rounded-[24px] sm:rounded-[32px] overflow-hidden border-white/5">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[400px]">
                                    <tbody className="divide-y divide-white/5">
                                        {sales.length > 0 ? sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex items-center space-x-3 sm:space-x-4">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-shop">
                                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-xs sm:text-sm">{new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                            <div className="flex items-center space-x-2">
                                                                <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase opacity-50">{new Date(sale.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                                {sale.profiles?.email && (
                                                                    <p className="text-[9px] font-black text-shop uppercase tracking-widest bg-shop/5 px-1.5 rounded">Par: {sale.profiles.email.split('@')[0]}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                    <div className="flex items-center space-x-2">
                                                        {sale.payment_method === 'Cash' ? <Banknote className="w-3.5 h-3.5 text-green-400" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">{sale.payment_method}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                                                        <span className="text-sm sm:text-base font-black text-white group-hover:text-shop transition-colors">
                                                            {Number(sale.total_amount).toLocaleString()}
                                                        </span>
                                                        <button
                                                            onClick={() => handleViewReceipt(sale)}
                                                            className="p-1.5 sm:p-2 glass-card rounded-lg text-muted-foreground hover:text-shop transition-all"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td className="p-12 text-center opacity-30 font-black uppercase text-[10px]">Aucune vente</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 4. ACTIONS & BEST SELLERS */}
                    <div className="space-y-6 sm:space-y-8 order-1 lg:order-2">
                        <div className="space-y-3 sm:space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Accès Rapides</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
                                <QuickLink href="/sales" title="POS" icon={<ShoppingBag />} color="shop" />
                                {(profile?.role === 'admin' || profile?.role === 'manager') && (
                                    <QuickLink href="/inventory" title="Stocks" icon={<Package />} color="shop-secondary" />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Top Ventes</h3>
                            <div className="glass-panel rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 space-y-3 sm:space-y-4 border-white/5 bg-white/[0.01]">
                                {topProducts.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <span className="text-[10px] sm:text-[11px] font-black text-shop w-3 sm:w-4">{i + 1}.</span>
                                            <p className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">{p.name}</p>
                                        </div>
                                        <p className="text-[10px] sm:text-[11px] font-black text-muted-foreground">{p.totalQuantity} <span className="opacity-50 text-[8px] sm:text-[9px]">u.</span></p>
                                    </div>
                                ))}
                                {topProducts.length === 0 && (
                                    <div className="text-center opacity-20 py-6 sm:py-8"><PieChart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" /></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Receipt Reprint Modal */}
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                saleData={selectedSaleForReceipt}
                shop={activeShop || { name: 'LUXYA' }}
            />
        </div>
    )
}

function FinancialProgressBar({ label, value, total, color, subLabel }: any) {
    const percentage = Math.min(100, (value / (total || 1)) * 100);
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[11px] font-black uppercase text-white">{label}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{subLabel}</p>
                </div>
                <p className="text-sm font-black text-white">{value.toLocaleString()} <span className="text-[10px] opacity-50">CFA</span></p>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function ChartTooltip({ value, label, color = "bg-black/80" }: { value: number, label: string, color?: string }) {
    return (
        <div className={`opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 ${color} backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap shadow-2xl z-50 pointer-events-none border border-white/10 transition-all scale-90 group-hover:scale-100`}>
            {label}<br /><span className="text-xs">{value.toLocaleString()} CFA</span>
        </div>
    )
}

function MetricMiniCard({ title, value, icon, color, trend }: any) {
    const displayValue = (value || 0).toLocaleString()
    
    // Safety mapping for icons and colors
    const colorStyles: any = {
        "shop": "text-shop shadow-[0_0_15px_rgba(var(--shop-primary),0.3)]",
        "green-400": "text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]",
        "purple-400": "text-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]",
        "red-400": "text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]",
    }

    return (
        <div className="glass-card p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] border-white/5 flex flex-col justify-between group relative overflow-hidden transition-all hover:scale-[1.02] hover:border-white/10">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center ${colorStyles[color] || 'text-white'} transition-transform group-hover:scale-110`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 sm:w-7 sm:h-7" })}
                </div>
                <div className="text-right">
                    <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">{trend}</span>
                </div>
            </div>
            
            <div className="relative z-10 space-y-1">
                <p className="text-[9px] sm:text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
                <div className="flex items-baseline space-x-2">
                    <h4 className="text-xl sm:text-3xl font-black tracking-tighter italic">{displayValue}</h4>
                    <span className="text-[8px] sm:text-[10px] font-bold opacity-30">CFA</span>
                </div>
            </div>
            
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-${color === 'shop' ? 'shop' : color}/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000`} />
        </div>
    )
}

function QuickLink({ href, title, icon, color }: any) {
    const colorClasses: any = {
        "shop": "text-shop bg-shop/10 border-shop/20",
        "shop-secondary": "text-shop-secondary bg-shop-secondary/10 border-shop-secondary/20"
    }

    return (
        <Link href={href} className="group flex items-center justify-between p-6 glass-card rounded-[32px] border-white/5 hover:border-white/20 transition-all active:scale-[0.98] relative overflow-hidden">
            <div className="flex items-center space-x-5 relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${colorClasses[color] || 'bg-white/10 border-white/5'}`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 sm:w-7 sm:h-7' })}
                </div>
                <div>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] text-white">{title}</span>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Accès instantané</p>
                </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-white group-hover:translate-x-2 transition-all relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </Link>
    )
}

function FinancialCard({ title, value, subValue, desc, color, icon, suffix = " CFA" }: any) {
    // Determine if value is a number to format it, or display as is
    const displayValue = typeof value === 'number' ? value.toLocaleString() : value

    // Map colors to full Tailwind classes to ensure they aren't purged
    const colorStyles: any = {
        "purple-400": { bg: "bg-purple-400/10", text: "text-purple-400", glow: "bg-purple-400/5", glowHover: "group-hover:bg-purple-400/10" },
        "blue-400": { bg: "bg-blue-400/10", text: "text-blue-400", glow: "bg-blue-400/5", glowHover: "group-hover:bg-blue-400/10" },
        "orange-400": { bg: "bg-orange-400/10", text: "text-orange-400", glow: "bg-orange-400/5", glowHover: "group-hover:bg-orange-400/10" },
        "green-400": { bg: "bg-green-400/10", text: "text-green-400", glow: "bg-green-400/5", glowHover: "group-hover:bg-green-400/10" },
        "red-400": { bg: "bg-red-400/10", text: "text-red-400", glow: "bg-red-400/5", glowHover: "group-hover:bg-red-400/10" },
    }

    const styles = colorStyles[color] || colorStyles["blue-400"]

    return (
        <div className="glass-card p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-colors group relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
                        {icon}
                    </div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{title}</p>
                </div>

                <h4 className="text-lg font-black text-white mb-0.5">
                    {displayValue}<span className="text-[9px] opacity-60 ml-0.5">{suffix}</span>
                </h4>

                <p className="text-[9px] font-bold text-white/60 mb-2 truncate">{subValue}</p>

                <div className="h-px w-full bg-white/10 mb-2" />

                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">{desc}</p>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${styles.glow} rounded-full blur-xl ${styles.glowHover} transition-all`} />
        </div>
    )
}
