'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    ArrowLeft, Plus, Loader2, X, CheckCircle2, Circle, Clock,
    AlertTriangle, Trash2, Edit2, Save, Users, Calendar, Flag,
    Link2, Link2Off, ChevronDown, GripVertical, CheckSquare, Square,
    MessageSquare, Send, DollarSign, ArrowUpRight, ArrowDownRight, FolderKanban, Archive
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useShop } from '@/context/ShopContext'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = { id: string; full_name: string | null; email: string | null; shop_id?: number | null; shop_ids?: number[] | null }

type TaskComment = {
    id: string; task_id: string; user_id: string; content: string; created_at: string;
    profiles?: { full_name: string | null; email: string | null } | null
}

type Project = {
    id: string; name: string; type: 'client' | 'agence'; status: string
    budget: number | null; description: string | null
    start_date: string | null; end_date: string | null
    client_id: string | null; // Added client_id
    customers?: { name: string } | null
}

// Form state for editing project, where budget is string for input field
type EditProjectFormState = Omit<Project, 'budget'> & { budget: string }

type Stage = {
    id: string; project_id: string; name: string; position: number; status: string
    tasks?: Task[]
}

type Task = {
    id: string; stage_id: string; title: string; description: string | null
    status: 'todo' | 'in_progress' | 'done'; priority: 'basse' | 'normale' | 'haute' | 'urgente'
    assignee_id: string | null; deadline: string | null; position: number
    // Resolved dependency info
    _blocked?: boolean
    _dependencies?: string[]
    _blocking?: string[]
    _assignee?: Profile | null
}

