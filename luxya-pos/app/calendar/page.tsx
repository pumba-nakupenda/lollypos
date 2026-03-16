'use client'

import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Link as LinkIcon, RefreshCw, Plus, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/context/ToastContext'
import { API_URL, authFetch } from '@/utils/api'
import { createClient } from '@/utils/supabase/client'

export default function CalendarPage() {
    const { profile } = useUser()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [syncSettings, setSyncSettings] = useState<any>(null)
    const [events, setEvents] = useState<any[]>([])
    const [linking, setLinking] = useState(false)

    useEffect(() => {
        if (profile) {
            fetchSettings()
            fetchEvents()
        }
    }, [profile])

    const fetchSettings = async () => {
        if (!profile?.id) return;
        const supabase = createClient()
        const { data } = await supabase
            .from('user_calendar_settings')
            .select('*')
            .eq('user_id', profile.id)
            .maybeSingle()
        setSyncSettings(data)
    }

    const fetchEvents = async () => {
        try {
            setLoading(true)
            const data = await authFetch(`${API_URL}/calendar/events`)
            setEvents(data || [])
        } catch (err) {
            console.error("Fetch events failed", err)
        } finally {
            setLoading(false)
        }
    }

    const handleLinkGoogle = async () => {
        try {
            setLinking(true)
            const data = await authFetch(`${API_URL}/calendar/auth-url`)
            if (data && data.url) {
                window.location.href = data.url
            } else {
                showToast("Réponse invalide du serveur", "error");
            }
        } catch (err: any) {
            showToast(`Erreur connexion: ${err.message}`, "error")
        } finally {
            setLinking(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#050505]">
            <header className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                        <div className="w-16 h-16 bg-shop/20 rounded-3xl flex items-center justify-center text-shop shadow-2xl border border-shop/20">
                            <CalendarIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter shop-gradient-text">Agenda Lolly</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Synchronisé avec Google Calendar</p>
                        </div>
                    </div>

                    {!syncSettings?.is_sync_enabled ? (
                        <button 
                            onClick={handleLinkGoogle}
                            disabled={linking}
                            className="flex items-center px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-shop hover:text-white transition-all shadow-xl disabled:opacity-50"
                        >
                            {linking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                            Lier mon Google Calendar
                        </button>
                    ) : (
                        <div className="flex items-center space-x-3 px-6 py-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Connecté</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 p-8 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Events List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black uppercase tracking-widest">Événements à venir</h3>
                            <button onClick={fetchEvents} className="p-2 hover:bg-white/5 rounded-full transition-all">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-shop' : 'text-muted-foreground'}`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {events.length > 0 ? events.map((event) => (
                                <div key={event.id} className="flex items-center p-5 bg-white/5 rounded-3xl border border-white/5 hover:border-shop/30 transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center mr-5 border border-white/10 group-hover:bg-shop/10 group-hover:border-shop/20 transition-all">
                                        <span className="text-[10px] font-black text-shop uppercase">{new Date(event.start?.dateTime || event.start?.date).toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                        <span className="text-lg font-black text-white">{new Date(event.start?.dateTime || event.start?.date).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white group-hover:text-shop transition-colors">{event.summary}</h4>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                            {new Date(event.start?.dateTime || event.start?.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center opacity-20">
                                    <CalendarIcon className="w-16 h-16 m-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Aucun événement prévu</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Sync Info */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-white/[0.01]">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-6">Paramètres de Sync</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prospects CRM</span>
                                <div className="w-10 h-5 bg-shop rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 opacity-50">
                                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Projets Deadlines</span>
                                <div className="w-10 h-5 bg-white/10 rounded-full relative"><div className="absolute left-1 top-1 w-3 h-3 bg-white/20 rounded-full" /></div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                                * Vos relances prospects s'ajouteront automatiquement à votre agenda Google une fois la connexion établie.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
