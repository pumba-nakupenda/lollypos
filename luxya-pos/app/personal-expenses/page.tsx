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
import { redirect } from 'next/navigation'
import { API_URL } from '@/utils/api'

export default function PersonalExpensesPage() {
    const { activeShop } = useShop()
    const { profile, loading: profileLoading } = useUser()
    const { showToast } = useToast()
    const [expenses, setExpenses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    
    // NEW: Categories management
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
        if (!profileLoading) {
            if (activeShop?.id !== 3 || (profile?.role !== 'admin' && profile?.role !== 'manager')) {
                redirect('/')
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
            const res = await fetch(`${API_URL}/expenses/categories/list?shopId=3&isPersonal=true`)
            if (res.ok) {
                const data = await res.json()
                setCategories(data)
                if (data.length > 0 && !newExpense.category) {
                    setNewExpense(prev => ({ ...prev, category: data[0].name }))
                }
            }
        } catch (e) {}
    }

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCatName.trim()) return
        try {
            const res = await fetch(`${API_URL}/expenses/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCatName, shopId: 3, isPersonal: true })
            })
            if (res.ok) {
                setNewCatName('')
                fetchCategories()
                showToast("Catégorie ajoutée", "success")
            } else {
                const data = await res.json();
                showToast(`Erreur : ${data.message || 'Impossible d\'ajouter'}`, "error")
            }
        } catch (e: any) {
            showToast(`Erreur réseau : ${e.message}`, "error")
        }
    }

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Supprimer cette catégorie ?")) return
        try {
            const res = await fetch(`${API_URL}/expenses/categories/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchCategories()
                showToast("Catégorie supprimée", "success")
            }
        } catch (e) {}
    }

    const fetchPersonalExpenses = async () => {
        try {
            setLoading(true)
            // On filtre par boutique Agence (3) et catégorie "Perso"
            const res = await fetch(`${API_URL}/expenses?shopId=3&category=Perso`)
            if (res.ok) {
                const data = await res.json()
                setExpenses(data)
            } else {
                setError('Impossible de charger les dépenses personnelles')
            }
        } catch (err) {
            setError('Erreur de connexion')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
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
                    category: 'Perso', // Force category to Perso
                    date: new Date(newExpense.date).toISOString(),
                    shopId: 3 // Force shop to Lolly Agency
                })
            })

            if (res.ok) {
                showToast(editingId ? "Dépense mise à jour" : "Dépense perso enregistrée", "success")
                setIsCreateModalOpen(false)
                setEditingId(null)
                setNewExpense({
                    description: '',
                    amount: '',
                    category: 'Personnel (Perso)',
                    date: new Date().toISOString().split('T')[0]
                })
                fetchPersonalExpenses()
            }
        } catch (err) {
            showToast("Erreur de connexion", "error")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Supprimer cette dépense perso ?")) return
        try {
            const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' })
            if (res.ok) {
                showToast("Dépense supprimée", "success")
                fetchPersonalExpenses()
            }
        } catch (e) { showToast("Erreur", "error") }
    }

    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)

    if (profileLoading) return null

    return (
        <div className="min-h-screen flex flex-col pb-12">
            <header className="glass-panel sticky top-4 z-50 mx-4 rounded-[24px] shadow-xl border-white/5">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Dépenses Perso</h1>
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

                <div className="space-y-6">
                    <h3 className="text-2xl font-black tracking-tight uppercase px-4">Historique Perso</h3>
                    
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-purple-500 animate-spin" /></div>
                    ) : expenses.length === 0 ? (
                        <div className="glass-panel rounded-[40px] p-20 text-center space-y-4">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest">Aucune dépense personnelle enregistrée</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {expenses.map((exp) => (
                                <div key={exp.id} className="glass-card p-6 rounded-[28px] border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-white uppercase">{exp.description}</p>
                                            <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1">{new Date(exp.date).toLocaleDateString()}</p>
                                        </div>
                                        <p className="font-black text-red-400">-{parseFloat(exp.amount).toLocaleString()}</p>
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

            {/* Modal simplifié */}
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
                                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                            />
                            
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Catégorie</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500 appearance-none"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name} className="bg-[#0a0a0c]">{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <input 
                                type="number" required placeholder="Montant" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                            />
                            <input 
                                type="date" required 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-purple-500"
                                value={newExpense.date}
                                onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                            />
                            <button type="submit" disabled={creating} className="w-full py-4 bg-purple-500 text-white font-black uppercase rounded-2xl shadow-xl shadow-purple-500/20">
                                {creating ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Gestion des Catégories */}
            {isManageCatsOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="absolute inset-0 bg-background/90" onClick={() => setIsManageCatsOpen(false)} />
                    <div className="relative glass-card w-full max-w-md p-8 rounded-[40px] border-white/10 shadow-2xl">
                        <button onClick={() => setIsManageCatsOpen(false)} className="absolute top-6 right-6 text-muted-foreground hover:text-white"><X className="w-6 h-6" /></button>
                        
                        <h2 className="text-xl font-black text-white uppercase mb-8">Mes Catégories</h2>
                        
                        {/* Ajouter une catégorie */}
                        <form onSubmit={handleCreateCategory} className="flex space-x-2 mb-8">
                            <input 
                                type="text" placeholder="Nouvelle catégorie..." 
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500"
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                            />
                            <button type="submit" className="p-2 bg-purple-500 text-white rounded-xl hover:scale-105 transition-all"><Plus className="w-6 h-6" /></button>
                        </form>

                        {/* Liste des catégories */}
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group">
                                    <span className="font-bold text-white uppercase text-xs tracking-widest">{cat.name}</span>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500/0 group-hover:text-red-500 transition-all p-1 hover:bg-red-500/10 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
