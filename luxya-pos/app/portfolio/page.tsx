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
import { useUser } from '@/context/UserContext'
import { redirect } from 'next/navigation'
import { API_URL } from '@/utils/api'
import CustomDropdown from '@/components/CustomDropdown'

export default function AgencyPortfolioPage() {
    const supabase = useMemo(() => createClient(), [])
    const { activeShop } = useShop()
    const { profile, loading: profileLoading } = useUser()
    const { showToast } = useToast()

    // 🔐 Access Control
    useEffect(() => {
        const role = profile?.role as string;
        if (!profileLoading && role !== 'admin' && role !== 'manager' && role !== 'lead') {
            redirect('/sales?error=unauthorized_portfolio')
        }
    }, [profile, profileLoading])

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
        <div className="min-h-screen flex flex-col pb-24">
            {/* Header - Mobile Optimized */}
            <header className="glass-panel sticky top-0 sm:top-4 z-50 m-0 sm:m-4 rounded-none sm:rounded-[24px] shadow-xl border-white/5 bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 pl-10 lg:pl-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shop rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm sm:text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Portefeuille</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Relevé Général</p>
                        </div>
                    </div>

                    <div className="flex items-center max-w-full sm:max-w-sm w-full">
                        <CustomDropdown
                            options={customers.map(c => ({
                                label: c.name,
                                value: c.id,
                                icon: <User className="w-4 h-4" />
                            }))}
                            value={selectedCustomerId || ''}
                            onChange={setSelectedCustomerId}
                            placeholder="CHOISIR UN CLIENT..."
                            className="w-full"
                            searchable={true}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
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
                    <div className="space-y-6 sm:space-y-8">
                        {/* Client Summary Cards - Optimized Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                            <div className="glass-panel p-4 sm:p-8 rounded-[28px] sm:rounded-[40px] border-white/5 space-y-1 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 sm:p-6 text-white/5 group-hover:text-white/10 transition-colors">
                                    <FileText className="w-10 h-10 sm:w-16 sm:h-16 rotate-12" />
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Facturé</p>
                                <h3 className="text-sm sm:text-2xl font-black text-white">{stats.totalInvoiced.toLocaleString()}</h3>
                                <p className="text-[7px] sm:text-[8px] font-bold text-muted-foreground uppercase mt-1">{stats.docCount} docs</p>
                            </div>

                            <div className="glass-panel p-4 sm:p-8 rounded-[28px] sm:rounded-[40px] border-white/5 space-y-1 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 sm:p-6 text-green-500/5 group-hover:text-green-500/10 transition-colors">
                                    <CheckCircle2 className="w-10 h-10 sm:w-16 sm:h-16 -rotate-12" />
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest text-green-400/60">Encaissé</p>
                                <h3 className="text-sm sm:text-2xl font-black text-green-400">{stats.totalPaid.toLocaleString()}</h3>
                                <p className="text-[7px] sm:text-[8px] font-bold text-muted-foreground uppercase mt-1">Reçu</p>
                            </div>

                            <div className="glass-panel p-4 sm:p-8 rounded-[28px] sm:rounded-[40px] border-white/5 space-y-1 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 sm:p-6 text-red-500/5 group-hover:text-red-500/10 transition-colors">
                                    <AlertCircle className="w-10 h-10 sm:w-16 sm:h-16 rotate-6" />
                                </div>
                                <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest text-red-400/60">Solde</p>
                                <h3 className="text-sm sm:text-2xl font-black text-red-400">{stats.balance.toLocaleString()}</h3>
                                <div className="mt-1 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                    <div
                                        className="bg-red-500 h-full transition-all duration-1000"
                                        style={{ width: `${stats.totalInvoiced > 0 ? (stats.balance / stats.totalInvoiced * 100) : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="glass-panel p-4 sm:p-8 rounded-[28px] sm:rounded-[40px] border-white/5 flex flex-col justify-between relative overflow-hidden">
                                <div className="min-w-0">
                                    <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Client</p>
                                    <h3 className="text-xs sm:text-lg font-black text-shop uppercase mt-1 truncate">{selectedCustomer?.name}</h3>
                                </div>
                                <button className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[7px] sm:text-[8px] font-black uppercase transition-all flex items-center justify-center">
                                    <Printer className="w-3 h-3 mr-1.5" /> Relevé
                                </button>
                            </div>
                        </div>

                        {/* Documents List / Table Container */}
                        <div className="glass-panel rounded-[32px] sm:rounded-[40px] overflow-hidden border-white/5 bg-white/[0.01]">
                            <div className="p-6 sm:px-8 sm:py-6 border-b border-white/5 flex items-center justify-between">
                                <h4 className="text-sm sm:text-lg font-black uppercase tracking-tight text-white">Historique Documents</h4>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase bg-white/5 px-3 py-1 rounded-full">{documents.length} Dossiers</span>
                            </div>

                            {loadingDocList ? (
                                <div className="p-12 sm:p-20 flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-shop animate-spin" />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-30 text-white">Chargement...</p>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-12 sm:p-20 text-center opacity-30 font-black uppercase text-xs text-white">Aucun document</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {/* Desktop Table Header - Hidden on Mobile */}
                                    <div className="hidden lg:grid grid-cols-7 bg-white/5 px-8 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                        <div className="col-span-2">Document</div>
                                        <div>Type</div>
                                        <div className="text-right">Total</div>
                                        <div className="text-right">Réglé</div>
                                        <div className="text-right">Solde</div>
                                        <div className="text-center">Statut</div>
                                    </div>

                                    {documents.map((doc) => {
                                        const remaining = Number(doc.total_amount) - Number(doc.paid_amount)
                                        return (
                                            <div key={doc.id} className="group hover:bg-white/[0.02] transition-colors">
                                                {/* Mobile Card Layout */}
                                                <div className="lg:hidden p-5 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="min-w-0">
                                                            <span className="text-[11px] font-black text-white truncate block uppercase tracking-tight">{doc.invoice_number || `#${doc.id}`}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest ${doc.type === 'quote' ? 'bg-amber-500/10 text-amber-500' :
                                                                doc.type === 'invoice' ? 'bg-shop/10 text-shop' : 'bg-blue-500/10 text-blue-400'
                                                            }`}>
                                                            {doc.type === 'quote' ? 'Devis' : doc.type === 'invoice' ? 'Facture' : 'Bon'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
                                                        <div>
                                                            <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Total</p>
                                                            <p className="text-[11px] font-black text-white">{Number(doc.total_amount).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Réglé</p>
                                                            <p className="text-[11px] font-black text-green-400">{Number(doc.paid_amount).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">Solde</p>
                                                            <p className={`text-[11px] font-black ${remaining > 0 ? 'text-red-400' : 'text-white/20'}`}>
                                                                {remaining > 0 ? remaining.toLocaleString() : '-'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-1">
                                                        <div className="flex items-center gap-2">
                                                            {remaining <= 0 && doc.type !== 'quote' ? (
                                                                <span className="flex items-center gap-1 text-[8px] font-black text-green-400 uppercase bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-2.5 h-2.5" /> Soldé</span>
                                                            ) : remaining > 0 && doc.paid_amount > 0 ? (
                                                                <span className="flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase bg-amber-500/10 px-2 py-1 rounded-full"><Clock className="w-2.5 h-2.5" /> Partiel</span>
                                                            ) : (
                                                                <span className="text-[8px] font-black text-muted-foreground uppercase bg-white/5 px-2 py-1 rounded-full">En attente</span>
                                                            )}
                                                        </div>
                                                        <button className="text-[9px] font-black uppercase text-shop flex items-center">Détails <ChevronRight className="w-3 h-3 ml-1" /></button>
                                                    </div>
                                                </div>

                                                {/* Desktop Table Row - Hidden on Mobile */}
                                                <div className="hidden lg:grid grid-cols-7 items-center px-8 py-6">
                                                    <div className="col-span-2 flex flex-col">
                                                        <span className="text-sm font-black text-white group-hover:text-shop transition-colors">{doc.invoice_number || `#${doc.id}`}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                                    </div>
                                                    <div>
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${doc.type === 'quote' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                                doc.type === 'invoice' ? 'bg-shop/10 text-shop border border-shop/20' :
                                                                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            }`}>
                                                            {doc.type === 'quote' ? 'Devis' : doc.type === 'invoice' ? 'Facture' : 'Bon de Livr.'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right font-black text-sm text-white">{Number(doc.total_amount).toLocaleString()}</div>
                                                    <div className="text-right font-black text-sm text-green-400">{Number(doc.paid_amount).toLocaleString()}</div>
                                                    <div className="text-right font-black text-sm text-red-100/40">{remaining > 0 ? remaining.toLocaleString() : '-'}</div>
                                                    <div className="flex items-center justify-center">
                                                        {remaining <= 0 && doc.type !== 'quote' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : remaining > 0 && doc.paid_amount > 0 ? <Clock className="w-4 h-4 text-amber-500" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                                                    </div>
                                                    <div className="text-right">
                                                        <button className="p-2 text-muted-foreground hover:text-white transition-colors"><ChevronRight className="w-4 h-4 ml-auto" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
