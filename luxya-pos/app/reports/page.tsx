'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    BarChart3, Calendar, Download, TrendingUp, TrendingDown,
    DollarSign, Filter, Loader2, ChevronRight, FilePieChart,
    ArrowUpRight, ArrowDownLeft, CalendarDays, CalendarRange, Zap, X, Globe
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/client'
import * as XLSX from 'xlsx'
import { redirect } from 'next/navigation'
import { useUser } from '@/context/UserContext'

type ReportPeriod = 'day' | 'month' | 'year'

export default function ReportsPage() {
    const { activeShop } = useShop()
    const { profile, loading: profileLoading } = useUser()
    const { showToast } = useToast()
    const supabase = createClient()

    // 🔐 Security Check: Only Admin and Manager can see reports
    useEffect(() => {
        if (!profileLoading && profile?.role !== 'admin' && profile?.role !== 'manager') {
            redirect('/sales?error=unauthorized_reports')
        }
    }, [profile, profileLoading])

    const [period, setPeriod] = useState<ReportPeriod>('month')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        revenue: 0,
        expenses: 0,
        margin: 0,
        salesCount: 0,
        avgTicket: 0
    })
    const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([])
    const [detailedSales, setDetailedSales] = useState<any[]>([])

    // n8n Integration State
    const [isN8nModalOpen, setIsN8nModalOpen] = useState(false)
    const [webhookUrl, setWebhookUrl] = useState(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || '')
    const [sendingToN8n, setSendingToN8n] = useState(false)

    useEffect(() => {
        const savedUrl = localStorage.getItem('n8n_report_webhook')
        if (savedUrl) setWebhookUrl(savedUrl)
    }, [])

    useEffect(() => {
        if (activeShop) {
            fetchReportData()
        }
    }, [activeShop, period, selectedDate])

    const fetchReportData = async () => {
        setLoading(true)
        try {
            const date = new Date(selectedDate)
            let start = new Date(date)
            let end = new Date(date)

            if (period === 'day') {
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
            } else if (period === 'month') {
                start = new Date(date.getFullYear(), date.getMonth(), 1)
                end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
            } else if (period === 'year') {
                start = new Date(date.getFullYear(), 0, 1)
                end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
            }

            const isoStart = start.toISOString()
            const isoEnd = end.toISOString()

            // 1. Fetch Sales
            const { data: sales, error: sErr } = await supabase
                .from('sales')
                .select('*')
                .eq('shop_id', activeShop?.id)
                .gte('created_at', isoStart)
                .lte('created_at', isoEnd)

            if (sErr) throw sErr

            // 2. Fetch Expenses
            const { data: expenses, error: eErr } = await supabase
                .from('expenses')
                .select('*')
                .eq('shop_id', activeShop?.id)
                .gte('date', isoStart)
                .lte('date', isoEnd)

            if (eErr) throw eErr

            // Calculate Stats
            const totalRev = sales?.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0) || 0
            const totalExp = expenses?.reduce((acc, e) => acc + (Number(e.amount) || 0), 0) || 0

            setStats({
                revenue: totalRev,
                expenses: totalExp,
                margin: totalRev - totalExp,
                salesCount: sales?.length || 0,
                avgTicket: sales?.length ? totalRev / sales.length : 0
            })

            setDetailedSales(sales || [])

            // Breakdown by category (mock/simplified for now)
            // In a real app, we'd join with sale_items and categories
            setCategoryBreakdown([
                { name: 'Ventes Directes', value: totalRev, color: 'text-green-400' },
                { name: 'Charges Fixes', value: totalExp, color: 'text-red-400' }
            ])

        } catch (err: any) {
            showToast("Erreur lors de la génération du rapport", "error")
        } finally {
            setLoading(false)
        }
    }

    const pushToN8n = async () => {
        if (!webhookUrl) return showToast("Veuillez saisir une URL de Webhook", "warning")

        setSendingToN8n(true)
        try {
            const payload = {
                timestamp: new Date().toISOString(),
                shop: activeShop?.name,
                period,
                date: selectedDate,
                metrics: stats,
                sales_count: detailedSales.length,
                generated_by: 'Lolly Agency CRM'
            }

            // Route through our server-side proxy to avoid browser CORS blocks
            const res = await fetch('/api/webhook-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ webhookUrl, payload })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Erreur inconnue")
            }
            localStorage.setItem('n8n_report_webhook', webhookUrl)
            showToast("Données envoyées à n8n !", "success")
            setIsN8nModalOpen(false)
        } catch (err: any) {
            showToast(`Échec de l'envoi : ${err.message}`, "error")
        } finally {
            setSendingToN8n(false)
        }
    }

    const exportToExcel = () => {
        try {
            const data = detailedSales.map(s => ({
                Date: new Date(s.created_at).toLocaleDateString(),
                Client: s.customer_name || 'Client Comptant',
                Total: s.totalAmount,
                Mode: s.paymentMethod,
                Status: s.status || 'Payé'
            }))

            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Ventes")
            XLSX.writeFile(wb, `Rapport_Lolly_${period}_${selectedDate}.xlsx`)
            showToast("Rapport exporté !", "success")
        } catch (err) {
            showToast("Erreur d'export", "error")
        }
    }

    if (!activeShop) return null

    return (
        <div className="min-h-screen p-4 sm:p-8 space-y-10 bg-[#050505] text-white">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-shop/20 rounded-3xl flex items-center justify-center text-shop shadow-2xl border border-shop/20 animate-pulse">
                        <BarChart3 className="w-9 h-9" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter shop-gradient-text">Rapports & Stats</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Analyse de performance • {activeShop.name}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-white/5 p-1.5 rounded-2xl flex border border-white/5">
                        {(['day', 'month', 'year'] as ReportPeriod[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground hover:text-white'
                                    }`}
                            >
                                {p === 'day' ? 'Jour' : p === 'month' ? 'Mois' : 'Année'}
                            </button>
                        ))}
                    </div>

                    <input
                        type={period === 'year' ? 'number' : period === 'month' ? 'month' : 'date'}
                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <button
                        onClick={exportToExcel}
                        className="p-3.5 bg-green-500 rounded-2xl text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-green-500/20"
                        title="Exporter Excel"
                    >
                        <Download className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setIsN8nModalOpen(true)}
                        className="p-3.5 bg-shop/20 text-shop border border-shop/20 rounded-2xl hover:bg-shop hover:text-white transition-all shadow-xl"
                        title="Analyser sur n8n"
                    >
                        <Zap className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-shop animate-spin opacity-20" />
                </div>
            ) : (
                <>
                    {/* Main Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Chiffre d'Affaires"
                            value={stats.revenue}
                            icon={<TrendingUp className="w-6 h-6" />}
                            color="shop"
                        />
                        <StatCard
                            title="Total Dépenses"
                            value={stats.expenses}
                            icon={<TrendingDown className="w-6 h-6" />}
                            color="red"
                        />
                        <StatCard
                            title="Marge Nette"
                            value={stats.margin}
                            icon={<DollarSign className="w-6 h-6" />}
                            color="green"
                            highlight
                        />
                        <StatCard
                            title="Volume Ventes"
                            value={stats.salesCount}
                            icon={<Calendar className="w-6 h-6" />}
                            subtitle={`Panier moyen: ${Math.round(stats.avgTicket).toLocaleString()} CFA`}
                            color="blue"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                        {/* Period Journal */}
                        <div className="lg:col-span-2 glass-panel p-10 rounded-[48px] border-white/5">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Journal Global de la Période</h3>
                            <div className="space-y-4">
                                {detailedSales.slice(0, 10).map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between p-6 glass-card rounded-3xl hover:border-white/10 transition-all border-transparent">
                                        <div className="flex items-center space-x-5">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-xs text-muted-foreground border border-white/5 uppercase">
                                                {sale.paymentMethod?.slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-white uppercase tracking-tight">{sale.customer_name || 'Client Comptant'}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{new Date(sale.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white">{Number(sale.totalAmount).toLocaleString()} CFA</p>
                                            <p className="text-[9px] text-shop font-black uppercase tracking-widest">#{sale.invoice_number || sale.id}</p>
                                        </div>
                                    </div>
                                ))}
                                {detailedSales.length === 0 && (
                                    <div className="h-60 flex flex-col items-center justify-center opacity-10">
                                        <FilePieChart className="w-20 h-20 mb-4" />
                                        <p className="text-sm font-black uppercase tracking-[0.2em]">Aucune transaction sur cette période</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="glass-panel p-10 rounded-[48px] border-white/5">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8">Répartition</h3>
                            <div className="space-y-6">
                                {categoryBreakdown.map((cat, i) => (
                                    <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{cat.name}</span>
                                            <span className={`text-sm font-black ${cat.color}`}>{Math.round((cat.value / (stats.revenue + stats.expenses)) * 100) || 0}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${cat.color.replace('text', 'bg')} transition-all duration-1000`}
                                                style={{ width: `${(cat.value / (stats.revenue + stats.expenses)) * 100 || 0}%` }}
                                            />
                                        </div>
                                        <div className="mt-4 text-right">
                                            <span className="text-lg font-black text-white">{Number(cat.value).toLocaleString()} CFA</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* n8n Integration Modal */}
            {isN8nModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-background/40 animate-in fade-in duration-300">
                    <div className="relative glass-card w-full max-w-lg p-12 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsN8nModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                            <X className="w-6 h-6 text-white" />
                        </button>

                        <div className="flex items-center space-x-5 mb-10">
                            <div className="w-16 h-16 bg-shop/20 text-shop border border-shop/20 rounded-3xl flex items-center justify-center shadow-2xl">
                                <Zap className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Analyse n8n</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">Export Data via Webhook</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 bg-shop/5 border border-shop/20 rounded-3xl space-y-3">
                                <div className="flex items-center space-x-3 text-shop">
                                    <Globe className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Webhook URL</span>
                                </div>
                                <input
                                    type="text"
                                    placeholder="https://n8n.votredomaine.com/webhook/..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white placeholder:opacity-20"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                />
                                <p className="text-[9px] text-muted-foreground font-medium italic">Collez ici l'URL de votre "Webhook Node" dans n8n.</p>
                            </div>

                            <button
                                onClick={pushToN8n}
                                disabled={sendingToN8n || !webhookUrl}
                                className="w-full py-6 bg-shop hover:bg-shop/90 text-white rounded-[28px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-shop/20 active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                            >
                                {sendingToN8n ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                <span>Envoyer les données à l'Analyseur</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ title, value, icon, color, highlight, subtitle }: any) {
    const colorClasses: any = {
        shop: 'bg-shop/10 text-shop border-shop/20 shadow-shop/10',
        red: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10',
        green: 'bg-green-500/10 text-green-500 border-green-500/20 shadow-green-500/10',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/10'
    }

    return (
        <div className={`glass-panel p-8 rounded-[40px] border-white/5 transition-all hover:scale-[1.02] ${highlight ? 'ring-2 ring-green-500/20 bg-green-500/[0.02]' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2">{title}</p>
                <h4 className="text-3xl font-black tracking-tighter text-white">
                    {typeof value === 'number' ? `${value.toLocaleString()} CFA` : value}
                </h4>
                {subtitle && <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">{subtitle}</p>}
            </div>
        </div>
    )
}
