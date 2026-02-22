'use client'

import React, { useState, useEffect } from 'react'
import {
    Receipt,
    Plus,
    Calendar,
    Tag,
    DollarSign,
    TrendingDown,
    X,
    Loader2,
    Store,
    AlertCircle,
    Repeat,
    PieChart,
    Pencil,
    Trash2,
    User
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/context/ToastContext'

import ShopSelector from '@/components/ShopSelector'
import CustomDropdown from '@/components/CustomDropdown'
import { redirect } from 'next/navigation'
import { API_URL, authFetch } from '@/utils/api'

export default function PersonalExpensesPage() {
    const { activeShop } = useShop()
    const { profile, loading: profileLoading } = useUser()
    const { showToast } = useToast()

    // Safety initialized state
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)

    const [categories, setCategories] = useState<any[]>([])
    const [isManageCatsOpen, setIsManageCatsOpen] = useState(false)
    const [newCatName, setNewCatName] = useState('')

    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
    })

    // SECURITY: Only Agency can access this
    useEffect(() => {
        if (!profileLoading && activeShop) {
            const isAgency = activeShop.id === 3
            const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

            if (!isAgency || !isAdmin) {
                // On laisse un petit délai ou on utilise router.push pour éviter les crashs de redirect() en client-side
                console.log("Accès non autorisé aux dépenses perso")
            }
        }
    }, [activeShop, profile, profileLoading])

    useEffect(() => {
        if (activeShop?.id === 3) {
            fetchPersonalExpenses()
            fetchCategories()
        }
    }, [activeShop])

    const fetchCategories = async () => {
        try {
            const ts = Date.now()
            const data = await authFetch(`${API_URL}/expenses/categories/list?shopId=3&isPersonal=true&_=${ts}`)
            if (Array.isArray(data)) {
                setCategories(data)
                if (data.length > 0 && !newExpense.category) {
                    setNewExpense(prev => ({ ...prev, category: data[0].name }))
                }
            } else {
                setCategories([])
            }
        } catch (e) {
            console.error("Fetch categories error:", e)
        }
    }

    const fetchPersonalExpenses = async () => {
        try {
            setLoading(true)
            const ts = Date.now()
            const data = await authFetch(`${API_URL}/expenses?shopId=3&includePersonal=true&_=${ts}`)
            if (Array.isArray(data)) {
                setExpenses(data)
            } else {
                setExpenses([])
            }
            setError(null)
        } catch (err) {
            setError('Erreur de connexion')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCatName.trim()) return
        try {
            await authFetch(`${API_URL}/expenses/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName, shopId: 3, isPersonal: true })
            })
            setNewCatName('')
            await fetchCategories()
            showToast("Catégorie ajoutée", "success")
        } catch (e: any) {
            showToast(`Erreur réseau : ${e.message}`, "error")
        }
    }

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Supprimer cette catégorie ?")) return
        try {
            await authFetch(`${API_URL}/expenses/categories/${id}`, { method: 'DELETE' })
            await fetchCategories()
            showToast("Catégorie supprimée", "success")
        } catch (e) { }
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newExpense.category) return showToast("Veuillez choisir une catégorie", "warning")

        try {
            setCreating(true)
            const url = editingId ? `${API_URL}/expenses/${editingId}` : `${API_URL}/expenses`
            const method = editingId ? 'PATCH' : 'POST'

            await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: newExpense.description,
                    amount: parseFloat(newExpense.amount),
                    category: newExpense.category,
                    date: new Date(newExpense.date).toISOString(),
                    shopId: 3
                })
            })

            showToast(editingId ? "Dépense mise à jour" : "Dépense créée", "success")
            setIsCreateModalOpen(false)
            setNewExpense({
                description: '',
                amount: '',
                category: categories.length > 0 ? categories[0].name : '', // Assuming categories[0] has a 'name' property
                date: new Date().toISOString().split('T')[0]
            })
            setEditingId(null)
            fetchPersonalExpenses() // Renamed from fetchExpenses
            // fetchStats() // No fetchStats in this file, assuming it's not needed or handled elsewhere
        } catch (e: any) {
            showToast(e.message || "Erreur lors de l'opération", "error")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cette dépense perso ?")) return
        try {
            await authFetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
            showToast("Dépense supprimée", "success")
            fetchPersonalExpenses()
        } catch (e) { showToast("Erreur", "error") }
    }

    // ULTRA DEFENSIVE FILTERING
    const personalExpenses = Array.isArray(expenses) ? expenses.filter(e => {
        if (!e || !e.category) return false;
        return Array.isArray(categories) && categories.some(cat =>
            cat?.name?.toLowerCase() === e.category?.toLowerCase()
        );
    }) : [];

    const total = personalExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    const totalBudget = Array.isArray(categories) ? categories.reduce((sum, c) => sum + (parseFloat(c.budget) || 0), 0) : 0

    const isAgency = activeShop?.id === 3
    const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

    if (profileLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
    )

    if (!isAgency || !isAdmin) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-white uppercase italic">Accès Restreint</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Cette page est exclusivement réservée à l'administration de Lolly Agency.</p>
            </div>
            <button onClick={() => window.location.href = '/'} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                Retour au Tableau de Bord
            </button>
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col pb-12">
            <header className="glass-panel sticky top-4 z-50 mx-4 rounded-[24px] shadow-xl border-white/5">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none flex items-center">
                                Dépenses Perso
                                <span className="ml-3 px-2 py-0.5 bg-purple-500/20 text-[8px] rounded border border-purple-500/30 text-purple-400 animate-pulse">v1.2 - SECURE</span>
                            </h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Lolly Agency Exclusive</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button
                            onClick={() => setIsManageCatsOpen(true)}
                            className="hidden sm:flex items-center px-4 py-2 bg-white/5 text-muted-foreground border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            <Tag className="w-3.5 h-3.5 mr-2" />
                            Catégories
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center px-6 py-2 bg-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8 space-y-8">
                {error && (
                    <div className="glass-panel p-4 rounded-xl border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center">
                        <AlertCircle className="w-5 h-5 mr-3" />
                        {error}
                    </div>
                )}

                {/* Mobile Categories Btn */}
                <button
                    onClick={() => setIsManageCatsOpen(true)}
                    className="sm:hidden w-full py-3 bg-white/5 text-muted-foreground border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                    Gérer les Catégories
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-card p-8 rounded-[40px] relative overflow-hidden group border-purple-500/10">
                        <div className="absolute top-0 right-0 p-6 text-purple-500/5 group-hover:text-purple-500/10 transition-colors">
                            <DollarSign className="w-24 h-24 rotate-12" />
                        </div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Personnel</p>
                        <h2 className="text-4xl font-black text-purple-400 leading-none mt-2">{total.toLocaleString()} <span className="text-xl">CFA</span></h2>
                    </div>
                </div>

                {/* ENVELOPES SECTION */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black tracking-tight uppercase px-4">Mes Enveloppes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.isArray(categories) && categories.map(cat => {
                            const spent = expenses.filter(e => e?.category === cat?.name).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
                            const budget = parseFloat(cat?.budget || 0)
                            const percent = budget > 0 ? (spent / budget) * 100 : 0
                            const isOver = percent > 100
                            const isWarning = percent > 80 && !isOver

                            return (
                                <div key={cat.id} className="glass-card p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Enveloppe</p>
                                            <h4 className="text-xl font-black text-white uppercase">{cat?.name}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-muted-foreground">{spent.toLocaleString()} / {budget > 0 ? budget.toLocaleString() : '∞'}</p>
                                            <div className="flex items-center justify-end space-x-2">
                                                {budget > 0 && <p className={`text-[10px] font-black ${isOver ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-green-400'}`}>{percent.toFixed(0)}% Utilise</p>}
                                                {budget > 0 && (
                                                    <p className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isOver ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-muted-foreground'}`}>
                                                        {isOver ? `Dépassement: ${(spent - budget).toLocaleString()}` : `Reste: ${(budget - spent).toLocaleString()}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {budget > 0 && (
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative z-10">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'}`}
                                                style={{ width: `${Math.min(percent, 100)}%` }}
                                            />
                                        </div>
                                    )}

                                    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${isOver ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'}`} />
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-2xl font-black tracking-tight uppercase px-4">Historique Perso</h3>

                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-purple-500 animate-spin" /></div>
                    ) : personalExpenses.length === 0 ? (
                        <div className="glass-panel rounded-[40px] p-20 text-center space-y-4">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest">Aucune dépense personnelle enregistrée</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {personalExpenses.map((exp) => (
                                <div key={exp.id} className="glass-card p-6 rounded-[28px] border border-white/5 active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-white uppercase">{exp?.description}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-muted-foreground font-bold uppercase tracking-widest">{exp?.category}</span>
                                                <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest">{exp?.date ? new Date(exp.date).toLocaleDateString() : ''}</span>
                                            </div>
                                        </div>
                                        <p className="font-black text-red-400">-{(parseFloat(exp?.amount) || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => handleDelete(exp.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-background/80" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-md p-8 rounded-[40px] border-purple-500/20 shadow-2xl">
                        <h2 className="text-xl font-black text-white uppercase mb-6">Nouvelle Dépense Perso</h2>
                        <form onSubmit={handleCreateExpense} className="space-y-6">
                            <input
                                type="text" required placeholder="Description"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500"
                                value={newExpense.description}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                            />

                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Appliquer à l'Enveloppe</label>
                                <CustomDropdown
                                    options={Array.isArray(categories) ? categories.map(cat => ({
                                        label: cat.name,
                                        value: cat.name,
                                        icon: <Tag className="w-4 h-4" />
                                    })) : []}
                                    value={newExpense.category}
                                    onChange={val => setNewExpense({ ...newExpense, category: val })}
                                    placeholder="Choisir une enveloppe..."
                                />
                            </div>

                            <input
                                type="number" required placeholder="Montant"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                            />
                            <input
                                type="date" required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500"
                                value={newExpense.date}
                                onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                            />
                            <button type="submit" disabled={creating} className="w-full py-4 bg-purple-500 text-white font-black uppercase rounded-2xl shadow-xl shadow-purple-500/20">
                                {creating ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isManageCatsOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="absolute inset-0 bg-background/90" onClick={() => setIsManageCatsOpen(false)} />
                    <div className="relative glass-card w-full max-w-md p-8 rounded-[40px] border-white/10 shadow-2xl">
                        <button onClick={() => setIsManageCatsOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-white"><X className="w-6 h-6" /></button>

                        <h2 className="text-xl font-black text-white uppercase mb-8">Mes Enveloppes</h2>

                        <form onSubmit={handleCreateCategory} className="flex space-x-2 mb-8">
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text" placeholder="Nouvelle enveloppe..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500 text-sm"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="p-2 bg-purple-500 text-white rounded-xl hover:scale-105 transition-all self-start aspect-square flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                        </form>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {Array.isArray(categories) && categories.map(cat => (
                                <div key={cat.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white uppercase text-xs tracking-widest">{cat?.name}</span>
                                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 italic opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/10 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Définir le budget mensuel :</p>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500 font-bold"
                                                placeholder="Montant du budget..."
                                                defaultValue={cat?.budget}
                                                onBlur={async (e) => {
                                                    const val = parseFloat(e.target.value) || 0
                                                    if (val !== Number(cat?.budget)) {
                                                        try {
                                                            await authFetch(`${API_URL}/expenses/categories/${cat.id}`, {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ budget: val })
                                                            })
                                                            await fetchCategories()
                                                            showToast("Budget mis à jour", "success")
                                                        } catch (err) { showToast("Erreur maj budget", "error") }
                                                    }
                                                }}
                                            />
                                            <span className="text-[10px] text-muted-foreground font-black">CFA</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
