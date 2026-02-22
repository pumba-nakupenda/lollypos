'use client'

import React, { useState, useEffect } from 'react'
import {
    CreditCard, Search, User, Calendar, DollarSign,
    CheckCircle2, AlertCircle, Clock, Trash2, ArrowRight,
    Loader2, Filter, Plus, X, ArrowUpRight, ArrowDownLeft, Building2, History
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/client'
import CustomDropdown from '@/components/CustomDropdown'

export default function DebtsPage() {
    const { activeShop } = useShop()
    const { showToast } = useToast()
    const supabase = createClient()

    const [debts, setDebts] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [viewType, setViewType] = useState<'receivable' | 'debt'>('receivable')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [currentSession, setCurrentSession] = useState<any>(null)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedDebt, setSelectedDebt] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentProcessing, setPaymentProcessing] = useState(false)
    const [payMethod, setPayMethod] = useState<'cash' | 'wave' | 'om'>('cash')
    const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null)
    const [debtPayments, setDebtPayments] = useState<Record<string, any[]>>({})

    const [newEntry, setNewEntry] = useState({
        customer_id: '',
        creditor_name: '',
        total_amount: '',
        paid_amount: '0',
        due_date: '',
        type: 'receivable' as 'receivable' | 'debt'
    })

    useEffect(() => {
        fetchDebts()
        fetchCustomers()
        fetchCurrentSession()
    }, [activeShop, viewType])

    const fetchCurrentSession = async () => {
        if (!activeShop) return;
        const { data } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('shop_id', activeShop.id)
            .eq('status', 'open')
            .maybeSingle();
        setCurrentSession(data);
    };

    const fetchCustomers = async () => {
        let query = supabase.from('customers').select('id, name').order('name');
        if (activeShop && activeShop.id !== 0) {
            query = query.eq('shop_id', activeShop.id);
        }
        const { data } = await query;
        if (data) setCustomers(data)
    }

    const fetchDebts = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('debts')
                .select(`
                    *,
                    customers (name, phone)
                `)
                .eq('type', viewType)

            // Filtrage par boutique (si pas en vue globale ID 0)
            if (activeShop && activeShop.id !== 0) {
                query = query.eq('shop_id', activeShop.id)
            }

            const { data, error } = await query.order('created_at', { ascending: false })
            if (error) throw error
            setDebts(data || [])
            if (data) fetchAllPayments(data.map(d => d.id))
        } catch (err) {
            showToast("Erreur de chargement", "error")
        } finally {
            setLoading(false)
        }
    }

    const fetchAllPayments = async (debtIds: string[]) => {
        if (debtIds.length === 0) return
        const { data } = await supabase
            .from('debt_payments')
            .select('*')
            .in('debt_id', debtIds)
            .order('created_at', { ascending: false })

        if (data) {
            const grouped = data.reduce((acc: any, p: any) => {
                if (!acc[p.debt_id]) acc[p.debt_id] = []
                acc[p.debt_id].push(p)
                return acc
            }, {})
            setDebtPayments(grouped)
        }
    }

    const handleCreateEntry = async (e: React.FormEvent) => {
        e.preventDefault()
        if (activeShop?.id === 0) return showToast("Sélectionnez une boutique spécifique avant d'ajouter une dette", "warning")
        if (newEntry.type === 'receivable' && !newEntry.customer_id) return showToast("Sélectionnez un client", "warning")
        if (newEntry.type === 'debt' && !newEntry.creditor_name) return showToast("Saisissez le nom du créancier", "warning")

        setCreating(true)
        try {
            const total = parseFloat(newEntry.total_amount)
            const paid = parseFloat(newEntry.paid_amount)
            const remaining = total - paid

            const { error } = await supabase.from('debts').insert([{
                customer_id: newEntry.type === 'receivable' ? newEntry.customer_id : null,
                creditor_name: newEntry.type === 'debt' ? newEntry.creditor_name : null,
                type: newEntry.type,
                total_amount: total,
                remaining_amount: remaining,
                paid_amount: paid,
                due_date: newEntry.due_date || null,
                status: remaining <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
                shop_id: activeShop?.id
            }])

            if (error) {
                console.error('Debt Creation Error:', error);
                throw error;
            }
            showToast(newEntry.type === 'receivable' ? "Créance client ajoutée !" : "Dette fournisseur enregistrée !", "success")
            setIsModalOpen(false)
            setNewEntry({ customer_id: '', creditor_name: '', total_amount: '', paid_amount: '0', due_date: '', type: 'receivable' })
            fetchDebts()
        } catch (err: any) {
            console.error('Debt Creation Catch:', err);
            showToast(`Erreur : ${err.message || 'Impossible de créer'}`, "error")
        } finally {
            setCreating(false)
        }
    }

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDebt || !paymentAmount) return

        setPaymentProcessing(true)
        try {
            const amount = parseFloat(paymentAmount)
            const newPaid = Number(selectedDebt.paid_amount) + amount
            const newRemaining = Number(selectedDebt.total_amount) - newPaid

            // 1. Create Payment record
            const { error: pError } = await supabase.from('debt_payments').insert([{
                debt_id: selectedDebt.id,
                session_id: currentSession?.id,
                amount: amount,
                payment_method: payMethod
            }])
            if (pError) throw pError

            // 2. Update Debt record
            const { error: dError } = await supabase
                .from('debts')
                .update({
                    paid_amount: newPaid,
                    remaining_amount: newRemaining,
                    status: newRemaining <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid')
                })
                .eq('id', selectedDebt.id)
            if (dError) throw dError

            // 3. Log Cash Movement if session active
            if (currentSession) {
                await supabase.from('cash_movements').insert([{
                    session_id: currentSession.id,
                    shop_id: activeShop?.id,
                    type: 'income',
                    amount: amount,
                    description: `Paiement Dette - ${selectedDebt.type === 'receivable' ? selectedDebt.customers?.name : selectedDebt.creditor_name}`,
                    source: 'debt_payment',
                    source_id: selectedDebt.id.toString(),
                    payment_method: payMethod
                }])
            }

            showToast("Paiement enregistré !", "success")
            setIsPaymentModalOpen(false)
            setPaymentAmount('')
            fetchDebts()
        } catch (err) {
            showToast("Erreur lors du paiement", "error")
        } finally {
            setPaymentProcessing(false)
        }
    }

    const handleDeleteDebt = async (id: string) => {
        if (!confirm("Supprimer définitivement ce dossier ? Cette action est irréversible.")) return
        try {
            const { error } = await supabase
                .from('debts')
                .delete()
                .eq('id', id)
            if (error) throw error
            showToast("Dossier supprimé !", "success")
            fetchDebts()
        } catch (err) {
            showToast("Erreur lors de la suppression", "error")
        }
    }

    const filtered = debts.filter(d => {
        const name = d.type === 'receivable' ? d.customers?.name : d.creditor_name
        const matchesSearch = name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalRemaining = filtered.reduce((sum, d) => sum + Number(d.remaining_amount), 0)
    const isReceivable = viewType === 'receivable'

    // Explicit style mapping for Tailwind Purge/JIT to work
    const styles = isReceivable ? {
        bg: 'bg-blue-600',
        bgHover: 'hover:bg-blue-700',
        bgLight: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        shadow: 'shadow-blue-600/20',
        indicator: 'bg-blue-500'
    } : {
        bg: 'bg-red-600',
        bgHover: 'hover:bg-red-700',
        bgLight: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/20',
        shadow: 'shadow-red-600/20',
        indicator: 'bg-red-500'
    };

    return (
        <div className="min-h-screen flex flex-col p-4 sm:p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 ${styles.bgLight} rounded-2xl flex items-center justify-center ${styles.text} shadow-xl border ${styles.border}`}>
                        {isReceivable ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">
                            {isReceivable ? 'Créances Clients' : 'Dettes Fournisseurs'}
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            {isReceivable ? 'Argent à recevoir' : 'Argent à payer'} • {activeShop?.name}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10">
                        <button onClick={() => setViewType('receivable')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${isReceivable ? 'bg-blue-500 text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}>Créances</button>
                        <button onClick={() => setViewType('debt')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${!isReceivable ? 'bg-red-500 text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}>Dettes</button>
                    </div>

                    <button
                        onClick={() => {
                            setNewEntry({ ...newEntry, type: viewType })
                            setIsModalOpen(true)
                        }}
                        className={`flex items-center px-8 py-3.5 ${styles.bg} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl ${styles.shadow}`}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nouveau
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`glass-panel p-8 rounded-[40px] ${styles.border} bg-gradient-to-br ${isReceivable ? 'from-blue-500/10' : 'from-red-500/10'} to-transparent relative overflow-hidden group`}>
                    <div className={`absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700`}>
                        {isReceivable ? <ArrowDownLeft className="w-32 h-32" /> : <ArrowUpRight className="w-32 h-32" />}
                    </div>
                    <p className={`text-[10px] font-black ${styles.text} uppercase tracking-[0.2em] mb-3`}>Total {isReceivable ? 'à recouvrer' : 'à régler'}</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter">{totalRemaining.toLocaleString()} <span className="text-sm opacity-30 font-bold">CFA</span></h2>
                </div>

                <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-white/[0.01]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Dossiers Actifs</p>
                    <h2 className="text-5xl font-black text-white tracking-tighter">{filtered.filter(d => d.status !== 'paid').length}</h2>
                </div>

                <div className="flex flex-col space-y-3 justify-center">
                    <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                        {['all', 'unpaid', 'partial', 'paid'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${statusFilter === s
                                    ? (isReceivable ? 'bg-blue-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg')
                                    : 'text-muted-foreground hover:text-white'
                                    }`}
                            >
                                {s === 'all' ? 'Tous' : s === 'unpaid' ? 'Impayés' : s === 'partial' ? 'Partiels' : 'Réglés'}
                            </button>
                        ))}
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-white transition-colors" />
                        <input type="text" placeholder="Rechercher un nom..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold outline-none focus:border-white/20 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-20"><Loader2 className={`w-12 h-12 animate-spin ${styles.text} opacity-20`} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {filtered.map((debt) => (
                        <div key={debt.id} className="glass-panel p-6 rounded-[32px] border-white/5 hover:border-white/20 transition-all group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:${styles.text} transition-colors`}>
                                        {isReceivable ? <User className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase truncate max-w-[140px]">{isReceivable ? debt.customers?.name : debt.creditor_name}</h3>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{isReceivable ? debt.customers?.phone : 'Fournisseur'}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${debt.status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    debt.status === 'partial' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                        `${styles.bgLight} ${styles.border} ${styles.text}`
                                    }`}>
                                    {debt.status}
                                </span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase">Reste à {isReceivable ? 'encaisser' : 'payer'}</span>
                                    <span className={`text-2xl font-black ${styles.text} tracking-tighter`}>{Number(debt.remaining_amount).toLocaleString()} <span className="text-[10px] opacity-50">CFA</span></span>
                                </div>
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${styles.indicator} transition-all`}
                                        style={{ width: `${(1 - debt.remaining_amount / debt.total_amount) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground">
                                    <span>Total: {Number(debt.total_amount).toLocaleString()}</span>
                                    <span className="flex items-center"><Clock className="w-2.5 h-2.5 mr-1" /> {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : 'Pas d\'échéance'}</span>
                                </div>
                            </div>

                            {/* Payment History Mini-Section */}
                            {debtPayments[debt.id] && debtPayments[debt.id].length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <button
                                        onClick={() => setExpandedDebtId(expandedDebtId === debt.id ? null : debt.id)}
                                        className="text-[8px] font-black uppercase text-shop flex items-center hover:opacity-70 transition-all"
                                    >
                                        <History className="w-3 h-3 mr-1" />
                                        {expandedDebtId === debt.id ? 'Masquer l\'historique' : `Voir les ${debtPayments[debt.id].length} versements`}
                                    </button>

                                    {expandedDebtId === debt.id && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                            {debtPayments[debt.id].map((p: any) => (
                                                <div key={p.id} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-[7px] font-bold text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                                                    <span className="text-[8px] font-black text-white">+{Number(p.amount).toLocaleString()} CFA</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2">
                                {debt.status !== 'paid' && (
                                    <button
                                        onClick={() => { setSelectedDebt(debt); setIsPaymentModalOpen(true); }}
                                        className={`flex-1 py-4 bg-white/5 hover:bg-green-500 hover:text-white border border-white/10 hover:border-green-500 rounded-2xl text-[9px] font-black uppercase transition-all flex items-center justify-center space-x-2`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Encaisser</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteDebt(debt.id)}
                                    className={`p-4 bg-white/5 hover:bg-red-500 hover:text-white border border-white/10 hover:border-red-500 rounded-2xl transition-all flex items-center justify-center`}
                                    title="Supprimer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-background/40 animate-in fade-in duration-300">
                    <div className="relative glass-card w-full max-w-md p-10 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsPaymentModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6 text-white" /></button>

                        <div className="flex items-center space-x-5 mb-10">
                            <div className={`w-16 h-16 bg-green-500/20 text-green-400 border-green-500/20 rounded-3xl flex items-center justify-center border shadow-2xl`}>
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Règlement</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">{selectedDebt?.customers?.name || selectedDebt?.creditor_name}</p>
                            </div>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Montant du versement</label>
                                <div className="relative group">
                                    <Plus className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-green-400 transition-colors" />
                                    <input
                                        required
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 pl-14 pr-6 text-2xl font-black outline-none focus:border-green-500/50 transition-all text-white"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        max={selectedDebt?.remaining_amount}
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground ml-3 font-medium uppercase tracking-wider italic">Reste à payer : {Number(selectedDebt?.remaining_amount).toLocaleString()} CFA</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Mode de règlement</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['cash', 'wave', 'om'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setPayMethod(m as any)}
                                            className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${payMethod === m
                                                    ? 'bg-shop text-white border-shop'
                                                    : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!currentSession && (
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start space-x-3">
                                    <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-orange-300 font-bold uppercase leading-relaxed">Attention : Aucune session de caisse ouverte. Ce paiement sera noté mais pas ajouté au fond de caisse physique actuel.</p>
                                </div>
                            )}

                            <button type="submit" disabled={paymentProcessing} className={`w-full py-6 bg-green-600 shadow-green-600/40 text-white font-black uppercase tracking-[0.2em] rounded-[28px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl text-xs disabled:opacity-50`}>
                                {paymentProcessing ? 'Enregistrement...' : 'Confirmer le versement'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
