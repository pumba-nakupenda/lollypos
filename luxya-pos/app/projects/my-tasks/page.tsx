'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    ArrowLeft, Loader2, CheckSquare, Clock, Square,
    AlertTriangle, Link2, Calendar
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Task = {
    id: string; stage_id: string; title: string; description: string | null
    status: 'todo' | 'in_progress' | 'done'; priority: 'basse' | 'normale' | 'haute' | 'urgente'
    deadline: string | null; position: number
    agency_stages: {
        name: string;
        agency_projects: {
            id: string;
            name: string;
        } | null
    } | null
    // Virtual
    _blocked?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    basse: { label: 'Basse', color: 'text-slate-400', bg: 'bg-slate-400/10', dot: 'bg-slate-400', border: 'border-l-slate-400' },
    normale: { label: 'Normale', color: 'text-blue-400', bg: 'bg-blue-400/10', dot: 'bg-blue-400', border: 'border-l-blue-400' },
    haute: { label: 'Haute', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400', border: 'border-l-amber-400' },
    urgente: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400', border: 'border-l-red-400' },
}

const STATUS_CONFIG = {
    todo: { label: 'À faire', icon: Square, color: 'text-muted-foreground', bg: 'bg-white/5 border-white/10' },
    in_progress: { label: 'En cours', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    done: { label: 'Terminé', icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
    const supabase = createClient()
    const { showToast } = useToast()

    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)

    // Drag and Drop
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
    const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch tasks assigned to me
            const { data: myTasks, error } = await supabase
                .from('agency_tasks')
                .select(`
                    *,
                    agency_stages (
                        name,
                        agency_projects (
                            id,
                            name
                        )
                    )
                `)
                .eq('assignee_id', user.id)
                .order('position', { ascending: true })

            if (error) throw error

            // Fetch links to calculate blocked status
            const { data: links } = await supabase.from('agency_task_links').select('*')
            
            // Note: Optimally we'd only check links against tasks in my projects, 
            // but for a quick blocked status, we check if any 'from' task is not done.
            // Since we don't load ALL tasks here, we must do a subquery or just fetch all active tasks globally (can be heavy).
            // For now, we fetch ALL active tasks to determine blocked status reliably.
            const { data: allActiveTasks } = await supabase.from('agency_tasks').select('id, status').neq('status', 'done')
            const activeTaskIds = new Set((allActiveTasks || []).map(t => t.id))

            const enrichedTasks = (myTasks || []).map((t: any) => {
                const deps = (links || []).filter(l => l.to_task_id === t.id).map(l => l.from_task_id)
                const blocked = deps.some(depId => activeTaskIds.has(depId))
                return { ...t, _blocked: blocked }
            })

            // Sort: Priority (Urgente > Haute > Normale > Basse) and then by creation or deadline
            const priorityWeight = { urgente: 4, haute: 3, normale: 2, basse: 1 }
            enrichedTasks.sort((a, b) => {
                if (a.status === 'done' && b.status !== 'done') return 1;
                if (a.status !== 'done' && b.status === 'done') return -1;
                if (a._blocked && !b._blocked) return 1;
                if (!a._blocked && b._blocked) return -1;
                return priorityWeight[b.priority as keyof typeof priorityWeight] - priorityWeight[a.priority as keyof typeof priorityWeight];
            })

            setTasks(enrichedTasks)
        } catch (e) {
            console.error(e)
            showToast('Erreur de chargement', 'error')
        } finally {
            setLoading(false)
        }
    }, [])

    // ── Status toggle (Click) ──
    const cycleStatus = async (task: Task) => {
        const next: Record<string, Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
        const newStatus = next[task.status]
        
        if (newStatus === 'done' && task._blocked) {
            showToast('Action impossible : cette tâche dépend de tâches non terminées.', 'error')
            return
        }
        
        await supabase.from('agency_tasks').update({ status: newStatus }).eq('id', task.id)
        fetchTasks()
    }

    // ── Drag & Drop Handlers ──
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId)
        setDraggingTaskId(taskId)
    }

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault()
        if (dragOverStatus !== status) setDragOverStatus(status)
    }

    const handleDragLeave = () => {
        setDragOverStatus(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
        e.preventDefault()
        setDragOverStatus(null)
        setDraggingTaskId(null)

        const taskId = e.dataTransfer.getData('taskId')
        if (!taskId) return

        const task = tasks.find(t => t.id === taskId)
        if (!task || task.status === newStatus) return

        if (newStatus === 'done' && task._blocked) {
            showToast('Action impossible : cette tâche dépend de tâches non terminées.', 'error')
            return
        }

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

        try {
            const { error } = await supabase.from('agency_tasks').update({ status: newStatus }).eq('id', taskId)
            if (error) throw error
        } catch {
            showToast('Erreur lors du déplacement', 'error')
            fetchTasks()
        }
    }

    // ── Group tasks ──
    const grouped = ALL_STATUSES.reduce((acc, status) => {
        acc[status] = tasks.filter(t => t.status === status)
        return acc
    }, {} as Record<string, Task[]>)

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="glass-panel sticky top-0 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/projects" className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Mes Tâches</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {tasks.length} tâche(s) assignée(s)
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full px-8 py-6 space-y-6 animate-in fade-in duration-500 overflow-x-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Loader2 className="w-12 h-12 animate-spin text-shop mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Chargement de vos tâches...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <CheckSquare className="w-16 h-16 text-muted-foreground/30 mb-6" />
                        <h2 className="text-xl font-black uppercase tracking-widest mb-2">Vous n'avez aucune tâche assignée</h2>
                        <p className="text-sm text-muted-foreground">Reposez-vous, ou demandez à votre équipe de vous attribuer du travail !</p>
                        <Link href="/projects" className="mt-8 px-6 py-3 bg-shop text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all">
                            Voir les projets
                        </Link>
                    </div>
                ) : (
                    <div className="flex gap-6 min-w-max pb-6">
                        {ALL_STATUSES.map(status => {
                            const cfg = STATUS_CONFIG[status]
                            const StatusIcon = cfg.icon
                            const col = grouped[status]

                            return (
                                <div 
                                    key={status} 
                                    className={`w-80 flex-shrink-0 flex flex-col gap-4 rounded-[32px] p-3 transition-colors duration-300 ${dragOverStatus === status ? 'bg-shop/5 border border-dashed border-shop/40' : 'bg-transparent border border-transparent'}`}
                                    onDragOver={(e) => handleDragOver(e, status)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, status as Task['status'])}
                                >
                                    {/* Column Header */}
                                    <div className={`flex items-center justify-between px-5 py-3 rounded-2xl border ${cfg.bg}`}>
                                        <div className="flex items-center gap-2">
                                            <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                                            <span className={`text-[11px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.bg.split(' ')[1]}`}>
                                            {col.length}
                                        </span>
                                    </div>

                                    {/* Task Cards */}
                                    <div className="flex flex-col gap-3">
                                        {col.map(task => {
                                            const pCfg = PRIORITY_CONFIG[task.priority]
                                            const sCfg = STATUS_CONFIG[task.status]
                                            const TaskIcon = sCfg.icon
                                            const isBlocked = task._blocked && task.status !== 'done'

                                            let cardStyle = 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                            if (task.status === 'done') cardStyle = 'border-green-500/20 bg-green-500/5 opacity-60'
                                            else if (task.status === 'in_progress') cardStyle = 'border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                                            else if (isBlocked) cardStyle = 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'

                                            const projectName = task.agency_stages?.agency_projects?.name || 'Projet Inconnu'
                                            const projectId = task.agency_stages?.agency_projects?.id

                                            return (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                                    className={`glass-panel rounded-[24px] p-5 border transition-all group border-l-4 ${pCfg.border}
                                                        ${draggingTaskId === task.id ? 'opacity-40 scale-95 border-shop shadow-lg shadow-shop/20' : cardStyle}`}
                                                >
                                                    {isBlocked && (
                                                        <div className="flex items-center gap-1.5 mb-3 text-muted-foreground">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">Bloquée</span>
                                                        </div>
                                                    )}

                                                    {/* Context Badge (Project -> Stage) */}
                                                    <div className="flex items-center gap-1 mb-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate">
                                                        <Link href={`/projects/${projectId}`} className="hover:text-shop transition-colors truncate max-w-[120px]">
                                                            {projectName}
                                                        </Link>
                                                        <span className="opacity-50">/</span>
                                                        <span className="truncate max-w-[80px]">{task.agency_stages?.name}</span>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <button
                                                            onClick={() => cycleStatus(task)}
                                                            className={`mt-0.5 flex-shrink-0 ${sCfg.color} hover:scale-110 transition-transform`}
                                                            title={`Changer le statut (Actuel: ${sCfg.label})`}
                                                        >
                                                            <TaskIcon className="w-5 h-5" />
                                                        </button>
                                                        <div className="flex-1">
                                                            <span className={`text-sm font-bold leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-white'}`}>
                                                                {task.title}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-4 pt-4 border-t border-white/5">
                                                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${pCfg.bg} ${pCfg.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                                                            {pCfg.label}
                                                        </div>
                                                        {task.deadline && (
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                                                <Calendar className="w-3 h-3" />
                                                                {new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        
                                        {col.length === 0 && (
                                            <div className="glass-panel rounded-[24px] p-6 text-center border-dashed border-white/10 opacity-50">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Vide</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
