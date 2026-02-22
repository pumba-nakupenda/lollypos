
'use client'

import React, { useState, useEffect } from 'react'
import { 
    ShoppingBag, 
    ArrowLeft, 
    Calendar, 
    Clock, 
    User, 
    CreditCard, 
    Banknote, 
    Search, 
    Filter,
    ArrowRight,
    Loader2,
    Store
} from 'lucide-react'
import Link from 'next/link'
import { useShop } from '@/context/ShopContext'
import { API_URL } from '@/utils/api'

export default function SalesHistoryPage() {
    const { activeShop } = useShop()
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSales()
    }, [activeShop])

    const fetchSales = async () => {
        try {
            setLoading(true)
            const url = activeShop ? `${API_URL}/sales?shopId=${activeShop.id}` : `${API_URL}/sales`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setSales(data)
            } else {
                setError('Erreur lors du chargement des ventes')
            }
        } catch (err) {
            setError('Erreur de connexion au serveur')
        } finally {
            setLoading(false)
        }
    }

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0)

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-panel sticky top-0 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <Link href="/sales" className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-shop transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="h-8 w-px bg-white/10" />
                        <div>
                            <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Historique</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Journal des Ventes</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right mr-4 hidden md:block">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Période</p>
                            <p className="text-lg font-black text-shop">{totalRevenue.toLocaleString()} FCFA</p>
                        </div>
                        <button onClick={fetchSales} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-shop transition-all">
                            <Clock className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 space-y-8">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une transaction..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all"
                        />
                    </div>
                    <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between border-white/5">
                        <Calendar className="w-4 h-4 text-shop mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest">Aujourd'hui</span>
                        <Filter className="w-3 h-3 text-muted-foreground ml-2" />
                    </div>
                    <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between border-white/5">
                        <Store className="w-4 h-4 text-shop-secondary mr-2" />
                        <span className="text-xs font-black uppercase tracking-widest truncate">{activeShop?.name || 'Tous'}</span>
                    </div>
                </div>

                {/* Sales List */}
                <div className="glass-panel rounded-[40px] overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-12 h-12 text-shop animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chargement du journal...</p>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="p-20 text-center opacity-20">
                            <ShoppingBag className="w-20 h-20 mx-auto mb-4" />
                            <p className="text-xl font-black uppercase">Aucune vente enregistrée</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Heure & Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Méthode</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Boutique</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Montant</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-muted-foreground group-hover:text-shop transition-colors">
                                                    <Clock className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-white">
                                                        {new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                                                        {new Date(sale.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-2">
                                                {sale.payment_method === 'Cash' ? <Banknote className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-blue-400" />}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{sale.payment_method}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-shop/60">{sale.shop_id === 1 ? 'Luxya' : 'Homtek'}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end space-x-4">
                                                <span className="text-lg font-black text-white group-hover:text-shop transition-colors">
                                                    {Number(sale.total_amount).toLocaleString()} FCFA
                                                </span>
                                                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    )
}
