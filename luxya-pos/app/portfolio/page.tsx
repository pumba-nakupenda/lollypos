'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
    Users, Search, FileText, TrendingDown, Clock, ArrowRight,
    Printer, Download, Filter, User, Calendar, DollarSign,
    CheckCircle2, AlertCircle, Loader2, LayoutDashboard, ChevronRight
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import { API_URL } from '@/utils/api'
import CustomDropdown from '@/components/CustomDropdown'

export default function AgencyPortfolioPage() {
    const supabase = useMemo(() => createClient(), [])
    const { activeShop } = useShop()
    const { showToast } = useToast()

    const [customers, setCustomers] = useState<any[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

    const [documents, setDocuments] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingDocList, setLoadingDocList] = useState(false)

    useEffect(() => {
        fetchCustomers()
    }, [activeShop])

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('shop_id', 3) // Hardcoded for Agency or use activeShop?.id if safe
                .order('name')
            if (error) throw error
            setCustomers(data || [])
        } catch (err) {
            console.error('Fetch customers error', err)
        }
    }

    const fetchPortfolio = async (customerId: string) => {
        try {
            setLoadingDocList(true)
            const customer = customers.find(c => c.id === customerId)
            setSelectedCustomer(customer)

            // 1. Fetch Sales (Invoices, BL, etc.)
            // We search by customer_id OR customer_name (for legacy data)
            const { data: sales, error: salesError } = await supabase
                .from('sales')
                .select('*')
                .or(`customer_id.eq.${customerId},customer_name.eq.${customer.name}`)
                .order('created_at', { ascending: false })

            if (salesError) throw salesError

            setDocuments(sales || [])
        } catch (err) {
            showToast("Erreur lors du chargement du dossier", "error")
        } finally {
            setLoadingDocList(false)
        }
    }

    useEffect(() => {
        if (selectedCustomerId) {
            fetchPortfolio(selectedCustomerId)
        } else {
            setDocuments([])
            setSelectedCustomer(null)
        }
    }, [selectedCustomerId])

    const stats = useMemo(() => {
        const completedDocs = documents.filter(d => d.type !== 'quote' && d.status !== 'cancelled')
        const totalInvoiced = completedDocs.reduce((sum, d) => sum + Number(d.total_amount), 0)
        const totalPaid = completedDocs.reduce((sum, d) => sum + Number(d.paid_amount), 0)
        const balance = totalInvoiced - totalPaid

        return { totalInvoiced, totalPaid, balance, docCount: documents.length }
    }, [documents])

    return (
        <div className="min-h-screen flex flex-col pb-20">
            {/* Header */}
            <header className="glass-panel sticky top-4 z-50 mx-4 rounded-[24px] shadow-xl border-white/5">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-shop rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Portefeuille Client</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Lolly Agency • Relevé Général</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 max-w-sm w-full">
                        <CustomDropdown
                            options={customers.map(c => ({
                                label: c.name,
                                value: c.id,
                                icon: <User className="w-4 h-4" />
                            }))}
                            value={selectedCustomerId || ''}
                            onChange={setSelectedCustomerId}
                            placeholder="SÉLECTIONNER UN CLIENT..."
                            className="w-full"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 space-y-8 animate-in fade-in duration-500">
                {!selectedCustomerId ? (
                    <div className="glass-panel rounded-[40px] p-20 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                            <User className="w-12 h-12 text-muted-foreground opacity-20" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase text-white">Aucun client sélectionné</h2>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">Choisissez un client dans la liste pour consulter son historique complet et son solde de compte.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Client Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="glass-panel p-8 rounded-[40px] border-white/5 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-white/10 transition-colors">
                                    <FileText className="w-16 h-16 rotate-12" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Facturé</p>
                                <h3 className="text-2xl font-black text-white">{stats.totalInvoiced.toLocaleString()} <span className="text-xs">CFA</span></h3>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2">{stats.docCount} documents</p>
                            </div>

                            <div className="glass-panel p-8 rounded-[40px] border-white/5 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 text-green-500/5 group-hover:text-green-500/10 transition-colors">
                                    <CheckCircle2 className="w-16 h-16 -rotate-12" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Encaissé</p>
                                <h3 className="text-2xl font-black text-green-400">{stats.totalPaid.toLocaleString()} <span className="text-xs">CFA</span></h3>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2">Versement réels</p>
                            </div>

                            <div className="glass-panel p-8 rounded-[40px] border-white/5 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 text-red-500/5 group-hover:text-red-500/10 transition-colors">
                                    <AlertCircle className="w-16 h-16 rotate-6" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reste à Payer</p>
                                <h3 className="text-2xl font-black text-red-400">{stats.balance.toLocaleString()} <span className="text-xs">CFA</span></h3>
                                <div className="mt-2 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-500 h-full transition-all duration-1000"
                                        style={{ width: `${stats.totalInvoiced > 0 ? (stats.balance / stats.totalInvoiced * 100) : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="glass-panel p-8 rounded-[40px] border-white/5 flex flex-col justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Client sélectionné</p>
                                    <h3 className="text-lg font-black text-shop uppercase mt-2 truncate">{selectedCustomer?.name}</h3>
                                </div>
                                <div className="flex space-x-2 mt-4">
                                    <button className="flex-1 py-3 bg-white/5 rounded-2xl text-[8px] font-black uppercase hover:bg-white/10 transition-all flex items-center justify-center">
                                        <Printer className="w-3 h-3 mr-2" /> Relevé PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Documents Table */}
                        <div className="glass-panel rounded-[40px] overflow-hidden border-white/5 bg-white/[0.01]">
                            {loadingDocList ? (
                                <div className="p-20 flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="w-10 h-10 text-shop animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-white">Consolidation des données...</p>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-20 text-center opacity-30 font-black uppercase text-xs text-white">Aucun document trouvé pour ce client</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Document</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Type</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Total</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Réglé</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Solde</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Statut</th>
                                                <th className="px-8 py-6"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.map((doc) => {
                                                const remaining = Number(doc.total_amount) - Number(doc.paid_amount)
                                                return (
                                                    <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-white group-hover:text-shop transition-colors">{doc.invoice_number || `#${doc.id}`}</span>
                                                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${doc.type === 'quote' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                                    doc.type === 'invoice' ? 'bg-shop/10 text-shop border border-shop/20' :
                                                                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                }`}>
                                                                {doc.type === 'quote' ? 'Devis' : doc.type === 'invoice' ? 'Facture' : 'Bon de Livr.'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right font-black text-sm text-white">{Number(doc.total_amount).toLocaleString()}</td>
                                                        <td className="px-8 py-6 text-right font-black text-sm text-green-400">{Number(doc.paid_amount).toLocaleString()}</td>
                                                        <td className="px-8 py-6 text-right font-black text-sm text-red-100/40">
                                                            {remaining > 0 ? remaining.toLocaleString() : '-'}
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className="flex items-center justify-center">
                                                                {remaining <= 0 && doc.type !== 'quote' ? (
                                                                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    </div>
                                                                ) : remaining > 0 && doc.paid_amount > 0 ? (
                                                                    <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 bg-white/5 rounded-full" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                                                                <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
