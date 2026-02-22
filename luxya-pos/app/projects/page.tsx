'use client'

import React, { useState, useEffect } from 'react'
import {
    FolderKanban, Plus, Search, Users, Calendar, ChevronRight,
    X, Loader2, Briefcase, Building2, CheckCircle2, Clock, XCircle, PauseCircle,
    DollarSign, ArrowRight, ListTodo, Archive,
    FileText, User, LayoutDashboard
} from 'lucide-react'
import CustomDropdown from '@/components/CustomDropdown'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useShop } from '@/context/ShopContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = { id: string; full_name: string | null; email: string | null }

type Project = {
    id: string
    name: string
    type: 'client' | 'agence'
    status: 'planifie' | 'en_cours' | 'termine' | 'annule'
    budget: number | null
    description: string | null
    start_date: string | null
    end_date: string | null
    client_id: string | null
    shop_id: number
    created_at: string
    customers?: { name: string } | null
    _task_count?: number
    _done_count?: number
    _assignees?: Profile[]
}

type Customer = { id: string; name: string }

const STATUS_CONFIG = {
    planifie: { label: 'Planifié', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: PauseCircle },
    en_cours: { label: 'En cours', color: 'text-shop', bg: 'bg-shop/10 border-shop/20', icon: Clock },
    termine: { label: 'Terminé', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', icon: CheckCircle2 },
    annule: { label: 'Annulé', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: XCircle },
}

const TYPE_CONFIG = {
    client: { label: 'Client', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', icon: Users },
    agence: { label: 'Agence', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', icon: Building2 },
}

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>
const ACTIVE_STATUSES = ALL_STATUSES.filter(s => s !== 'annule')

export default function ProjectsPage() {
    const router = useRouter()
    const supabase = createClient()
    const { showToast } = useToast()
    const { activeShop } = useShop()

    const [projects, setProjects] = useState<Project[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'client' | 'agence'>('all')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    
    // Templates
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
    
    // Drag & Drop
    const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null)
    const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

    const [newProject, setNewProject] = useState({
        name: '',
        type: 'client' as 'client' | 'agence',
        status: 'en_cours' as Project['status'],
        budget: '',
        description: '',
        start_date: '',
        end_date: '',
        client_id: '',
    })

    useEffect(() => {
        fetchAll()
        fetchTemplates()
    }, [activeShop])

    const fetchTemplates = async () => {
        const { data } = await supabase.from('agency_project_templates').select('*').order('name');
        if (data) setTemplates(data);
    }

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [{ data: proj }, { data: cust }, { data: profs }] = await Promise.all([
                supabase.from('agency_projects').select('*, customers(name)').order('created_at', { ascending: false }),
                supabase.from('customers').select('id, name').order('name'),
                supabase.from('profiles').select('id, full_name, email')
            ])

            if (!proj || proj.length === 0) {
                setProjects([])
                setCustomers(cust || [])
                setLoading(false)
                return
            }

            const projectIds = proj.map(p => p.id)

            // Fetch all stages for these projects
            const { data: stages } = await supabase.from('agency_stages').select('id, project_id').in('project_id', projectIds)
            
            let allTasks: any[] = []
            if (stages && stages.length > 0) {
                // If there are many stages, we might need to be careful with .in(), but for typical usage it's fine.
                // However, fetching all tasks for the agency without filtering is safe since RLS handles scoping to shop.
                const { data: tasks } = await supabase.from('agency_tasks').select('id, stage_id, status, assignee_id')
                allTasks = tasks || []
            }

            // Map data to projects
            const projectsWithCounts = proj.map((p: any) => {
                const pStages = (stages || []).filter(s => s.project_id === p.id).map(s => s.id)
                const pTasks = allTasks.filter(t => pStages.includes(t.stage_id))
                
                const total = pTasks.length
                const done = pTasks.filter(t => t.status === 'done').length
                
                // Get unique assignees
                const assigneeIds = Array.from(new Set(pTasks.map(t => t.assignee_id).filter(Boolean)))
                const projectAssignees = (profs || []).filter(prof => assigneeIds.includes(prof.id))

                return { 
                    ...p, 
                    _task_count: total, 
                    _done_count: done,
                    _assignees: projectAssignees 
                } as Project
            })

            setProjects(projectsWithCounts)
            setCustomers(cust || [])
        } catch {
            showToast('Erreur de chargement', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const payload = {
                name: newProject.name,
                type: newProject.type,
                status: newProject.status,
                budget: newProject.budget ? parseFloat(newProject.budget) : null,
                description: newProject.description || null,
                start_date: newProject.start_date || null,
                end_date: newProject.end_date || null,
                client_id: newProject.client_id || null,
                shop_id: activeShop?.id,
                created_by: user?.id,
            }
            const { data, error } = await supabase.from('agency_projects').insert([payload]).select().single()
            if (error) throw error

            const newProjectId = data.id;
            
            // If a template is selected, create stages and tasks from it
            if (selectedTemplateId) {
                const template = templates.find(t => t.id === selectedTemplateId);
                if (template && template.template_data?.stages) {
                    const tempIdToRealIdMap = new Map<string, string>();

                    for (const [stageIndex, stageDef] of template.template_data.stages.entries()) {
                        const { data: stageData, error: stageError } = await supabase
                            .from('agency_stages')
                            .insert([{ project_id: newProjectId, name: stageDef.name, position: stageIndex }])
                            .select()
                            .single();
                        
                        if (stageError) throw stageError;
                        const newStageId = stageData.id;

                        if (stageDef.tasks && stageDef.tasks.length > 0) {
                            for (const [taskIndex, taskDef] of stageDef.tasks.entries()) {
                                const { data: taskData, error: taskError } = await supabase
                                    .from('agency_tasks')
                                    .insert([{
                                        stage_id: newStageId,
                                        title: taskDef.title,
                                        position: taskIndex
                                    }])
                                    .select()
                                    .single();

                                if (taskError) throw taskError;
                                tempIdToRealIdMap.set(taskDef.id, taskData.id);
                            }
                        }
                    }

                    // Create links after all tasks are created
                    if (template.template_data.links && template.template_data.links.length > 0) {
                        const linkPayloads = template.template_data.links.map((link: any) => ({
                            from_task_id: tempIdToRealIdMap.get(link.from),
                            to_task_id: tempIdToRealIdMap.get(link.to),
                        })).filter((p: any) => p.from_task_id && p.to_task_id);

                        if (linkPayloads.length > 0) {
                            const { error: linkError } = await supabase.from('agency_task_links').insert(linkPayloads);
                            if (linkError) throw linkError;
                        }
                    }
                }
            } else {
                // Create a default first stage if no template is used
                await supabase.from('agency_stages').insert([{
                    project_id: newProjectId,
                    name: 'Étape 1',
                    position: 0,
                }])
            }

            showToast('Projet créé !', 'success')
            setIsModalOpen(false)
            setNewProject({ name: '', type: 'client', status: 'en_cours', budget: '', description: '', start_date: '', end_date: '', client_id: '' })
            setSelectedTemplateId('')
            fetchAll()
        } catch {
            showToast('Erreur lors de la création', 'error')
        } finally {
            setCreating(false)
        }
    }

    const filtered = projects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.customers?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchType = filterType === 'all' || p.type === filterType
        return matchSearch && matchType
    })

    const grouped = ACTIVE_STATUSES.reduce((acc, status) => {
        acc[status] = filtered.filter(p => p.status === status)
        return acc
    }, {} as Record<string, Project[]>)

    // ── Drag & Drop Handlers ──
    const handleDragStart = (e: React.DragEvent, projectId: string) => {
        e.dataTransfer.setData('projectId', projectId)
        setDraggingProjectId(projectId)
    }

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault()
        if (dragOverStatus !== status) setDragOverStatus(status)
    }

    const handleDragLeave = () => {
        setDragOverStatus(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: Project['status']) => {
        e.preventDefault()
        setDragOverStatus(null)
        setDraggingProjectId(null)

        const projectId = e.dataTransfer.getData('projectId')
        if (!projectId) return

        const project = projects.find(p => p.id === projectId)
        if (!project || project.status === newStatus) return

        // Validation : Pour passer en Terminé, toutes les tâches doivent être accomplies
        if (newStatus === 'termine' && project._task_count! > 0 && project._done_count !== project._task_count) {
            const remaining = project._task_count! - project._done_count!
            showToast(`Impossible : Il reste ${remaining} tâche(s) à accomplir.`, 'error')
            return
        }

        // Optimistic update
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p))

        try {
            const { error } = await supabase.from('agency_projects').update({ status: newStatus }).eq('id', projectId)
            if (error) throw error
        } catch {
            showToast('Erreur lors du déplacement', 'error')
            fetchAll() // Revert on error
        }
    }

    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'en_cours').length

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="glass-panel sticky top-0 z-50 m-4 rounded-[24px] shadow-xl">
                <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-shop rounded-xl flex items-center justify-center shadow-lg shadow-shop/20">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Projets</h1>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                {totalProjects} projet{totalProjects > 1 ? 's' : ''} · {activeProjects} en cours
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/projects/my-tasks" className="flex items-center px-4 py-2 bg-white/5 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <ListTodo className="w-3 h-3 mr-2" /> Mes Tâches
                        </Link>
                        <Link href="/projects/archived" className="flex items-center px-4 py-2 bg-white/5 text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <Archive className="w-3 h-3 mr-2" /> Archives
                        </Link>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center px-4 py-2 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                        >
                            <Plus className="w-3 h-3 mr-2" /> Nouveau
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full px-8 py-6 space-y-6 animate-in fade-in duration-500">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative group flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher un projet ou client..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'client', 'agence'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${filterType === t
                                    ? 'bg-shop text-white border-shop shadow-lg shadow-shop/20'
                                    : 'bg-white/5 text-muted-foreground border-white/10 hover:border-shop/30'
                                    }`}
                            >
                                {t === 'all' ? 'Tous' : t === 'client' ? '👤 Clients' : '🏢 Agence'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Loader2 className="w-12 h-12 animate-spin text-shop mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Chargement...</p>
                    </div>
                ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                            {ACTIVE_STATUSES.map(status => {
                                                const cfg = STATUS_CONFIG[status]
                                                const StatusIcon = cfg.icon
                                                const col = grouped[status]
                                                return (
                                                    <div 
                                                        key={status} 
                                                        className={`space-y-3 rounded-[24px] p-2 transition-colors duration-300 ${dragOverStatus === status ? 'bg-shop/5 border border-dashed border-shop/40' : 'bg-transparent border border-transparent'}`}
                                                        onDragOver={(e) => handleDragOver(e, status)}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={(e) => handleDrop(e, status as Project['status'])}
                                                    >                                    {/* Column header */}
                                    <div className={`flex items-center justify-between px-4 py-2 rounded-2xl border ${cfg.bg}`}>
                                        <div className="flex items-center gap-2">
                                            <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.bg.split(' ')[1]}`}>
                                            {col.length}
                                        </span>
                                    </div>

                                    {/* Project cards */}
                                    <div className="space-y-3">
                                        {col.map(project => {
                                            const typeCfg = TYPE_CONFIG[project.type]
                                            const TypeIcon = typeCfg.icon
                                            const progress = project._task_count ? Math.round((project._done_count! / project._task_count!) * 100) : 0

                                            return (
                                                <div 
                                                    key={project.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, project.id)}
                                                    onClick={() => router.push(`/projects/${project.id}`)}
                                                >
                                                    <div className={`glass-panel p-5 rounded-[24px] border-white/5 hover:border-shop/30 transition-all group cursor-pointer space-y-4
                                                        ${draggingProjectId === project.id ? 'opacity-40 scale-95 border-shop shadow-lg shadow-shop/20' : ''}`}
                                                    >
                                                        {/* Type badge */}
                                                        <div className="flex items-center justify-between">
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${typeCfg.color} ${typeCfg.bg}`}>
                                                                <TypeIcon className="w-3 h-3" />
                                                                {typeCfg.label}
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-shop group-hover:translate-x-1 transition-all" />
                                                        </div>

                                                        {/* Name */}
                                                        <div>
                                                            <h3 className="font-black text-sm text-white group-hover:text-shop transition-colors leading-tight">{project.name}</h3>
                                                            {project.customers?.name && (
                                                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                                    <Users className="w-3 h-3" /> {project.customers.name}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Progress */}
                                                        {project._task_count! > 0 && (
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                                                                    <span>Progression</span>
                                                                    <span className="text-shop">{progress}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-shop rounded-full transition-all duration-500"
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[9px] text-muted-foreground">{project._done_count}/{project._task_count} tâches</p>
                                                                    
                                                                    {/* Assignees Avatars */}
                                                                    {project._assignees && project._assignees.length > 0 && (
                                                                        <div className="flex -space-x-1.5">
                                                                            {project._assignees.slice(0, 3).map(assignee => (
                                                                                <div 
                                                                                    key={assignee.id}
                                                                                    title={assignee.full_name || assignee.email || ''}
                                                                                    className="w-5 h-5 rounded-full bg-[#1a1a1f] text-shop border border-white/10 flex items-center justify-center text-[8px] font-black uppercase shadow-md hover:z-10 hover:scale-110 transition-transform"
                                                                                >
                                                                                    {assignee.full_name ? assignee.full_name.charAt(0) : assignee.email?.charAt(0)}
                                                                                </div>
                                                                            ))}
                                                                            {project._assignees.length > 3 && (
                                                                                <div className="w-5 h-5 rounded-full bg-white/5 text-muted-foreground border border-white/10 flex items-center justify-center text-[7px] font-black uppercase shadow-md">
                                                                                    +{project._assignees.length - 3}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                            {project.budget ? (
                                                                <div className="flex items-center gap-1 text-[9px] font-black text-green-400">
                                                                    <DollarSign className="w-3 h-3" />
                                                                    {project.budget.toLocaleString('fr-FR')} FCFA
                                                                </div>
                                                            ) : <div />}
                                                            {project.end_date && (
                                                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(project.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {col.length === 0 && (
                                            <div className="glass-panel rounded-[24px] p-6 text-center border-dashed border-white/10">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Aucun projet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-2xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground">
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop">
                                <FolderKanban className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Nouveau Projet</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Création d'un projet</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Nom du projet *</label>
                                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                    value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
                            </div>

                            {/* Template Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Utiliser un modèle (Optionnel)</label>
                                <CustomDropdown
                                    options={[
                                        { label: 'Partir de zéro', value: '', icon: <FileText className="w-4 h-4" /> },
                                        ...templates.map(t => ({
                                            label: t.name,
                                            value: t.id,
                                            icon: <LayoutDashboard className="w-4 h-4" />
                                        }))
                                    ]}
                                    value={selectedTemplateId}
                                    onChange={setSelectedTemplateId}
                                    placeholder="Partir de zéro..."
                                />
                            </div>

                            {/* Type + Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Type</label>
                                    <CustomDropdown
                                        options={[
                                            { label: '👤 Client', value: 'client' },
                                            { label: '🏢 Agence', value: 'agence' },
                                        ]}
                                        value={newProject.type}
                                        onChange={val => setNewProject({ ...newProject, type: val })}
                                        searchable={false}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Statut</label>
                                    <CustomDropdown
                                        options={[
                                            { label: 'Planifié', value: 'planifie', icon: <PauseCircle className="w-4 h-4" /> },
                                            { label: 'En cours', value: 'en_cours', icon: <Clock className="w-4 h-4" /> },
                                            { label: 'Terminé', value: 'termine', icon: <CheckCircle2 className="w-4 h-4" /> },
                                            { label: 'Annulé', value: 'annule', icon: <XCircle className="w-4 h-4" /> },
                                        ]}
                                        value={newProject.status}
                                        onChange={val => setNewProject({ ...newProject, status: val })}
                                        searchable={false}
                                    />
                                </div>
                            </div>

                            {/* Client */}
                            {newProject.type === 'client' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Client</label>
                                    <CustomDropdown
                                        options={[
                                            { label: '— Sélectionner un client —', value: '' },
                                            ...customers.map(c => ({
                                                label: c.name,
                                                value: c.id,
                                                icon: <User className="w-4 h-4" />
                                            }))
                                        ]}
                                        value={newProject.client_id}
                                        onChange={val => setNewProject({ ...newProject, client_id: val })}
                                        placeholder="Sélectionner un client..."
                                    />
                                </div>
                            )}

                            {/* Budget */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Budget (FCFA)</label>
                                <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                    value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} placeholder="Ex: 500000" />
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Date de début</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                        value={newProject.start_date} onChange={e => setNewProject({ ...newProject, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Date de fin</label>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50"
                                        value={newProject.end_date} onChange={e => setNewProject({ ...newProject, end_date: e.target.value })} />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description</label>
                                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 resize-none"
                                    value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} placeholder="Décrivez le projet..." />
                            </div>

                            <button type="submit" disabled={creating} className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl flex items-center justify-center gap-2">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {creating ? 'Création...' : 'Créer le projet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
