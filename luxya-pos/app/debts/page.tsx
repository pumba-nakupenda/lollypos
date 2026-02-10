
'use client'

import React, { useState, useEffect } from 'react'
import { 
    CreditCard, Search, User, Calendar, DollarSign, 
    CheckCircle2, AlertCircle, Clock, Trash2, ArrowRight,
    Loader2, Filter, Plus, X
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
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    const [newDebt, setNewDebt] = useState({
        customer_id: '', total_amount: '', paid_amount: '0', due_date: ''
    })

    useEffect(() => {
        fetchDebts()
        fetchCustomers()
    }, [activeShop])

    const fetchCustomers = async () => {
        const { data } = await supabase.from('customers').select('id, name').order('name')
        if (data) setCustomers(data)
    }

    const handleCreateDebt = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newDebt.customer_id) return showToast("Sélectionnez un client", "warning")
        
        setCreating(true)
        try {
            const total = parseFloat(newDebt.total_amount)
            const paid = parseFloat(newDebt.paid_amount)
            const remaining = total - paid

            const { error } = await supabase.from('debts').insert([{
                customer_id: newDebt.customer_id,
                total_amount: total,
                remaining_amount: remaining,
                paid_amount: paid,
                due_date: newDebt.due_date || null,
                status: remaining <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid')
            }])

            if (error) throw error
            showToast("Dette enregistrée !", "success")
            setIsModalOpen(false)
            setNewDebt({ customer_id: '', total_amount: '', paid_amount: '0', due_date: '' })
            fetchDebts()
        } catch (err) {
            showToast("Erreur lors de la création", "error")
        } finally {
            setCreating(false)
        }
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
                .order('created_at', { ascending: false })

            const { data, error } = await query
            if (error) throw error
            setDebts(data || [])
        } catch (err) {
            showToast("Erreur lors du chargement des dettes", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsPaid = async (debtId: string) => {
        if (!confirm("Marquer cette dette comme totalement réglée ?")) return

        try {
            const { error } = await supabase
                .from('debts')
                .update({ status: 'paid', remaining_amount: 0 })
                .eq('id', debtId)

            if (error) throw error
            showToast("Dette réglée !", "success")
            fetchDebts()
        } catch (err) {
            showToast("Erreur lors de la mise à jour", "error")
        }
    }

    const filteredDebts = debts.filter(d => {
        const matchesSearch = d.customers?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             d.customers?.phone?.includes(searchQuery)
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalRemaining = filteredDebts.reduce((sum, d) => sum + Number(d.remaining_amount), 0)

    return (
        <div className="min-h-screen flex flex-col p-4 sm:p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-lg">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Gestion des Dettes</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suivi des crédits clients</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nouveau Crédit
                    </button>
                    
                    <div className="flex items-center space-x-3 bg-white/5 p-1 rounded-2xl border border-white/10">
                        {['all', 'unpaid', 'partial', 'paid'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                    statusFilter === s ? 'bg-red-500 text-white shadow-lg' : 'text-muted-foreground hover:text-white'
                                }`}
                            >
                                {s === 'all' ? 'Toutes' : s === 'unpaid' ? 'Impayées' : s === 'partial' ? 'Partielles' : 'Réglées'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-[32px] border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">Total à recouvrer</p>
                    <h2 className="text-4xl font-black text-white">{totalRemaining.toLocaleString()} <span className="text-sm opacity-50">FCFA</span></h2>
                </div>
                <div className="glass-panel p-6 rounded-[32px] border-white/5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Dettes Actives</p>
                    <h2 className="text-4xl font-black text-white">{filteredDebts.filter(d => d.status !== 'paid').length}</h2>
                </div>
            </div>

            <div className="relative group max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-red-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Chercher un client ou un numéro..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-muted-foreground/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-red-400 opacity-20" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDebts.map((debt) => (
                        <div key={debt.id} className="glass-panel p-6 rounded-[32px] border-white/5 hover:border-red-500/30 transition-all group">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase truncate max-w-[150px]">{debt.customers?.name}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground">{debt.customers?.phone}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                                    debt.status === 'paid' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    debt.status === 'partial' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                    {debt.status}
                                </span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Reste à payer</span>
                                    <span className="text-xl font-black text-red-400">{Number(debt.remaining_amount).toLocaleString()} FCFA</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-red-500 transition-all" 
                                        style={{ width: `${(1 - debt.remaining_amount / debt.total_amount) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground">
                                    <span>Total: {Number(debt.total_amount).toLocaleString()}</span>
                                    <span>Échéance: {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            {debt.status !== 'paid' && (
                                <button 
                                    onClick={() => handleMarkAsPaid(debt.id)}
                                    className="w-full py-3 bg-white/5 hover:bg-green-500 hover:text-white border border-white/10 hover:border-green-500 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center space-x-2"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Marquer comme réglé</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-md p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6"/></button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400"><CreditCard className="w-6 h-6"/></div>
                            <div><h2 className="text-xl font-black uppercase tracking-tight">Nouveau Crédit</h2><p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Enregistrer une dette</p></div>
                        </div>

                        <form onSubmit={handleCreateDebt} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Client débiteur</label>
                                <CustomDropdown 
                                    options={customers.map(c => ({ label: c.name, value: c.id, icon: <User className="w-3.5 h-3.5"/> }))}
                                    value={newDebt.customer_id}
                                    onChange={(val) => setNewDebt({...newDebt, customer_id: val})}
                                    placeholder="Choisir un client..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Montant Total</label>
                                    <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-500" value={newDebt.total_amount} onChange={e => setNewDebt({...newDebt, total_amount: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Acompte versé</label>
                                    <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-500" value={newDebt.paid_amount} onChange={e => setNewDebt({...newDebt, paid_amount: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Échéance (Date limite)</label>
                                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-red-500" value={newDebt.due_date} onChange={e => setNewDebt({...newDebt, due_date: e.target.value})} />
                            </div>

                            <button type="submit" disabled={creating} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-3xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-600/20">
                                {creating ? 'Enregistrement...' : 'Valider le Crédit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
