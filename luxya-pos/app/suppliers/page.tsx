'use client'

import React, { useState, useEffect } from 'react'
import { 
    Truck, Plus, Search, Phone, Mail, MapPin, 
    Trash2, Edit2, X, Check, Loader2, Building2, User
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/client'

export default function SuppliersPage() {
    const { activeShop } = useShop()
    const { showToast } = useToast()
    const supabase = createClient()

    const [suppliers, setSuppliers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [creating, setCreating] = useState(false)

    const [newSupplier, setNewSupplier] = useState({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        category: ''
    })

    useEffect(() => {
        if (activeShop) fetchSuppliers()
    }, [activeShop])

    const fetchSuppliers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('shop_id', activeShop?.id || 1)
                .order('name')
            if (error) throw error
            setSuppliers(data || [])
        } catch (err) {
            showToast("Erreur de chargement", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const { error } = await supabase.from('suppliers').insert([{
                ...newSupplier,
                shop_id: activeShop?.id || 1
            }])
            if (error) throw error
            showToast("Fournisseur ajouté !", "success")
            setIsModalOpen(false)
            setNewSupplier({ name: '', contact_name: '', phone: '', email: '', address: '', category: '' })
            fetchSuppliers()
        } catch (err) {
            showToast("Erreur de création", "error")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce fournisseur ?")) return
        try {
            const { error } = await supabase.from('suppliers').delete().eq('id', id)
            if (error) throw error
            showToast("Fournisseur supprimé", "success")
            fetchSuppliers()
        } catch (err) {
            showToast("Erreur lors de la suppression", "error")
        }
    }

    const filtered = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen p-4 sm:p-8 space-y-6 sm:space-y-8 pb-32">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-4 pl-14 lg:pl-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-xl border border-blue-500/20 shrink-0">
                        <Truck className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white leading-none">Fournisseurs</h1>
                        <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{suppliers.length} partenaires enregistrés</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-white transition-colors" />
                        <input type="text" placeholder="Chercher..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-sm font-bold outline-none focus:border-white/20 transition-all text-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center">
                        <Plus className="w-4 h-4 mr-2" /> Nouveau
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500 opacity-20" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(s => (
                        <div key={s.id} className="glass-panel p-6 rounded-[32px] border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-blue-400 transition-colors">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase truncate max-w-[150px]">{s.name}</h3>
                                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{s.category || 'Général'}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(s.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center text-[10px] text-muted-foreground">
                                    <User className="w-3.5 h-3.5 mr-2 text-white/20" />
                                    <span className="font-bold">{s.contact_name || 'Pas de contact'}</span>
                                </div>
                                <div className="flex items-center text-[10px] text-muted-foreground">
                                    <Phone className="w-3.5 h-3.5 mr-2 text-white/20" />
                                    <span className="font-bold">{s.phone || 'Pas de téléphone'}</span>
                                </div>
                                <div className="flex items-center text-[10px] text-muted-foreground">
                                    <Mail className="w-3.5 h-3.5 mr-2 text-white/20" />
                                    <span className="font-bold truncate">{s.email || "Pas d'email"}</span>
                                </div>
                                <div className="flex items-center text-[10px] text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5 mr-2 text-white/20" />
                                    <span className="font-bold truncate">{s.address || "Pas d'adresse"}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[8px] font-black text-muted-foreground uppercase">Dernier achat</span>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Aucun</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
                    <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
                    <div className="relative glass-card w-full max-w-lg p-10 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full"><X className="w-6 h-6 text-white"/></button>
                        
                        <div className="flex items-center space-x-5 mb-10">
                            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center border border-blue-500/20 shadow-2xl">
                                <Truck className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Nouveau <span className="text-blue-500">Fournisseur.</span></h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">Enregistrement partenaire</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Nom de l'entreprise</label>
                                <input required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500/50 text-white" placeholder="Ex: Grossiste Global S.A." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Contact</label>
                                <input value={newSupplier.contact_name} onChange={e => setNewSupplier({...newSupplier, contact_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500/50 text-white" placeholder="Nom du contact" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Téléphone</label>
                                <input value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500/50 text-white" placeholder="+221 ..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Email</label>
                                <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500/50 text-white" placeholder="fournisseur@exemple.com" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Catégorie</label>
                                <input value={newSupplier.category} onChange={e => setNewSupplier({...newSupplier, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500/50 text-white" placeholder="Ex: Cosmétiques, Tech..." />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Adresse</label>
                                <textarea value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-blue-500/50 text-white h-24 resize-none" placeholder="Adresse complète..." />
                            </div>
                            <button type="submit" disabled={creating} className="md:col-span-2 w-full py-6 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-[28px] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/40 mt-4">
                                {creating ? <Loader2 className="animate-spin mx-auto"/> : "Valider le fournisseur"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
