'use client'

import React, { useState, useEffect } from 'react'
import {
    Users, Plus, Search, Mail, Phone, MapPin, Trash2, X, UserPlus, Loader2, Store, Edit2, Save, FileText, TrendingUp, ChevronRight, MessageSquare
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useShop } from '@/context/ShopContext'
import ShopSelector from '@/components/ShopSelector'

const STAGES = [
    { id: 'lead', name: 'Nouveau Lead', color: 'bg-blue-500' },
    { id: 'prospect', name: 'Prospect', color: 'bg-purple-500' },
    { id: 'qualified', name: 'Qualifié', color: 'bg-orange-500' },
    { id: 'customer', name: 'Client', color: 'bg-green-500' }
]

export default function PipelinePage() {
    const supabase = createClient()
    const { showToast } = useToast()
    const { activeShop } = useShop()
    
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (activeShop) {
            fetchCustomers()
        }
    }, [activeShop])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            let query = supabase.from('customers').select('id, name, email, phone, lead_status, created_at, shop_id').order('created_at', { ascending: false })
            
            if (activeShop && activeShop.id !== 0) {
                query = query.eq('shop_id', activeShop.id)
            }

            const { data, error } = await query.limit(200)
            if (error) throw error
            setCustomers(data || [])
        } catch (err) {
            showToast("Erreur de chargement", "error")
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('customers')
                .update({ lead_status: newStatus })
                .eq('id', id)

            if (error) throw error
            setCustomers(customers.map(c => c.id === id ? { ...c, lead_status: newStatus } : c))
            showToast("Statut mis à jour", "success")
        } catch (err) {
            showToast("Erreur lors de la mise à jour", "error")
        }
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-shop animate-spin opacity-20" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#050505]">
            <header className="p-8 pb-0">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 bg-shop/20 rounded-3xl flex items-center justify-center text-shop shadow-2xl border border-shop/20">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter shop-gradient-text">Pipeline Ventes</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Suivi du Funnel de Conversion • {activeShop?.name}</p>
                        </div>
                    </div>
                    <div className="scale-90 origin-right">
                        <ShopSelector />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 pt-4 overflow-x-auto custom-scrollbar">
                <div className="flex space-x-6 min-h-[70vh]">
                    {STAGES.map((stage) => {
                        const stageCustomers = customers.filter(c => (c.lead_status || 'customer') === stage.id)
                        
                        return (
                            <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full ${stage.color} animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">{stage.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground">
                                        {stageCustomers.length}
                                    </span>
                                </div>

                                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[32px] p-4 space-y-4 overflow-y-auto custom-scrollbar">
                                    {stageCustomers.map((customer) => (
                                        <div key={customer.id} className="glass-card p-5 rounded-2xl border-white/5 hover:border-shop/30 transition-all group cursor-default">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-shop uppercase">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <div className="flex space-x-1">
                                                    <button 
                                                        onClick={() => {
                                                            const currentIndex = STAGES.findIndex(s => s.id === stage.id)
                                                            if (currentIndex < STAGES.length - 1) {
                                                                updateStatus(customer.id, STAGES[currentIndex + 1].id)
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-shop/20 rounded-lg text-muted-foreground hover:text-shop transition-all"
                                                        title="Étape suivante"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <h4 className="font-black text-sm text-white mb-1 truncate">{customer.name}</h4>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                                                {customer.phone || customer.email || 'Sans contact'}
                                            </p>

                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                <div className="flex -space-x-2">
                                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center" title="Actions">
                                                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-black uppercase text-muted-foreground opacity-50">
                                                    {new Date(customer.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {stageCustomers.length === 0 && (
                                        <div className="h-40 flex flex-col items-center justify-center opacity-10 text-center px-4">
                                            <Users className="w-8 h-8 mb-2" />
                                            <p className="text-[8px] font-black uppercase tracking-widest">Vide</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}
