'use client'

import React, { useState, useEffect } from 'react'
import {
    Receipt,
    Plus,
    Search,
    Calendar,
    Tag,
    DollarSign,
    ArrowRight,
    TrendingDown,
    Filter,
    X,
    Loader2,
    Store,
    ChevronDown,
    AlertCircle,
    Sparkles,
    Repeat,
    PieChart,
    Pencil,
    Trash2
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/context/ToastContext'

import ShopSelector from '@/components/ShopSelector'
import CustomDropdown from '@/components/CustomDropdown'
import { redirect } from 'next/navigation'
import { API_URL } from '@/utils/api'

export default function ExpensesPage() {
    const { activeShop, shops } = useShop()
    const { profile, loading: profileLoading } = useUser()
    const { showToast } = useToast()
    const [expenses, setExpenses] = useState<any[]>([])

    const [selectedShopId, setSelectedShopId] = useState<number>(1)
    const isGlobalView = !activeShop || activeShop.id === 0

    useEffect(() => {
        if (activeShop && activeShop.id !== 0) {
            setSelectedShopId(activeShop.id)
        }
    }, [activeShop])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: 'Personnel',
        date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        frequency: 'monthly' as any
    })

    const categories = [
        'Personnel', 'Loyer', 'Électricité', 'Transport', 
        'Stock', 'Maintenance', 'Marketing', 'Publicité',
        'Logistique', 'Fournitures', 'Abonnements', 'Impôts',
        'Frais Bancaires', 'Autre'
    ]
    const frequencies = [
        { label: 'Quotidien', value: 'daily' },
        { label: 'Hebdomadaire', value: 'weekly' },
        { label: 'Mensuel', value: 'monthly' },
        { label: 'Annuel', value: 'yearly' }
    ]

    useEffect(() => {
        if (profile?.role === 'cashier') {
            redirect('/')
        }
        fetchExpenses()
    }, [activeShop, profile])

    const fetchExpenses = async () => {
        try {
            setLoading(true)
            // On ajoute includePersonal=true si on est sur l'agence (3)
            const includePersonal = activeShop?.id === 3 ? '&includePersonal=true' : ''
            const url = activeShop ? `${API_URL}/expenses?shopId=${activeShop.id}${includePersonal}` : `${API_URL}/expenses`
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setExpenses(data)
            } else {
                setError('Impossible de charger les dépenses')
            }
        } catch (err) {
            setError('Erreur de connexion au serveur backend')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (exp: any) => {
        setEditingId(exp.id)
        setNewExpense({
            description: exp.description,
            amount: exp.amount.toString(),
            category: exp.category,
            date: new Date(exp.date).toISOString().split('T')[0],
            is_recurring: exp.is_recurring,
            frequency: exp.frequency || 'monthly'
        })
        setIsCreateModalOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cette dépense ?")) return
        try {
            const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
            if (res.ok) {
                showToast("Dépense supprimée", "success")
                fetchExpenses()
            }
        } catch (e) { showToast("Erreur lors de la suppression", "error") }
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        const finalShopId = profile?.shop_id || activeShop?.id || selectedShopId;
        if (!finalShopId) return showToast("Veuillez sélectionner une boutique", "warning")

        try {
            setCreating(true)
            const url = editingId ? `${API_URL}/expenses/${editingId}` : `${API_URL}/expenses`
            const method = editingId ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: newExpense.description,
                    amount: parseFloat(newExpense.amount),
                    category: newExpense.category,
                    date: new Date(newExpense.date).toISOString(),
                    shopId: finalShopId,
                    is_recurring: newExpense.is_recurring,
                    frequency: newExpense.is_recurring ? newExpense.frequency : null
                })
            })

            if (res.ok) {
                showToast(editingId ? "Dépense mise à jour" : "Dépense enregistrée", "success")
                setIsCreateModalOpen(false)
                setEditingId(null)
                setNewExpense({
                    description: '',
                    amount: '',
                    category: 'Personnel',
                    date: new Date().toISOString().split('T')[0],
                    is_recurring: false,
                    frequency: 'monthly'
                })
                fetchExpenses()
            } else {
                const data = await res.json()
                showToast(data.message || "Erreur lors de l'opération", "error")
            }
        } catch (err) {
            showToast("Erreur de connexion", "error")
        } finally {
            setCreating(false)
        }
    }

    const handleAiAudit = () => {
        showToast("Demandez à Lolly AI : 'Analyse mes dépenses'", "info");
        // Scroll to AI button or trigger it
        const aiBtn = document.querySelector('button:has(svg.w-7.h-7)') as HTMLButtonElement;
        if (aiBtn) aiBtn.click();
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

    // Calculate Pie Chart Data
    const categoryTotals = expenses.reduce((acc: any, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
    }, {});

    const chartData = Object.entries(categoryTotals)
        .map(([name, value]: [string, any]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="min-h-screen flex flex-col pb-12">
            {/* Premium Header - Optimized for mobile */}
            <header className="glass-panel sticky top-2 sm:top-4 z-50 mx-2 sm:mx-4 rounded-2xl sm:rounded-[24px] shadow-xl border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shop rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <Receipt className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Depenses</h1>
                            <p className="text-[7px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 hidden xs:block">Gestion des Flux Sortants</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button
                            onClick={handleAiAudit}
                            className="hidden sm:flex items-center px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all"
                        >
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            Audit IA
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center px-4 sm:px-6 py-2 bg-shop text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-shop/20"
                        >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Nouvelle Depense</span>
                            <span className="sm:hidden">Ajouter</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
                {/* Stats & Chart Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Stats */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="glass-card p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] relative overflow-hidden group h-fit">
                            <div className="absolute top-0 right-0 p-4 sm:p-6 text-red-500/5 group-hover:text-red-500/10 transition-colors">
                                <TrendingDown className="w-16 h-16 sm:w-24 sm:h-24 rotate-12" />
                            </div>
                            <div className="relative z-10 space-y-1 sm:space-y-2">
                                <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Total des Depenses</p>
                                <h2 className="text-2xl sm:text-4xl font-black text-red-400 leading-none">{totalExpenses.toLocaleString()} <span className="text-sm sm:text-xl">FCFA</span></h2>
                                <div className="text-[8px] sm:text-[10px] font-bold text-muted-foreground mt-1 sm:mt-2 uppercase tracking-tighter">
                                    {expenses.length} transactions enregistrées
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 sm:p-6 text-shop/5 group-hover:text-shop/10 transition-colors">
                                <Store className="w-16 h-16 sm:w-24 sm:h-24 -rotate-6" />
                            </div>
                            <div className="relative z-10 space-y-1">
                                <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest">Boutique Active</p>
                                <h2 className="text-xl sm:text-2xl font-black shop-gradient-text uppercase leading-tight truncate">{activeShop?.name || 'Globale'}</h2>
                                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-black tracking-widest opacity-50 uppercase">
                                    {activeShop ? 'Filtrage automatique' : 'Vue d\'ensemble complète'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pie Chart Visualization */}
                    <div className="md:col-span-8 glass-card p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] flex flex-col sm:flex-row items-center gap-8">
                        <div className="relative w-48 h-48 sm:w-64 sm:h-64 shrink-0">
                            {expenses.length > 0 && totalExpenses > 0 ? (
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    {(() => {
                                        let cumulativePercent = 0;
                                        const colors = ['#0055ff', '#ff4d8d', '#fbbf24', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#6366f1'];
                                        
                                        // Handle 100% single category case
                                        if (chartData.length === 1) {
                                            return <circle cx="50" cy="50" r="40" fill={colors[0]} className="hover:opacity-80 transition-opacity cursor-help" />;
                                        }

                                        return chartData.map((d, i) => {
                                            const percent = (d.value / totalExpenses) * 100;
                                            const startX = Math.cos(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                                            const startY = Math.sin(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                                            cumulativePercent += percent;
                                            const endX = Math.cos(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                                            const endY = Math.sin(2 * Math.PI * cumulativePercent / 100) * 40 + 50;
                                            const largeArc = percent > 50 ? 1 : 0;
                                            
                                            return (
                                                <path
                                                    key={i}
                                                    d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                                                    fill={colors[i % colors.length]}
                                                    className="hover:opacity-80 transition-opacity cursor-help"
                                                />
                                            );
                                        });
                                    })()}
                                    <circle cx="50" cy="50" r="25" className="fill-[#0a0a0c]" />
                                </svg>
                            ) : (
                                <div className="w-full h-full rounded-full border-4 border-white/5 flex items-center justify-center">
                                    <PieChart className="w-12 h-12 text-muted-foreground opacity-20" />
                                </div>
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-muted-foreground uppercase">Répartition</span>
                                <span className="text-xs font-black text-white">{chartData.length} Cat.</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Top Catégories</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                {chartData.slice(0, 6).map((d, i) => {
                                    const colors = ['#0055ff', '#ff4d8d', '#fbbf24', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#6366f1'];
                                    return (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                                <span className="text-[10px] font-bold text-white uppercase truncate max-w-[100px]">{d.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-muted-foreground">{((d.value / totalExpenses) * 100).toFixed(1)}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expenses List */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 px-2 sm:px-4">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none">Transactions</h3>
                            <p className="text-[10px] sm:text-sm text-muted-foreground font-medium uppercase tracking-widest mt-2 sm:mt-1">Historique détaillé des flux</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-12 sm:p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-shop animate-spin" />
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Chargement...</p>
                        </div>
                    ) : error ? (
                        <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-12 sm:p-20 flex flex-col items-center justify-center space-y-4 border-red-500/20">
                            <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 opacity-20" />
                            <p className="text-[10px] sm:text-sm font-bold text-red-400 uppercase tracking-widest text-center">{error}</p>
                            <button onClick={fetchExpenses} className="text-[10px] font-black uppercase text-shop underline tracking-widest">Réessayer</button>
                        </div>
                    ) : expenses.length === 0 ? (
                        <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-12 sm:p-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center">
                                <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground opacity-20" />
                            </div>
                            <div>
                                <h4 className="text-lg sm:text-xl font-black uppercase mb-1">Aucune depense</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">Commencez à suivre vos flux sortants dès maintenant.</p>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-6 py-3 bg-shop text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-shop/20"
                            >
                                Ajouter une depense
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {expenses.map((exp) => (
                                <div key={exp.id} className="glass-card p-5 rounded-[28px] border border-white/5 active:scale-[0.98] transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400 shrink-0">
                                                <Receipt className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-white truncate uppercase">{exp.description}</p>
                                                <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black opacity-50">Trans. #{exp.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end space-y-2">
                                            <p className="text-sm font-black text-red-400">-{parseFloat(exp.amount).toLocaleString()} <span className="text-[8px] uppercase">CFA</span></p>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEdit(exp)} className="p-1.5 bg-white/5 rounded-lg text-muted-foreground hover:text-shop transition-all">
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => handleDelete(exp.id)} className="p-1.5 bg-white/5 rounded-lg text-muted-foreground hover:text-red-400 transition-all">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center">
                                                <Tag className="w-3 h-3 mr-1.5 text-shop/60" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{exp.category}</span>
                                            </div>
                                            {exp.is_recurring && (
                                                <div className="flex items-center bg-blue-500/10 px-2 py-0.5 rounded text-blue-400 border border-blue-500/20">
                                                    <Repeat className="w-2.5 h-2.5 mr-1" />
                                                    <span className="text-[7px] font-black uppercase">{exp.frequency}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1.5 text-muted-foreground opacity-50" />
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                                {new Date(exp.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Expense Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setIsCreateModalOpen(false); setEditingId(null); }} />
                    <div className="relative glass-card w-full max-w-md p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => { setIsCreateModalOpen(false); setEditingId(null); }}
                            className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-4 mb-6 sm:mb-8">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-shop/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-none text-white">
                                    {editingId ? 'Modifier' : 'Nouvelle'} Depense
                                </h2>
                                <p className="text-[8px] sm:text-xs text-muted-foreground font-bold tracking-widest uppercase mt-1">Sortie de Trésorerie</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateExpense} className="space-y-5 sm:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Description</label>
                                <input
                                    type="text" required placeholder="ex: Facture d'électricité"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-sm focus:border-shop/50 outline-none transition-all text-white"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Montant (FCFA)</label>
                                    <div className="relative">
                                        <input
                                            type="number" required placeholder="0"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-sm focus:border-shop/50 outline-none transition-all pl-10 text-white"
                                            value={newExpense.amount}
                                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Date</label>
                                    <input
                                        type="date" required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-5 sm:px-6 text-sm focus:border-shop/50 outline-none transition-all appearance-none uppercase text-[10px] font-black text-white"
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Repeat className="w-4 h-4 text-blue-400" />
                                        <span className="text-[10px] font-black uppercase text-white">Paiement Récurrent</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setNewExpense({...newExpense, is_recurring: !newExpense.is_recurring})}
                                        className={`w-10 h-5 rounded-full relative transition-all ${newExpense.is_recurring ? 'bg-shop' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newExpense.is_recurring ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                                {newExpense.is_recurring && (
                                    <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                                        {frequencies.map(f => (
                                            <button
                                                key={f.value} type="button"
                                                onClick={() => setNewExpense({...newExpense, frequency: f.value})}
                                                className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${newExpense.frequency === f.value ? 'bg-white text-black border-white' : 'bg-white/5 text-muted-foreground border-white/10'}`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Catégorie</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat} type="button"
                                            onClick={() => setNewExpense({ ...newExpense, category: cat })}
                                            className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${newExpense.category === cat
                                                ? 'bg-shop text-white border-shop'
                                                : 'bg-white/5 text-muted-foreground border-white/10'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-shop/5 rounded-xl border border-shop/10 flex flex-col space-y-3">
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center space-x-3">
                                        <Store className="w-4 h-4 text-shop" />
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Boutique</span>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest shop-gradient-text">
                                        {profile?.shop_id ? shops.find(s => s.id === profile.shop_id)?.name : (activeShop?.name || 'Sélectionner')}
                                    </span>
                                </div>
                                {(!profile?.shop_id && isGlobalView) && (
                                    <CustomDropdown 
                                        options={shops.map(s => ({ label: s.name, value: s.id, icon: <Store className="w-3.5 h-3.5"/> }))}
                                        value={selectedShopId}
                                        onChange={setSelectedShopId}
                                    />
                                )}
                            </div>

                            <button
                                type="submit" disabled={creating}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-shop hover:text-white transition-all shadow-xl disabled:opacity-50 text-xs"
                            >
                                {creating ? 'Enregistrement...' : 'Valider'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}