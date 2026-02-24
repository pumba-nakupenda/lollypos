'use client'

import React, { useState, useEffect } from 'react'
import {
    FolderKanban, Search, Users, Calendar, ChevronLeft,
    Loader2, Archive, RotateCcw, Trash2
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ArchivedProjectsPage() {
    const router = useRouter()
    const supabase = createClient()
    const { showToast } = useToast()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchArchived = async () => {
        setLoading(true)
        try {
            const { data } = await supabase
                .from('agency_projects')
                .select('*, customers(name)')
                .eq('is_archived', true)
                .order('created_at', { ascending: false })
            setProjects(data || [])
        } catch {
            showToast('Erreur de chargement', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchArchived() }, [])

    const handleUnarchive = async (id: string) => {
        try {
            await supabase.from('agency_projects').update({ is_archived: false }).eq('id', id)
            showToast('Projet restauré !', 'success')
            fetchArchived()
        } catch { showToast('Erreur', 'error') }
    }

    const filtered = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="min-h-screen flex flex-col p-4 sm:p-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-6">
                    <Link href="/projects" className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-muted-foreground hover:text-white hover:scale-110 transition-all border border-white/5">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic shop-gradient-text leading-none">Archives</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Projets terminés ou mis de côté</p>
                    </div>
                </div>
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-shop transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Rechercher dans l'oubli..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-shop/50 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center opacity-30"><Loader2 className="w-12 h-12 animate-spin mx-auto text-shop" /></div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-20"><Archive className="w-20 h-20 mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">Aucun projet archivé</p></div>
                ) : filtered.map(p => (
                    <div key={p.id} className="glass-panel p-6 rounded-[32px] border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-muted-foreground border border-white/5"><FolderKanban className="w-5 h-5" /></div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleUnarchive(p.id)} title="Restaurer" className="p-2 bg-shop/10 text-shop rounded-xl hover:bg-shop hover:text-white transition-all opacity-0 group-hover:opacity-100"><RotateCcw className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-white uppercase tracking-tight">{p.name}</h3>
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> {p.customers?.name || 'Inconnu'}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                            <span>{new Date(p.created_at).toLocaleDateString()}</span>
                            <span className="uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Archivé</span>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    )
}