type TaskLink = { from_task_id: string; to_task_id: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
    basse: { label: 'Basse', color: 'text-slate-400', bg: 'bg-slate-400/10', dot: 'bg-slate-400', border: 'border-l-slate-400' },
    normale: { label: 'Normale', color: 'text-blue-400', bg: 'bg-blue-400/10', dot: 'bg-blue-400', border: 'border-l-blue-400' },
    haute: { label: 'Haute', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400', border: 'border-l-amber-400' },
    urgente: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400', border: 'border-l-red-400' },
}

const STATUS_CONFIG = {
    todo: { label: 'À faire', icon: Square, color: 'text-muted-foreground' },
    in_progress: { label: 'En cours', icon: Clock, color: 'text-amber-400' },
    done: { label: 'Terminé', icon: CheckSquare, color: 'text-green-400' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const supabase = createClient()
    const { showToast } = useToast()
    const { activeShop } = useShop()
    const [projectId, setProjectId] = useState<string | null>(null)

    const [project, setProject] = useState<Project | null>(null)
    const [stages, setStages] = useState<Stage[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [taskLinks, setTaskLinks] = useState<TaskLink[]>([])
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    // Tabs
    const [activeTab, setActiveTab] = useState<'kanban' | 'finances'>('kanban')
    const [finances, setFinances] = useState<{expenses: any[], sales: any[]}>({ expenses: [], sales: [] })
    const [loadingFinances, setLoadingFinances] = useState(false)

    // Task modal state
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [taskForm, setTaskForm] = useState({
        title: '', description: '', status: 'todo' as Task['status'],
        priority: 'normale' as Task['priority'], deadline: '', assignee_id: ''
    })
    const [savingTask, setSavingTask] = useState(false)

    // Comments
    const [taskComments, setTaskComments] = useState<TaskComment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [newCommentText, setNewCommentText] = useState('')
    const [postingComment, setPostingComment] = useState(false)

    // Stage editing
    const [editingStageId, setEditingStageId] = useState<string | null>(null)
    const [editingStageValue, setEditingStageValue] = useState('')
    const [addingStage, setAddingStage] = useState(false)
    const [newStageName, setNewStageName] = useState('')

    // Dependency manager
    const [showDepsFor, setShowDepsFor] = useState<string | null>(null)

    // Drag and Drop
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
    const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

    // Project Editing
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)
    const [editingProjectForm, setEditingProjectForm] = useState<EditProjectFormState | null>(null)
    const [customers, setCustomers] = useState<any[]>([])
    const [savingProject, setSavingProject] = useState(false)

    // Resolve params
    useEffect(() => {
        params.then(p => setProjectId(p.id))
    }, [params])

    useEffect(() => {
        if (projectId && activeShop?.id) fetchAll()
    }, [projectId, activeShop])

    const fetchAll = useCallback(async () => {
        if (!projectId || !activeShop?.id) return
        setLoading(true)
        try {
            const [{ data: proj }, { data: stageData }, { data: links }, { data: profs }, { data: custData }] = await Promise.all([
                supabase.from('agency_projects').select('*, customers(name)').eq('id', projectId).single(),
                supabase.from('agency_stages').select('*').eq('project_id', projectId).order('position'),
                supabase.from('agency_task_links').select('*'),
                supabase.from('profiles').select('id, full_name, email, shop_id, shop_ids, role'),
                supabase.from('customers').select('id, name').order('name')
            ])

            if (!proj) { router.push('/projects'); return }
            setProject(proj)
            setTaskLinks(links || [])
            setCustomers(custData || [])
            
            const filteredProfiles = (profs || []).filter((p: any) => 
                p.role === 'admin' ||
                Number(p.shop_id) === Number(activeShop?.id) || 
                (p.shop_ids && p.shop_ids.map(Number).includes(Number(activeShop?.id)))
            ).filter((p: any) => p.role !== 'client')
            setProfiles(filteredProfiles)

            // Fetch tasks for each stage
            const stageIds = (stageData || []).map((s: Stage) => s.id)
            let tasks: Task[] = []
            if (stageIds.length > 0) {
                const { data: taskData } = await supabase
                    .from('agency_tasks')
                    .select('*')
                    .in('stage_id', stageIds)
                    .order('position')
                tasks = taskData || []
            }

            setAllTasks(tasks)

            // Build stages with resolved blocked state and sort by dependency chain
            const enriched = (stageData || []).map((stage: Stage) => {
                const stageTasks = tasks
                    .filter((t: Task) => t.stage_id === stage.id)
                    .map((t: Task) => {
                        const deps = (links || []).filter((l: TaskLink) => l.to_task_id === t.id).map((l: TaskLink) => l.from_task_id)
                        const blocked = deps.some((depId: string) => {
                            const depTask = tasks.find((dt: Task) => dt.id === depId)
                            return depTask && depTask.status !== 'done'
                        })
                        const blocking = (links || []).filter((l: TaskLink) => l.from_task_id === t.id).map((l: TaskLink) => l.to_task_id)
                        const assignee = t.assignee_id ? filteredProfiles.find((p: Profile) => p.id === t.assignee_id) : null
                        return { ...t, _blocked: blocked, _dependencies: deps, _blocking: blocking, _assignee: assignee }
                    })

                const statusOrder = { 'in_progress': 1, 'todo': 2, 'done': 3 }
                
                stageTasks.sort((a, b) => {
                    if (a._blocked && !b._blocked) return 1;
                    if (!a._blocked && b._blocked) return -1;
                    
                    const aBlocks = a._blocking?.length || 0;
                    const bBlocks = b._blocking?.length || 0;
                    if (aBlocks > 0 && bBlocks === 0) return -1;
                    if (bBlocks > 0 && aBlocks === 0) return 1;
                    
                    if (statusOrder[a.status] !== statusOrder[b.status]) {
                         return statusOrder[a.status] - statusOrder[b.status];
                    }

                    return a.position - b.position;
                })

                return { ...stage, tasks: stageTasks }
            })
            setStages(enriched)
        } catch {
            showToast('Erreur de chargement', 'error')
        } finally {
            setLoading(false)
        }
    }, [projectId, activeShop])

    const fetchFinances = async () => {
        if (!projectId) return
        setLoadingFinances(true)
        try {
            const [{ data: ex }, { data: sa }] = await Promise.all([
                supabase.from('expenses').select('*').eq('project_id', projectId).order('date', { ascending: false }),
                supabase.from('sales').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
            ])
            setFinances({ expenses: ex || [], sales: sa || [] })
        } catch {
            showToast('Erreur lors du chargement des finances', 'error')
        } finally {
            setLoadingFinances(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'finances' && projectId) fetchFinances()
    }, [activeTab, projectId])

    // ── Project CRUD ──────────────────────────────────────────────────────────

    const openEditProjectModal = (project: Project) => {
        setEditingProjectForm({
            ...project,
            start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
            end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
            budget: project.budget !== null ? project.budget.toString() : '',
            client_id: project.client_id || '',
        } as EditProjectFormState);
        setIsEditProjectModalOpen(true);
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProjectForm || !projectId) return;
        setSavingProject(true);
        try {
            const updatedPayload = {
                name: editingProjectForm.name,
                type: editingProjectForm.type,
                status: editingProjectForm.status,
                budget: editingProjectForm.budget ? parseFloat(editingProjectForm.budget as string) : null,
                description: editingProjectForm.description || null,
                start_date: editingProjectForm.start_date || null,
                end_date: editingProjectForm.end_date || null,
                client_id: editingProjectForm.client_id || null,
            };
            const { error } = await supabase.from('agency_projects').update(updatedPayload).eq('id', projectId);
            if (error) throw error;

            showToast('Projet mis à jour !', 'success');
            setIsEditProjectModalOpen(false);
            fetchAll();
        } catch (err: any) {
            showToast(`Erreur lors de la mise à jour: ${err.message}`, 'error');
        } finally {
            setSavingProject(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!projectId) return;
        if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?\n\nToutes les étapes, tâches et commentaires associés seront définitivement perdus. Cette action est irréversible.")) {
            try {
                const { error } = await supabase.from('agency_projects').delete().eq('id', projectId);
                if (error) throw error;
                showToast('Projet supprimé avec succès.', 'success');
                router.push('/projects');
            } catch (err: any) {
                showToast(`Erreur lors de la suppression: ${err.message}`, 'error');
            }
        }
    };

    const handleArchiveProject = async () => {
        if (!projectId) return;
        if (confirm("Êtes-vous sûr de vouloir archiver ce projet ?")) {
            try {
                const { error } = await supabase.from('agency_projects').update({ status: 'annule' }).eq('id', projectId);
                if (error) throw error;
                showToast('Projet archivé avec succès.', 'success');
                router.push('/projects');
            } catch (err: any) {
                showToast(`Erreur lors de l'archivage: ${err.message}`, 'error');
            }
        }
    };

    // ── Stage CRUD ────────────────────────────────────────────────────────────

    const addStage = async () => {
        if (!newStageName.trim() || !projectId) return
        const maxPos = stages.length > 0 ? Math.max(...stages.map(s => s.position)) + 1 : 0
        const { error } = await supabase.from('agency_stages').insert([{
            project_id: projectId, name: newStageName.trim(), position: maxPos
        }])
        if (error) { showToast('Erreur', 'error'); return }
        setNewStageName(''); setAddingStage(false)
        fetchAll()
    }

    const renameStage = async (stageId: string) => {
        if (!editingStageValue.trim()) return
        await supabase.from('agency_stages').update({ name: editingStageValue.trim() }).eq('id', stageId)
        setEditingStageId(null)
        fetchAll()
    }

    const deleteStage = async (stageId: string) => {
        if (!confirm('Supprimer cette étape et toutes ses tâches ?')) return
        await supabase.from('agency_stages').delete().eq('id', stageId)
        fetchAll()
    }

    // ── Task CRUD ─────────────────────────────────────────────────────────────

    const fetchComments = async (taskId: string) => {
        setLoadingComments(true)
        try {
            const { data, error } = await supabase
                .from('agency_task_comments')
                .select('*, profiles(full_name, email)')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true })
            
            if (error) throw error
            setTaskComments(data || [])
        } catch (e) {
            console.error('Erreur commentaires:', e)
        } finally {
            setLoadingComments(false)
        }
    }

    const openNewTask = (stageId: string) => {
        setSelectedTask({ id: '', stage_id: stageId, title: '', description: null, status: 'todo', priority: 'normale', assignee_id: null, deadline: null, position: 0 })
        setTaskForm({ title: '', description: '', status: 'todo', priority: 'normale', deadline: '', assignee_id: '' })
        setTaskComments([])
        setIsTaskModalOpen(true)
    }

    const openEditTask = (task: Task) => {
        setSelectedTask(task)
        setTaskForm({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            deadline: task.deadline || '',
            assignee_id: task.assignee_id || '',
        })
        fetchComments(task.id)
        setIsTaskModalOpen(true)
    }

    const postComment = async () => {
        if (!newCommentText.trim() || !selectedTask?.id) return
        setPostingComment(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase.from('agency_task_comments').insert([{
                task_id: selectedTask.id,
                user_id: user.id,
                content: newCommentText.trim()
            }])

            if (error) throw error
            setNewCommentText('')
            fetchComments(selectedTask.id) // Rafraichir les commentaires
        } catch (e) {
            showToast('Erreur lors de l\'envoi du commentaire', 'error')
        } finally {
            setPostingComment(false)
        }
    }

    const saveTask = async () => {
        if (!taskForm.title.trim() || !selectedTask) return
        setSavingTask(true)
        try {
            const payload = {
                title: taskForm.title.trim(),
                description: taskForm.description || null,
                status: taskForm.status,
                priority: taskForm.priority,
                deadline: taskForm.deadline || null,
                assignee_id: taskForm.assignee_id || null,
            }
            if (selectedTask.id) {
                await supabase.from('agency_tasks').update(payload).eq('id', selectedTask.id)
            } else {
                const maxPos = stages.find(s => s.id === selectedTask.stage_id)?.tasks?.length || 0
                await supabase.from('agency_tasks').insert([{ ...payload, stage_id: selectedTask.stage_id, position: maxPos }])
            }
            showToast('Tâche sauvegardée !', 'success')
            setIsTaskModalOpen(false)
            fetchAll()
        } catch {
            showToast('Erreur', 'error')
        } finally {
            setSavingTask(false)
        }
    }

    const deleteTask = async (taskId: string) => {
        if (!confirm('Supprimer cette tâche ?')) return
        await supabase.from('agency_tasks').delete().eq('id', taskId)
        fetchAll()
    }

    const cycleStatus = async (task: Task) => {
        const next: Record<string, Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
        const newStatus = next[task.status]
        
        if (newStatus === 'done' && task._blocked) {
            showToast('Action impossible : cette tâche dépend de tâches non terminées.', 'error')
            return
        }
        
        await supabase.from('agency_tasks').update({ status: newStatus }).eq('id', task.id)
        fetchAll()
    }

    // ── Task Links (dependencies) ─────────────────────────────────────────────

    const toggleDep = async (fromId: string, toId: string) => {
        const exists = taskLinks.find(l => l.from_task_id === fromId && l.to_task_id === toId)
        if (exists) {
            await supabase.from('agency_task_links').delete()
                .eq('from_task_id', fromId).eq('to_task_id', toId)
        } else {
            await supabase.from('agency_task_links').insert([{ from_task_id: fromId, to_task_id: toId }])
        }
        fetchAll()
    }

    // ── Drag & Drop ───────────────────────────────────────────────────────────

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId)
        setDraggingTaskId(taskId)
    }

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault()
        if (dragOverStageId !== stageId) setDragOverStageId(stageId)
    }

    const handleDragLeave = () => {
        setDragOverStageId(null)
    }

    const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
        e.preventDefault()
        setDragOverStageId(null)
        setDraggingTaskId(null)
        
        const taskId = e.dataTransfer.getData('taskId')
        if (!taskId) return

        const task = allTasks.find(t => t.id === taskId)
        if (!task || task.stage_id === targetStageId) return

        // Optimistic update
        setStages(prev => prev.map(stage => {
            if (stage.id === task.stage_id) {
                return { ...stage, tasks: stage.tasks?.filter(t => t.id !== taskId) }
            }
            if (stage.id === targetStageId) {
                const updatedTask = { ...task, stage_id: targetStageId }
                return { ...stage, tasks: [...(stage.tasks || []), updatedTask] }
            }
            return stage
        }))

        await supabase.from('agency_tasks').update({ stage_id: targetStageId }).eq('id', taskId)
        fetchAll()
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    const totalTasks = allTasks.length
    const doneTasks = allTasks.filter(t => t.status === 'done').length
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    // ─────────────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen opacity-30">
            <Loader2 className="w-12 h-12 animate-spin text-shop" />
        </div>
    )

    if (!project) return null

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="glass-panel sticky top-0 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-full px-6 py-4 flex items-center gap-4">
                    <button onClick={() => router.push('/projects')}
                        className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black shop-gradient-text uppercase tracking-tighter leading-none truncate">{project.name}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            {project.customers?.name && (
                                <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" />{project.customers.name}
                                </span>
                            )}
                            {project.end_date && (
                                <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />{new Date(project.end_date).toLocaleDateString('fr-FR')}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex bg-black/40 p-1 rounded-2xl">
                        {(['kanban', 'finances'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
                            >
                                {tab === 'kanban' ? <span className="flex items-center gap-2"><FolderKanban className="w-3.5 h-3.5" />Tâches</span> : <span className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" />Finances</span>}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => openEditProjectModal(project)}
                        className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-shop transition-colors"
                        title="Modifier le projet"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>

                    {/* Progress */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Avancement</p>
                            <p className="text-2xl font-black shop-gradient-text">{progress}%</p>
                        </div>
                        <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-shop rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-[9px] font-black text-muted-foreground">{doneTasks}/{totalTasks} tâches</div>
                    </div>
                </div>
            </header>

            {/* Board or Finances */}
            <main className="flex-1 px-4 py-4 overflow-x-auto">
                {activeTab === 'kanban' ? (
                    <div className="flex gap-4 min-w-max pb-6">
                        {stages.map(stage => (
                            <div 
                                key={stage.id} 
                                className={`w-72 flex-shrink-0 flex flex-col gap-3 rounded-[24px] transition-colors duration-300 ${dragOverStageId === stage.id ? 'bg-shop/5 border border-dashed border-shop/40' : 'bg-transparent border border-transparent'}`}
                                onDragOver={(e) => handleDragOver(e, stage.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, stage.id)}
                            >
                            {/* Stage Header */}
                            <div className="glass-panel rounded-[20px] px-4 py-3 border-white/5 flex items-center gap-2">
                                {editingStageId === stage.id ? (
                                    <div className="flex-1 flex gap-2">
                                        <input
                                            autoFocus
                                            className="flex-1 bg-white/10 rounded-xl px-3 py-1 text-xs font-black outline-none focus:ring-1 ring-shop"
                                            value={editingStageValue}
                                            onChange={e => setEditingStageValue(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') renameStage(stage.id); if (e.key === 'Escape') setEditingStageId(null) }}
                                        />
                                        <button onClick={() => renameStage(stage.id)} className="p-1 text-shop"><Save className="w-3.5 h-3.5" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-white truncate">{stage.name}</span>
                                        <span className="text-[9px] text-muted-foreground font-bold">{stage.tasks?.length || 0}</span>
                                        <button onClick={() => { setEditingStageId(stage.id); setEditingStageValue(stage.name) }}
                                            className="p-1 text-muted-foreground hover:text-shop transition-colors"><Edit2 className="w-3 h-3" /></button>
                                        <button onClick={() => deleteStage(stage.id)}
                                            className="p-1 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                                    </>
                                )}
                            </div>

                            {/* Task cards */}
                            <div className="flex flex-col gap-2 flex-1">
                                {(stage.tasks || []).map(task => {
                                    const pCfg = PRIORITY_CONFIG[task.priority]
                                    const sCfg = STATUS_CONFIG[task.status]
                                    const StatusIcon = sCfg.icon
                                    const isBlocked = task._blocked && task.status !== 'done'
                                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

                                    let cardStyle = 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                    if (isOverdue) cardStyle = 'border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/10'
                                    else if (task.status === 'done') cardStyle = 'border-green-500/20 bg-green-500/5 opacity-60'
                                    else if (task.status === 'in_progress') cardStyle = 'border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                                    else if (isBlocked) cardStyle = 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'

                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            className={`glass-panel rounded-[20px] p-4 border transition-all group cursor-pointer border-l-4 ${pCfg.border}
                                                ${draggingTaskId === task.id ? 'opacity-40 scale-95 border-shop shadow-lg shadow-shop/20' : cardStyle}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {/* Blocked indicator */}
                                                    {isBlocked ? (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground group relative">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">Bloquée</span>
                                                            
                                                            {/* Tooltip for dependencies */}
                                                            {task._dependencies && task._dependencies.length > 0 && (
                                                                <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1f] border border-white/10 rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
                                                                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1.5">En attente de :</p>
                                                                    <ul className="space-y-1">
                                                                        {task._dependencies.map(depId => {
                                                                            const depTask = allTasks.find(t => t.id === depId)
                                                                            return depTask && depTask.status !== 'done' ? (
                                                                                <li key={depId} className="text-[9px] text-white/80 flex items-center gap-1.5 truncate">
                                                                                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                                                                                    {depTask.title}
                                                                                </li>
                                                                            ) : null
                                                                        })}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null}

                                                    {/* Blocking others indicator */}
                                                    {task.status !== 'done' && task._blocking && task._blocking.length > 0 && (
                                                        <div className="flex items-center gap-1.5 text-orange-400 group relative">
                                                            <Link2 className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">Bloque {task._blocking.length} tâche(s)</span>
                                                            
                                                            <div className="absolute left-0 top-full mt-2 w-48 bg-[#1a1a1f] border border-white/10 rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none">
                                                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1.5">Bloque les tâches suivantes :</p>
                                                                <ul className="space-y-1">
                                                                    {task._blocking.map(blockingId => {
                                                                        const blockedTask = allTasks.find(t => t.id === blockingId)
                                                                        return blockedTask ? (
                                                                            <li key={blockingId} className="text-[9px] text-white/80 flex items-center gap-1.5 truncate">
                                                                                <div className="w-1 h-1 bg-orange-400 rounded-full" />
                                                                                {blockedTask.title}
                                                                            </li>
                                                                        ) : null
                                                                    })}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-white cursor-grab active:cursor-grabbing" />
                                            </div>

                                            {/* Title + Status toggle */}
                                            <div className="flex items-start gap-2">
                                                <button
                                                    onClick={() => cycleStatus(task)}
                                                    className={`mt-0.5 flex-shrink-0 ${sCfg.color} hover:scale-110 transition-transform`}
                                                    title={`Statut: ${sCfg.label}`}
                                                >
                                                    <StatusIcon className="w-4 h-4" />
                                                </button>
                                                <span
                                                    onClick={() => openEditTask(task)}
                                                    className={`flex-1 text-xs font-bold leading-snug cursor-pointer hover:text-shop transition-colors ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-white'}`}
                                                >
                                                    {task.title}
                                                </span>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex flex-wrap items-center justify-between gap-y-2 mt-3 pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${pCfg.bg} ${pCfg.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                                                        {pCfg.label}
                                                    </div>
                                                    {task._assignee && (
                                                        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors" title={task._assignee.full_name || task._assignee.email || ''}>
                                                            <div className="w-3.5 h-3.5 rounded-full bg-shop/20 text-shop flex items-center justify-center text-[7px] font-black uppercase">
                                                                {task._assignee.full_name ? task._assignee.full_name.charAt(0) : task._assignee.email?.charAt(0)}
                                                            </div>
                                                            <span className="text-[8px] font-bold text-muted-foreground truncate max-w-[50px]">
                                                                {task._assignee.full_name?.split(' ')[0] || task._assignee.email?.split('@')[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {task.deadline && (
                                                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                                                            <Calendar className="w-2.5 h-2.5" />
                                                            {new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    )}
                                                    {(task._dependencies?.length || 0) > 0 && (
                                                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                                                            <Link2 className="w-2.5 h-2.5" />
                                                            {task._dependencies?.length}
                                                        </span>
                                                    )}
                                                    {/* Dependency manager button */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowDepsFor(showDepsFor === task.id ? null : task.id) }}
                                                        className="p-1 text-muted-foreground hover:text-shop opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Gérer les dépendances"
                                                    >
                                                        <Link2 className="w-3 h-3" />
                                                    </button>
                                                    <button onClick={() => deleteTask(task.id)}
                                                        className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inline dependency picker */}
                                            {showDepsFor === task.id && (
                                                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-2">Cette tâche est bloquée par :</p>
                                                    {allTasks.filter(t => t.id !== task.id).map(otherTask => {
                                                        const linked = taskLinks.some(l => l.from_task_id === otherTask.id && l.to_task_id === task.id)
                                                        const otherStage = stages.find(s => s.id === otherTask.stage_id)
                                                        return (
                                                            <button
                                                                key={otherTask.id}
                                                                onClick={() => toggleDep(otherTask.id, task.id)}
                                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-[9px] font-bold transition-all ${linked ? 'bg-shop/10 text-shop border border-shop/20' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                                                            >
                                                                {linked ? <Link2 className="w-3 h-3 flex-shrink-0" /> : <Link2Off className="w-3 h-3 flex-shrink-0" />}
                                                                <span className="truncate">{otherTask.title}</span>
                                                                <span className="ml-auto text-[8px] opacity-50 flex-shrink-0">{otherStage?.name}</span>
                                                            </button>
                                                        )
                                                    })}
                                                    {allTasks.filter(t => t.id !== task.id).length === 0 && (
                                                        <p className="text-[8px] text-muted-foreground/40 text-center py-2">Aucune autre tâche disponible</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Add task button */}
                                <button
                                    onClick={() => openNewTask(stage.id)}
                                    className="w-full glass-panel rounded-[20px] p-3 border border-dashed border-white/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:border-shop/40 hover:text-shop transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Ajouter une tâche
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add stage column */}
                    <div className="w-72 flex-shrink-0">
                        {addingStage ? (
                            <div className="glass-panel rounded-[20px] p-4 border-white/5 space-y-3">
                                <input
                                    autoFocus
                                    placeholder="Nom de l'étape..."
                                    className="w-full bg-white/10 rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-1 ring-shop"
                                    value={newStageName}
                                    onChange={e => setNewStageName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') addStage(); if (e.key === 'Escape') setAddingStage(false) }}
                                />
                                <div className="flex gap-2">
                                    <button onClick={addStage} className="flex-1 py-2 bg-shop text-white text-[10px] font-black uppercase rounded-xl hover:bg-shop/80 transition-colors">Ajouter</button>
                                    <button onClick={() => setAddingStage(false)} className="px-3 py-2 bg-white/5 text-muted-foreground text-[10px] rounded-xl hover:bg-white/10 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingStage(true)}
                                className="w-full h-16 glass-panel rounded-[20px] border border-dashed border-white/10 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:border-shop/40 hover:text-shop transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Nouvelle Étape
                            </button>
                        )}
                    </div>
                </div>
                ) : (
                    // Finances View
                    <div className="max-w-5xl mx-auto w-full animate-in fade-in duration-300">
                        {loadingFinances ? (
                            <div className="flex justify-center items-center py-20"><Loader2 className="w-10 h-10 animate-spin text-shop" /></div>
                        ) : (
                            <div className="space-y-10">
                                {/* Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 text-center">
                                    <div className="glass-panel p-6 rounded-[32px] border-white/5">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Budget</p>
                                        <p className="text-3xl font-black text-white mt-2">{(project?.budget || 0).toLocaleString('fr-FR')} <span className="text-xl">CFA</span></p>
                                    </div>
                                    <div className="glass-panel p-6 rounded-[32px] border-green-400/20 bg-green-400/5">
                                        <p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Revenus</p>
                                        <p className="text-3xl font-black text-green-400 mt-2">{finances.sales.reduce((sum: any, s: any) => sum + s.total_amount, 0).toLocaleString('fr-FR')} <span className="text-xl">CFA</span></p>
                                    </div>
                                    <div className="glass-panel p-6 rounded-[32px] border-red-400/20 bg-red-400/5">
                                        <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Dépenses</p>
                                        <p className="text-3xl font-black text-red-400 mt-2">{finances.expenses.reduce((sum: any, e: any) => sum + e.amount, 0).toLocaleString('fr-FR')} <span className="text-xl">CFA</span></p>
                                    </div>
                                    <div className="glass-panel p-6 rounded-[32px] border-shop/20 bg-shop/5">
                                        <p className="text-[10px] font-black uppercase text-shop tracking-widest">Marge Nette</p>
                                        <p className={`text-3xl font-black mt-2 ${ (finances.sales.reduce((s: any,c: any)=>s+c.total_amount,0) - finances.expenses.reduce((s: any,c: any)=>s+c.amount,0)) >= 0 ? 'text-shop' : 'text-red-400'}`}>
                                            {(finances.sales.reduce((s: any,c: any)=>s+c.total_amount,0) - finances.expenses.reduce((s: any,c: any)=>s+c.amount,0)).toLocaleString('fr-FR')} <span className="text-xl">CFA</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Lists */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2"><ArrowUpRight className="w-4 h-4 text-green-400"/>Ventes / Factures</h3>
                                        <div className="glass-panel rounded-[32px] border-white/5 p-4 space-y-2">
                                            {finances.sales.length > 0 ? finances.sales.map((sale: any) => (
                                                <div key={`sale-${sale.id}`} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-2xl">
                                                    <div className="text-xs">
                                                        <p className="font-bold text-white">Vente #{sale.id}</p>
                                                        <p className="text-muted-foreground text-[10px]">{new Date(sale.created_at).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                    <p className="font-black text-green-400 text-sm">+{sale.total_amount.toLocaleString('fr-FR')} CFA</p>
                                                </div>
                                            )) : <p className="text-center text-xs text-muted-foreground/50 py-8">Aucune vente liée.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-red-400"/>Dépenses</h3>
                                        <div className="glass-panel rounded-[32px] border-white/5 p-4 space-y-2">
                                            {finances.expenses.length > 0 ? finances.expenses.map((expense: any) => (
                                                <div key={`exp-${expense.id}`} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-2xl">
                                                    <div className="text-xs">
                                                        <p className="font-bold text-white">{expense.description}</p>
                                                        <p className="text-muted-foreground text-[10px]">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
                                                    </div>
                                                    <p className="font-black text-red-400 text-sm">-{expense.amount.toLocaleString('fr-FR')} CFA</p>
                                                </div>
                                            )) : <p className="text-center text-xs text-muted-foreground/50 py-8">Aucune dépense liée.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Task Edit/Create Modal */}
            {isTaskModalOpen && selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-4xl p-0 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
                        <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground z-10"><X className="w-5 h-5" /></button>

                        {/* Left Side: Form */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-white/5">
                            <div className="mb-6">
                                <h2 className="text-lg font-black uppercase tracking-tight">{selectedTask.id ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                                    {stages.find(s => s.id === selectedTask.stage_id)?.name}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Titre *</label>
                                    <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-shop/50"
                                        value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Statut</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-shop/50 appearance-none"
                                            value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}>
                                            <option value="todo">À faire</option>
                                            <option value="in_progress">En cours</option>
                                            <option value="done">Terminé</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Priorité</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-shop/50 appearance-none"
                                            value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}>
                                            <option value="basse">Basse</option>
                                            <option value="normale">Normale</option>
                                            <option value="haute">Haute</option>
                                            <option value="urgente">Urgente</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Assignation</label>
                                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-shop/50 appearance-none"
                                            value={taskForm.assignee_id} onChange={e => setTaskForm({ ...taskForm, assignee_id: e.target.value })}>
                                            <option value="">— Non assigné —</option>
                                            {profiles.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Deadline</label>
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-shop/50"
                                            value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description</label>
                                    <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-shop/50 resize-none"
                                        value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Détails de la tâche..." />
                                </div>

                                <button onClick={saveTask} disabled={savingTask} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl flex items-center justify-center gap-2">
                                    {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {savingTask ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Comments (Only show if editing existing task) */}
                        {selectedTask.id ? (
                            <div className="w-full md:w-96 bg-black/20 flex flex-col relative h-96 md:h-auto">
                                <div className="p-6 border-b border-white/5 flex-shrink-0">
                                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-shop" /> Discussion
                                    </h3>
                                </div>
                                
                                {/* Comments List */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {loadingComments ? (
                                        <div className="flex items-center justify-center h-full opacity-50">
                                            <Loader2 className="w-6 h-6 animate-spin text-shop" />
                                        </div>
                                    ) : taskComments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30">
                                            <MessageSquare className="w-8 h-8" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aucun commentaire</p>
                                        </div>
                                    ) : (
                                        taskComments.map(comment => (
                                            <div key={comment.id} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-shop/20 text-shop border border-shop/30 flex items-center justify-center text-[10px] font-black uppercase flex-shrink-0">
                                                    {comment.profiles?.full_name ? comment.profiles.full_name.charAt(0) : comment.profiles?.email?.charAt(0) || '?'}
                                                </div>
                                                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-white">
                                                            {comment.profiles?.full_name?.split(' ')[0] || comment.profiles?.email?.split('@')[0] || 'Utilisateur'}
                                                        </span>
                                                        <span className="text-[8px] text-muted-foreground">
                                                            {new Date(comment.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Comment Input */}
                                <div className="p-4 border-t border-white/5 bg-black/40 flex-shrink-0">
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            placeholder="Écrire un commentaire..."
                                            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-shop/50"
                                            value={newCommentText}
                                            onChange={e => setNewCommentText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    postComment();
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={postComment}
                                            disabled={postingComment || !newCommentText.trim()}
                                            className="absolute right-2 p-1.5 bg-shop text-white rounded-full hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                        >
                                            {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex w-96 bg-black/20 flex-col items-center justify-center border-l border-white/5 p-8 text-center">
                                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                    Créez la tâche pour<br/>débloquer la discussion
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {isEditProjectModalOpen && editingProjectForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-2xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsEditProjectModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground"><X className="w-6 h-6" /></button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop">
                                <FolderKanban className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Modifier le Projet</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Édition d'un projet existant</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProject} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nom du projet *</label>
                                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                    value={editingProjectForm.name} onChange={e => setEditingProjectForm({ ...editingProjectForm, name: e.target.value })} />
                            </div>

                            {/* Type + Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Type</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 appearance-none"
                                        value={editingProjectForm.type} onChange={e => setEditingProjectForm({ ...editingProjectForm, type: e.target.value as 'client' | 'agence' })}>
                                        <option value="client">👤 Client</option>
                                        <option value="agence">🏢 Agence</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Statut</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 appearance-none"
                                        value={editingProjectForm.status} onChange={e => setEditingProjectForm({ ...editingProjectForm, status: e.target.value as Project['status'] })}>
                                        <option value="planifie">Planifié</option>
                                        <option value="en_cours">En cours</option>
                                        <option value="termine">Terminé</option>
                                        <option value="annule">Annulé</option>
                                    </select>
                                </div>
                            </div>

                            {/* Client */}
                            {editingProjectForm.type === 'client' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Client</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 appearance-none"
                                        value={editingProjectForm.client_id || ''} onChange={e => setEditingProjectForm({ ...editingProjectForm, client_id: e.target.value || null })}>
                                        <option value="">— Sélectionner un client —</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Budget */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Budget (FCFA)</label>
                                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                    value={editingProjectForm.budget} onChange={e => setEditingProjectForm({ ...editingProjectForm, budget: e.target.value })} placeholder="Ex: 500000" />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Date de début</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                        value={editingProjectForm.start_date || ''} onChange={e => setEditingProjectForm({ ...editingProjectForm, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Date de fin</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                        value={editingProjectForm.end_date || ''} onChange={e => setEditingProjectForm({ ...editingProjectForm, end_date: e.target.value })} />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description</label>
                                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 resize-none"
                                    value={editingProjectForm.description || ''} onChange={e => setEditingProjectForm({ ...editingProjectForm, description: e.target.value })} placeholder="Décrivez le projet..." />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <button type="submit" disabled={savingProject} className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl flex items-center justify-center gap-2">
                                    {savingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {savingProject ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleDeleteProject}
                                    className="p-5 bg-red-500/10 text-red-400 rounded-3xl hover:bg-red-500 hover:text-white transition-all shadow-xl flex items-center justify-center"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleArchiveProject}
                                    className="p-5 bg-yellow-500/10 text-yellow-400 rounded-3xl hover:bg-yellow-500 hover:text-white transition-all shadow-xl flex items-center justify-center"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
