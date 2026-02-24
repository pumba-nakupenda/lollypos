'use client'

import React, { useState, useEffect, use, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
    FolderKanban, Calendar, LayoutDashboard, CheckCircle2, 
    Clock, Globe, AlertTriangle, RefreshCcw, MessageSquare, 
    Send, DollarSign, Wallet, Sparkles, ArrowRight, Loader2, Flag, Lock,
    Activity, Layout, Layers, Info, User, Target, ExternalLink, ShieldCheck, Zap, Users
} from 'lucide-react'
import TaskMindMap from '../../components/TaskMindMap'
import TaskTimeline from '../../components/TaskTimeline'

export default function ClientSharePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const supabase = createClient()
    
    const [project, setProject] = useState<any>(null)
    const [stages, setStages] = useState<any[]>([])
    const [taskLinks, setTaskLinks] = useState<any[]>([])
    const [finances, setFinances] = useState({ budget: 0, paid: 0, remaining: 0 })
    const [activeView, setActiveView] = useState<'flow' | 'schedule'>('flow')
    
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [posting, setPosting] = useState(false)
    
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPublicData = useCallback(async (isSilent = false) => {
        if (!token) return;
        try {
            if (!isSilent) setLoading(true)
            const { data: proj, error: pErr } = await supabase.from('agency_projects').select('*').eq('access_token', token).maybeSingle()
            if (pErr) throw pErr;
            if (!proj) { setError("Lien invalide ou expiré"); return; }
            if (proj.status === 'termine') { setError("Ce projet est terminé. L'accès est clos."); return; }
            setProject(proj)

            const { data: sales } = await supabase.from('sales').select('total_amount, paid_amount').eq('project_id', proj.id).eq('status', 'completed')
            const totalPaid = sales?.reduce((acc, s) => acc + (Number(s.paid_amount) || Number(s.total_amount) || 0), 0) || 0
            const budget = Number(proj.budget) || 0
            setFinances({ budget, paid: totalPaid, remaining: Math.max(0, budget - totalPaid) })

            const { data: comms } = await supabase.from('agency_project_comments').select('*, profiles(full_name)').eq('project_id', proj.id).eq('is_public', true).order('created_at', { ascending: true })
            setComments(comms || [])

            const { data: stageData } = await supabase.from('agency_stages').select('*').eq('project_id', proj.id).order('position')
            const stageIds = (stageData || []).map(s => s.id)

            let tasks: any[] = []
            if (stageIds.length > 0) {
                const { data: taskData } = await supabase.from('agency_tasks').select('*').in('stage_id', stageIds).order('position')
                tasks = taskData || []
            }

            const taskIds = tasks.map(t => t.id)
            let links: any[] = []
            if (taskIds.length > 0) {
                const { data: linkData } = await supabase.from('agency_task_links').select('*').in('from_task_id', taskIds)
                links = linkData || []
            }
            setTaskLinks(links)

            const enriched = (stageData || []).map(s => ({
                ...s,
                tasks: tasks.filter(t => t.stage_id === s.id).map(t => {
                    const blocked = links.filter(l => l.to_task_id === t.id).some(l => tasks.find(dt => dt.id === l.from_task_id)?.status !== 'done')
                    return { ...t, _blocked: blocked }
                })
            }))
            setStages(enriched)
        } catch (err: any) { setError("Erreur de connexion") } finally {
            if (!isSilent) setLoading(false)
        }
    }, [token, supabase])

    useEffect(() => { fetchPublicData() }, [fetchPublicData])

    const handleSendComment = async () => {
        if (!newComment.trim() || !project) return
        setPosting(true)
        try {
            const { error: sendErr } = await supabase.from('agency_project_comments').insert([{ project_id: project.id, content: newComment.trim(), is_public: true }])
            if (sendErr) throw sendErr;
            setNewComment(''); await fetchPublicData(true);
        } catch (err: any) { alert(`Erreur : ${err.message}`) } finally { setPosting(false) }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><Loader2 className="w-12 h-12 animate-spin text-shop opacity-20" /></div>
    if (error) return <div className="min-h-screen flex items-center justify-center bg-[#050505] p-10 text-center"><div className="max-w-md space-y-6"><Lock className="w-16 h-16 mx-auto text-red-500/20" /><h1 className="text-3xl font-black shop-gradient-text uppercase italic">{error}</h1><button onClick={() => window.location.reload()} className="px-8 py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">Actualiser</button></div></div>

    const doneCount = stages.reduce((acc, s) => acc + (s.tasks?.filter((t: any) => t.status === 'done').length || 0), 0)
    const totalCount = stages.reduce((acc, s) => acc + (s.tasks?.length || 0), 0)
    const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
    const currentStage = stages.find(s => (s.tasks?.filter((t: any) => t.status === 'done').length || 0) < (s.tasks?.length || 0)) || stages[stages.length - 1];
    const endDate = project?.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : "En attente";

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-shop/30">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,_rgba(var(--shop-primary),0.12),transparent_50%)]" />
            
            {/* NAV */}
            <nav className="max-w-full px-8 py-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-[100] flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop shadow-2xl border border-shop/20"><FolderKanban className="w-6 h-6" /></div>
                    <div><h1 className="text-lg font-black uppercase tracking-tighter italic shop-gradient-text leading-none">{project?.name}</h1><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Lolly Agency Portal</p></div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Connexion Sécurisée</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right leading-none"><p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Avancement</p><p className="text-xl font-black shop-gradient-text">{progress}%</p></div>
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-shop shadow-[0_0_10px_rgba(var(--shop-primary),0.5)]" style={{ width: `${progress}%` }} /></div>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 xl:grid-cols-12 gap-10">
                
                <div className="xl:col-span-8 space-y-10">
                    <header className="glass-panel p-12 rounded-[56px] border-shop/20 bg-shop/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Sparkles className="w-64 h-64" /></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3 bg-shop/10 w-fit px-4 py-2 rounded-full border border-shop/20">
                                <Activity className="w-3.5 h-3.5 text-shop animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-shop">Statut en temps réel</span>
                            </div>
                            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.9] max-w-2xl">
                                Nous travaillons actuellement sur l'étape <span className="text-shop italic underline decoration-shop/30 underline-offset-[12px]">"{currentStage?.name}"</span>.
                            </h2>
                            <div className="flex flex-wrap gap-6 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3 bg-white/[0.02] px-6 py-3 rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div><p className="text-[8px] font-black text-muted-foreground uppercase">Date de livraison</p><p className="text-xs font-black uppercase tracking-widest">{project?.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'À définir'}</p></div>
                                </div>
                                <div className="flex items-center gap-3 bg-white/[0.02] px-6 py-3 rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-all">
                                    <Target className="w-5 h-5 text-muted-foreground" />
                                    <div><p className="text-[8px] font-black text-muted-foreground uppercase">Prochain objectif</p><p className="text-xs font-black uppercase tracking-widest truncate max-w-[150px]">{currentStage?.tasks?.find((t:any)=>t.status!=='done')?.title || 'Finalisation'}</p></div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">Vue Production</h3>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
                                <button onClick={() => setActiveView('flow')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'flow' ? 'bg-shop text-white shadow-lg shadow-shop/20' : 'text-muted-foreground hover:text-white'}`}>Stratégie (Map)</button>
                                <button onClick={() => setActiveView('schedule')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'schedule' ? 'bg-shop text-white shadow-lg shadow-shop/20' : 'text-muted-foreground hover:text-white'}`}>Calendrier (Gantt)</button>
                            </div>
                        </div>
                        <div className="glass-panel rounded-[48px] border-white/5 bg-white/[0.01] overflow-hidden min-h-[600px] shadow-2xl">
                            {activeView === 'flow' ? <TaskMindMap stages={stages} taskLinks={taskLinks} onTaskClick={()=>{}} onLinkCreate={()=>{}} onLinkDelete={()=>{}} onTaskMove={()=>{}} /> : <div className="p-10"><TaskTimeline stages={stages} projectStart={project?.start_date} projectEnd={project?.end_date} /></div>}
                        </div>
                    </section>
                </div>

                <div className="xl:col-span-4 space-y-10">
                    <section className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 px-2"><DollarSign className="w-4 h-4" /> Suivi Comptable</h3>
                        <div className="glass-panel p-8 rounded-[48px] border-white/5 bg-black/40 space-y-6 shadow-2xl">
                            <div className="text-center pb-6 border-b border-white/5"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Reste à payer</p><p className="text-4xl font-black shop-gradient-text tabular-nums">{finances.remaining.toLocaleString()} <span className="text-xs opacity-30">CFA</span></p></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center"><p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Investi</p><p className="text-xs font-black">{finances.budget.toLocaleString()}</p></div>
                                <div className="bg-green-500/5 p-4 rounded-3xl border border-green-500/10 text-center"><p className="text-[8px] font-black text-green-500 uppercase mb-1">Réglé</p><p className="text-xs font-black text-green-400">{finances.paid.toLocaleString()}</p></div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2 px-2"><MessageSquare className="w-4 h-4" /> Support Studio Live</h3>
                        <div className="glass-panel rounded-[48px] border-white/5 bg-black/40 overflow-hidden flex flex-col h-[500px] shadow-2xl border-t-4 border-t-shop/20">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {comments.map((c, i) => {
                                    const isTeam = c.user_id !== null;
                                    return (
                                        <div key={i} className={`flex flex-col ${isTeam ? 'items-start' : 'items-end'} space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className="flex items-center gap-2 px-1">
                                                {isTeam && <span className="text-[7px] font-black uppercase bg-shop/20 text-shop px-1.5 py-0.5 rounded border border-shop/30 shadow-lg shadow-shop/10">Team Lolly</span>}
                                                <span className={`text-[9px] font-bold ${isTeam ? 'text-shop' : 'text-white/40'}`}>{isTeam ? c.profiles?.full_name : 'Vous'}</span>
                                                <span className="text-[7px] font-bold text-white/20">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className={`max-w-[85%] p-4 text-[11px] leading-relaxed shadow-lg ${isTeam ? 'bg-white/10 border border-white/10 text-white rounded-[20px] rounded-tl-none' : 'bg-shop text-white rounded-[20px] rounded-tr-none shadow-shop/20'}`}>{c.content}</div>
                                        </div>
                                    )
                                })}
                                {comments.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4 py-20"><MessageSquare className="w-10 h-10" /><p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Posez votre première question ici...</p></div>}
                            </div>
                            <div className="p-6 bg-black/20 border-t border-white/5">
                                <div className="relative group">
                                    <textarea rows={2} value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Écrire au studio..." className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 pr-16 text-xs text-white outline-none focus:bg-white/[0.07] transition-all resize-none shadow-inner" />
                                    <button onClick={handleSendComment} disabled={posting || !newComment.trim()} className="absolute right-3 bottom-3 w-10 h-10 bg-shop text-white rounded-2xl flex items-center justify-center hover:scale-110 disabled:opacity-20 transition-all shadow-xl shadow-shop/20 active:scale-95">{posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="py-20 text-center opacity-30">
                <h2 className="brand-lolly text-3xl italic font-black uppercase tracking-tighter mb-4">LOLLY AGENCY<span className="text-shop">.</span></h2>
                <p className="text-[8px] font-bold uppercase tracking-[0.4em]">Expérience de production certifiée • 2026</p>
            </footer>
        </div>
    )
}
