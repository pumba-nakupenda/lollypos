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
import { API_URL } from '@/utils/api'

export default function DashboardContent({ user }: { user: any }) {
    const { profile, loading: userLoading, error: profileError } = useUser()
    const { activeShop } = useShop()
    const { showToast } = useToast()

    // States for merged data
    const [analytics, setAnalytics] = useState<any>(null)
    const [sales, setSales] = useState<any[]>([])
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
            const [analyticsRes, salesRes, forecastRes] = await Promise.all([
                fetch(`/api/analytics?shopId=${shopId}&category=${selectedCategory}&month=${selectedMonth}&year=${selectedYear}`),
                fetch(`${API_URL}/sales?shopId=${shopId === 'all' ? '' : shopId}`),
                fetch(`${API_URL}/ai/forecast?shopId=${shopId === 'all' ? '' : shopId}`)
            ])

            if (analyticsRes.ok && salesRes.ok) {
                const aData = await analyticsRes.json()
                const sData = await salesRes.json()
                setAnalytics(aData)

                if (forecastRes.ok) {
                    const fData = await forecastRes.json()
                    setAiForecast(fData.predictions || [0, 0, 0])
                }

                // Filter recent sales list to match the selected month too for consistency
                const filteredRecentSales = sData.filter((s: any) => {
                    const d = new Date(s.created_at)
                    return (d.getMonth() + 1).toString().padStart(2, '0') === selectedMonth && d.getFullYear().toString() === selectedYear
                })
                setSales(filteredRecentSales.slice(0, 8))
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleViewReceipt = async (sale: any) => {
        try {
            // Fetch items for this specific sale using the new efficient endpoint
            const res = await fetch(`${API_URL}/sales/${sale.id}/items`)
            if (res.ok) {
                const saleItems = await res.json()

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
            } else {
                showToast("Impossible de récupérer les détails de cette vente", "error")
            }
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
        totalDebts: 0
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
        <div className="min-h-screen flex flex-col pb-12">
            {/* Header / Navigation */}
            <header className="glass-panel sticky top-0 z-[60] border-b-0 m-2 sm:m-4 rounded-[20px] sm:rounded-[24px] shadow-xl">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shop rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <h1 className="text-sm sm:text-xl font-black shop-gradient-text uppercase tracking-tighter">
                                <span className="brand-lolly">Lolly</span>
                            </h1>
                        </div>
                        <div className="h-6 sm:h-8 w-px bg-white/10" />
                        <div className="scale-90 sm:scale-100 origin-left">
                            <ShopSelector />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="hidden lg:block">
                            <CustomDropdown
                                options={monthOptions}
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                className="w-40"
                            />
                        </div>
                        <div className="hidden lg:block">
                            <CustomDropdown
                                options={categoryOptions}
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                className="w-48"
                            />
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-1 hidden lg:block" />
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

                {/* 1. KEY METRICS */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    <MetricMiniCard title="Revenus" value={metrics.totalSales} icon={<DollarSign className="w-4 h-4" />} color="shop" trend="+12%" />
                    {profile?.is_super_admin && (
                        <>
                            <MetricMiniCard title="Marge Brute" value={metrics.margeBrute} icon={<TrendingUp className="w-4 h-4" />} color="blue-400" trend="+15%" />
                            <MetricMiniCard title="Marge Net" value={metrics.margeNet} icon={<PieChart className="w-4 h-4" />} color="green-400" trend="+18%" />
                            <MetricMiniCard title="Depenses" value={metrics.totalExpenses} icon={<TrendingDown className="w-4 h-4" />} color="red-400" trend="+2%" />
                            <MetricMiniCard title="TVA (18%)" value={metrics.tva} icon={<Receipt className="w-4 h-4" />} color="orange-400" trend="Fixe" />
                            <MetricMiniCard title="Profit" value={metrics.profit} icon={<TrendingUp className="w-4 h-4" />} color="green-400" trend="+10%" />
                        </>
                    )}
                </div>

                {/* Mobile Filters (Only visible on small screens) */}
                <div className="grid grid-cols-2 gap-3 lg:hidden">
                    <CustomDropdown options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} className="w-full" />
                    <CustomDropdown options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} className="w-full" />
                </div>

                {/* 2. CASH FLOW CHART */}
                <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-4 sm:p-8 border-white/5 bg-white/[0.01]">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                        <div>
                            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">Flux de Trésorerie</h3>
                            <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Comparaison 7 derniers jours</p>
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-shop" />
                                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-muted-foreground">Ventes</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full border border-shop border-dashed bg-transparent" />
                                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-shop/60">Prévisions IA</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-muted-foreground">Dépenses</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-48 sm:h-56 flex items-end justify-between space-x-1.5 sm:space-x-4 px-1 sm:px-2 relative">
                        {trend.map((day: any, i: number) => {
                            const maxVal = Math.max(...trend.map((d: any) => Math.max(d.income, d.outcome)), ...aiForecast) || 1
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    <div className="flex w-full justify-center items-end space-x-0.5 sm:space-x-1 h-full pb-1 sm:pb-2">
                                        <div
                                            className="w-full bg-shop/30 border-t border-shop/50 rounded-t-sm transition-all group-hover:bg-shop animate-in slide-in-from-bottom-full duration-1000 relative"
                                            style={{
                                                height: `${(day.income / maxVal) * 100}%`,
                                                animationDelay: `${i * 50}ms`,
                                                animationFillMode: 'both'
                                            }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-2 py-1 rounded text-[9px] font-black whitespace-nowrap shadow-xl z-50 pointer-events-none border border-white/10 transition-all">
                                                {day.income.toLocaleString()} CFA
                                            </div>
                                        </div>
                                        <div
                                            className="w-full bg-red-500/20 border-t border-red-500/30 rounded-t-sm transition-all group-hover:bg-red-500/50 animate-in slide-in-from-bottom-full duration-1000 relative"
                                            style={{
                                                height: `${(day.outcome / maxVal) * 100}%`,
                                                animationDelay: `${(i * 50) + 200}ms`,
                                                animationFillMode: 'both'
                                            }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-red-900/90 backdrop-blur-md text-white px-2 py-1 rounded text-[9px] font-black whitespace-nowrap shadow-xl z-50 pointer-events-none border border-white/10 transition-all">
                                                -{day.outcome.toLocaleString()} CFA
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[6px] sm:text-[8px] font-black text-muted-foreground uppercase opacity-50 mt-1 sm:mt-2">{day.date.split('-')[2]}</span>
                                </div>
                            )
                        })}
                        {/* AI FORECAST PREVIEW */}
                        {aiForecast.map((value, i) => {
                            const maxVal = Math.max(...trend.map((d: any) => Math.max(d.income, d.outcome)), ...aiForecast) || 1
                            return (
                                <div key={`f-${i}`} className="flex-1 flex flex-col items-center group relative h-full justify-end opacity-60">
                                    <div className="flex w-full justify-center items-end h-full pb-1 sm:pb-2">
                                        <div
                                            className="w-full border-2 border-shop border-dashed rounded-t-lg bg-shop/5 animate-in slide-in-from-bottom-full duration-1000 relative"
                                            style={{
                                                height: `${(value / maxVal) * 100}%`,
                                                animationDelay: `${(trend.length + i) * 50}ms`,
                                                animationFillMode: 'both'
                                            }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-shop/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap shadow-2xl z-50 pointer-events-none border border-white/20 transition-all">
                                                IA PRÉDIT<br />
                                                <span className="text-sm">+{Math.round(value).toLocaleString()} CFA</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[7px] font-black text-shop/40 uppercase mt-1 sm:mt-2">J+{i + 1}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2.5 FINANCIAL ANALYSIS SECTION - SUPER ADMIN ONLY */}
                {profile?.is_super_admin && (
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
                                <FinancialCard
                                    title="Seuil de Rentabilité"
                                    value={metrics.seuilRentabilite}
                                    subValue={`Date: ${new Date(metrics.pointMortDate).toLocaleDateString()}`}
                                    desc="CA Minimum à atteindre"
                                    color="purple-400"
                                    icon={<Target className="w-4 h-4" />}
                                />
                                {/* 2. Rotation Stocks */}
                                <FinancialCard
                                    title="Rotation Stock"
                                    value={metrics.stockRotation?.toFixed(2)}
                                    suffix=" fois/an"
                                    subValue={`Durée moy: ${metrics.stockDurationDays?.toFixed(0)} jours`}
                                    desc="Vitesse d'écoulement"
                                    color="blue-400"
                                    icon={<RefreshCw className="w-4 h-4" />}
                                />
                                {/* 3. BFR */}
                                <FinancialCard
                                    title="B.F.R"
                                    value={metrics.bfr}
                                    subValue="Besoin en Fonds de Roulement"
                                    desc="Cash nécessaire à l'exploitation"
                                    color="orange-400"
                                    icon={<Scale className="w-4 h-4" />}
                                />
                                {/* 4. CAF */}
                                <FinancialCard
                                    title="C.A.F"
                                    value={metrics.caf}
                                    subValue="Capacité d'Autofinancement"
                                    desc="Ressource interne générée"
                                    color="green-400"
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
                                                                <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase opacity-50">{new Date(sale.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                                                                {sale.profiles?.email && (
                                                                    <p className="text-[7px] font-black text-shop uppercase tracking-widest bg-shop/5 px-1 rounded">Par: {sale.profiles.email.split('@')[0]}</p>
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
                                            <span className="text-[9px] sm:text-[10px] font-black text-shop w-3 sm:w-4">{i + 1}.</span>
                                            <p className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">{p.name}</p>
                                        </div>
                                        <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground">{p.totalQuantity} <span className="opacity-50 text-[7px] sm:text-[8px]">u.</span></p>
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
                    <p className="text-[10px] font-black uppercase text-white">{label}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{subLabel}</p>
                </div>
                <p className="text-sm font-black text-white">{value.toLocaleString()} <span className="text-[8px] opacity-50">CFA</span></p>
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

function MetricMiniCard({ title, value, icon, color, trend }: any) {
    const displayValue = (value || 0).toLocaleString()
    return (
        <div className="glass-card p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border-white/5 flex items-center justify-between group relative overflow-hidden h-full">
            <div className="relative z-10 min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">{title}</p>
                <div className="flex items-baseline space-x-1 sm:space-x-2 overflow-hidden">
                    <h4 className="text-lg sm:text-2xl font-black truncate">{displayValue}</h4>
                    <span className="text-[7px] sm:text-[8px] font-bold opacity-50 shrink-0">CFA</span>
                </div>
                <div className="mt-1 sm:mt-2 flex items-center text-[7px] sm:text-[8px] font-black uppercase text-green-400">
                    <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> {trend}
                </div>
            </div>
            <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-${color} shrink-0 ml-2`}>
                {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4 sm:w-6 sm:h-6" })}
            </div>
        </div>
    )
}

function QuickLink({ href, title, icon, color }: any) {
    return (
        <Link href={href} className="group flex items-center justify-between p-5 glass-card rounded-[24px] border-white/5 hover:border-shop/30 transition-all active:scale-[0.98]">
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-${color} group-hover:bg-shop group-hover:text-white transition-all`}>
                    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{title}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-shop group-hover:translate-x-1 transition-all" />
        </Link>
    )
}

function FinancialCard({ title, value, subValue, desc, color, icon, suffix = " CFA" }: any) {
    // Determine if value is a number to format it, or display as is
    const displayValue = typeof value === 'number' ? value.toLocaleString() : value

    return (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.07] transition-colors group relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2 rounded-lg bg-${color}/10 text-${color}`}>
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
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${color}/5 rounded-full blur-xl group-hover:bg-${color}/10 transition-all`} />
        </div>
    )
}