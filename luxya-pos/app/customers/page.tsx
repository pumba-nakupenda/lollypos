'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, Plus, Search, Mail, Phone, MapPin, Trash2, X, UserPlus, Loader2, Store, Edit2, Save, FileText
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useShop } from '@/context/ShopContext'
import ShopSelector from '@/components/ShopSelector'
import CustomDropdown from '@/components/CustomDropdown'
import { API_URL, authFetch } from '@/utils/api'

export default function CustomersPage() {
    const supabase = createClient()
    const { showToast } = useToast()
    const { activeShop, shops } = useShop()
    
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [updating, setUpdating] = useState(false)

    // Shop selection logic for creation/edit
    const isGlobalView = !activeShop || activeShop.id === 0
    const [selectedShopId, setSelectedShopId] = useState<number>(1)

    const [newCustomer, setNewCustomer] = useState({
        name: '', phone: '', email: '', address: '', ninea: '', rc: '', lead_status: 'customer', lead_source: '', next_follow_up: ''
    })

    const [editingCustomer, setEditingCustomer] = useState<any>(null)
    const [editData, setEditData] = useState({
        name: '', phone: '', email: '', address: '', ninea: '', rc: '', shop_id: 1, lead_status: 'customer', lead_source: '', next_follow_up: ''
    })

    useEffect(() => {
        if (activeShop) {
            fetchCustomers()
            if (activeShop.id !== 0) setSelectedShopId(activeShop.id)
        }
    }, [activeShop])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            let query = supabase.from('customers').select('*').order('name')
            
            if (activeShop && activeShop.id !== 0) {
                query = query.eq('shop_id', activeShop.id)
            }

            const { data, error } = await query
            if (error) throw error
            setCustomers(data || [])
        } catch (err) {
            showToast("Erreur de chargement", "error")
        } finally {
            setLoading(false)
        }
    }

    const syncToCalendar = async (name: string, date: string) => {
        if (!date) return
        try {
            await authFetch(`${API_URL}/calendar/sync-customer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, date })
            })
        } catch (err) {
            console.error("Sync failed", err)
        }
    }

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setCreating(true)
            const payload = { 
                ...newCustomer, 
                shop_id: isGlobalView ? selectedShopId : activeShop?.id 
            }

            const { error } = await supabase.from('customers').insert([payload])
            if (error) throw error
            
            if (newCustomer.next_follow_up) {
                await syncToCalendar(newCustomer.name, newCustomer.next_follow_up)
            }

            showToast("Client enregistré !", "success")
            setIsModalOpen(false)
            setNewCustomer({ name: '', phone: '', email: '', address: '', ninea: '', rc: '', lead_status: 'customer', lead_source: '', next_follow_up: '' })
            fetchCustomers()
        } catch (err: any) {
            console.error("Create error:", err)
            showToast(`Erreur : ${err.message || "lors de la création"}`, "error")
        } finally {
            setCreating(false)
        }
    }

    const openEditModal = (customer: any) => {
        setEditingCustomer(customer)
        setEditData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            ninea: customer.ninea || '',
            rc: customer.rc || '',
            shop_id: customer.shop_id || 1,
            lead_status: customer.lead_status || 'customer',
            lead_source: customer.lead_source || '',
            next_follow_up: customer.next_follow_up || ''
        })
        setIsEditModalOpen(true)
    }

    const handleUpdateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setUpdating(true)
            const { error } = await supabase
                .from('customers')
                .update(editData)
                .eq('id', editingCustomer.id)

            if (error) throw error
            
            if (editData.next_follow_up && editData.next_follow_up !== editingCustomer.next_follow_up) {
                await syncToCalendar(editData.name, editData.next_follow_up)
            }

            showToast("Client mis à jour !", "success")
            setIsEditModalOpen(false)
            fetchCustomers()
        } catch (err: any) {
            console.error("Update error:", err)
            showToast(err.message || "Erreur lors de la mise à jour", "error")
        } finally {
            setUpdating(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer ce client ?")) return
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id)
            if (error) throw error
            showToast("Client supprimé", "success")
            fetchCustomers()
        } catch (err) {
            showToast("Erreur suppression", "error")
        }
    }

    const filteredCustomers = customers.filter(c => 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery)
    )

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-panel sticky top-0 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-shop rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Clients</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                {activeShop?.id === 0 ? 'Toutes les boutiques' : `Répertoire ${activeShop?.name}`}
                            </p>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
                        <div className="hidden md:block scale-90"><ShopSelector /></div>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-6 py-2 bg-shop text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Nouveau Client
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full px-8 py-8 space-y-8 animate-in fade-in duration-500">
                <div className="relative group max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-shop transition-colors" />
                    <input type="text" placeholder="Rechercher un client..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30 backdrop-blur-sm text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Loader2 className="w-12 h-12 animate-spin text-shop mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Chargement...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCustomers.map((customer) => (
                            <div key={customer.id} className="glass-panel p-6 rounded-[32px] border-white/5 space-y-6 hover:border-shop/30 transition-all group relative overflow-hidden">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-shop/20 to-shop/5 border border-shop/20 flex items-center justify-center font-black text-shop text-2xl shadow-inner uppercase">{customer.name.charAt(0)}</div>
                                        <div className="min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-black text-lg text-white group-hover:text-shop transition-colors truncate">{customer.name}</h3>
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                                                    customer.lead_status === 'lead' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                                                    customer.lead_status === 'prospect' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                                                    customer.lead_status === 'qualified' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' :
                                                    customer.lead_status === 'customer' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                                                    'bg-white/5 border-white/10 text-muted-foreground'
                                                }`}>
                                                    {customer.lead_status || 'customer'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{customer.email || "Pas d'email"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => openEditModal(customer)} className="p-2 text-muted-foreground hover:text-shop opacity-0 group-hover:opacity-100 transition-all"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(customer.id)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 text-white/70">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Phone className="w-3.5 h-3.5"/></div>
                                        <span className="text-xs font-bold">{customer.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-white/70">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><MapPin className="w-3.5 h-3.5"/></div>
                                        <span className="text-xs truncate italic">{customer.address || 'Aucune adresse'}</span>
                                    </div>
                                </div>
                                
                                {isGlobalView && (
                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Boutique</span>
                                        <span className="text-[8px] font-black uppercase text-shop px-2 py-0.5 bg-shop/10 rounded-full border border-shop/20">
                                            {shops.find(s => s.id === customer.shop_id)?.name || 'Inconnue'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredCustomers.length === 0 && <div className="col-span-full py-20 text-center opacity-20 font-black uppercase text-xs text-white">Aucun client trouvé</div>}
                    </div>
                )}
            </main>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
                    <div className="relative glass-card w-full max-w-lg p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground"><X className="w-6 h-6"/></button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop"><UserPlus className="w-6 h-6"/></div>
                            <div><h2 className="text-xl font-black uppercase tracking-tight text-white">Nouveau Client</h2><p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Ajout au répertoire</p></div>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-6">
                            {isGlobalView && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Boutique de destination</label>
                                    <CustomDropdown 
                                        options={shops.filter(s => s.id !== 0).map(s => ({ label: s.name, value: s.id, icon: <Store className="w-3.5 h-3.5"/> }))}
                                        value={selectedShopId}
                                        onChange={setSelectedShopId}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nom Complet / Entreprise</label>
                                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Ex: Jean Dupont" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Téléphone</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="+221 ..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="client@email.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Adresse</label>
                                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Dakar, Sénégal" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">NINEA</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.ninea} onChange={e => setNewCustomer({...newCustomer, ninea: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">RC</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.rc} onChange={e => setNewCustomer({...newCustomer, rc: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Statut (Funnel)</label>
                                    <CustomDropdown 
                                        options={[
                                            { label: 'Lead', value: 'lead' },
                                            { label: 'Prospect', value: 'prospect' },
                                            { label: 'Qualifié', value: 'qualified' },
                                            { label: 'Client', value: 'customer' },
                                            { label: 'Inactif', value: 'inactive' },
                                            { label: 'Perdu', value: 'lost' }
                                        ]}
                                        value={newCustomer.lead_status}
                                        onChange={val => setNewCustomer({...newCustomer, lead_status: val})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Source</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.lead_source} onChange={e => setNewCustomer({...newCustomer, lead_source: e.target.value})} placeholder="Ex: Facebook, Referral" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Prochaine Relance (Sync Google)</label>
                                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newCustomer.next_follow_up} onChange={e => setNewCustomer({...newCustomer, next_follow_up: e.target.value})} />
                            </div>

                            <button type="submit" disabled={creating} className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl disabled:opacity-50">
                                {creating ? 'Enregistrement...' : 'Sauvegarder Client'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
                    <div className="relative glass-card w-full max-w-lg p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground"><X className="w-6 h-6"/></button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop"><Edit2 className="w-6 h-6"/></div>
                            <div><h2 className="text-xl font-black uppercase tracking-tight text-white">Modifier Client</h2><p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Mise à jour répertoire</p></div>
                        </div>

                        <form onSubmit={handleUpdateCustomer} className="space-y-6">
                            {isGlobalView && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Boutique assignée</label>
                                    <CustomDropdown 
                                        options={shops.filter(s => s.id !== 0).map(s => ({ label: s.name, value: s.id, icon: <Store className="w-3.5 h-3.5"/> }))}
                                        value={editData.shop_id}
                                        onChange={val => setEditData({...editData, shop_id: val})}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nom Complet / Entreprise</label>
                                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Téléphone</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Adresse</label>
                                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">NINEA</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.ninea} onChange={e => setEditData({...editData, ninea: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">RC</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.rc} onChange={e => setEditData({...editData, rc: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Statut (Funnel)</label>
                                    <CustomDropdown 
                                        options={[
                                            { label: 'Lead', value: 'lead' },
                                            { label: 'Prospect', value: 'prospect' },
                                            { label: 'Qualifié', value: 'qualified' },
                                            { label: 'Client', value: 'customer' },
                                            { label: 'Inactif', value: 'inactive' },
                                            { label: 'Perdu', value: 'lost' }
                                        ]}
                                        value={editData.lead_status}
                                        onChange={val => setEditData({...editData, lead_status: val})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Source</label>
                                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.lead_source} onChange={e => setEditData({...editData, lead_source: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Prochaine Relance (Sync Google)</label>
                                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white" value={editData.next_follow_up} onChange={e => setEditData({...editData, next_follow_up: e.target.value})} />
                            </div>

                            <button type="submit" disabled={updating} className="w-full py-5 bg-shop text-white font-black uppercase tracking-widest rounded-3xl hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-3">
                                {updating ? <Loader2 className="animate-spin" /> : <Save />}
                                <span>{updating ? 'Mise à jour...' : 'Sauvegarder les modifications'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
