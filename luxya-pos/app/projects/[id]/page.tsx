'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import {
    ArrowLeft, Plus, Loader2, X, CheckCircle2, Circle, Clock,
    AlertTriangle, Trash2, Edit2, Save, Users, Calendar, Flag,
    Link2, Link2Off, ChevronDown, GripVertical, CheckSquare, Square,
    MessageSquare, Send, DollarSign, ArrowUpRight, ArrowDownRight, FolderKanban, Archive,
    User, LayoutDashboard, Building2, PauseCircle, XCircle, FileText, Download, Printer, Truck, Sparkles, Globe, RefreshCcw, Lock, Play
} from 'lucide-react'
import CustomDropdown from '@/components/CustomDropdown'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useShop } from '@/context/ShopContext'
import { useRouter } from 'next/navigation'
import TaskMindMap from '../components/TaskMindMap'
import TaskTimeline from '../components/TaskTimeline'
import { useTimeTracker } from '@/context/TimeTrackerContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = { id: string; full_name: string | null; email: string | null; shop_id?: number | null; shop_ids?: number[] | null }

type TaskCategory = { id: string; name: string; icon: string; color: string }
type TaskBadge = { id: string; name: string; color: string }

type TaskComment = {
    id: string; task_id: string; user_id: string; content: string; created_at: string;
    profiles?: { full_name: string | null; email: string | null } | null
}

type Project = {
    id: string; name: string; type: 'client' | 'agence'; status: string
    budget: number | null; description: string | null
    start_date: string | null; end_date: string | null
    client_id: string | null;
    access_token?: string;
    customers?: { name: string; email?: string; phone?: string } | null
}

type EditProjectFormState = Omit<Project, 'budget'> & { budget: string }

type Stage = {
    id: string; project_id: string; name: string; position: number; status: string
    tasks?: Task[]
}

type Task = {
    id: string; stage_id: string; title: string; description: string | null
    status: 'todo' | 'in_progress' | 'done'; priority: 'basse' | 'normale' | 'haute' | 'urgente'
    assignee_id: string | null; deadline: string | null; position: number
    category?: string;
    tags?: string[];
    _blocked?: boolean
    _dependencies?: string[]
    _blocking?: string[]
    _assignee?: Profile | null
}

type TaskLink = { from_task_id: string; to_task_id: string }

type ProjectComment = {
    id: string; project_id: string; user_id: string; content: string; created_at: string; is_public?: boolean;
    type?: 'project' | 'task';
    taskTitle?: string;
    profiles?: { full_name: string | null; email: string | null } | null
}

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
    const { id: projectId } = use(params)
    const router = useRouter()
    const supabase = createClient()
    const { showToast } = useToast()
    const { activeShop } = useShop()
    const { activeEntry, startTimer, stopTimer } = useTimeTracker()

    const [project, setProject] = useState<Project | null>(null)
    const [stages, setStages] = useState<Stage[]>([])
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [taskLinks, setTaskLinks] = useState<TaskLink[]>([])
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    // Manageable Lists
    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([])
    const [taskBadges, setTaskBadges] = useState<TaskBadge[]>([])

    const [activeTab, setActiveTab] = useState<'kanban' | 'timeline' | 'finances' | 'chat'>('kanban')
    const [finances, setFinances] = useState<{expenses: any[], sales: any[]}>({ expenses: [], sales: [] })
    const [timeStats, setTimeStats] = useState({ totalSeconds: 0, byCategory: {} as Record<string, number> })
    const [loadingFinances, setLoadingFinances] = useState(false)

    // Project Chat
    const [projectComments, setProjectComments] = useState<ProjectComment[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loadingProjectComments, setLoadingProjectComments] = useState(false)
    const [postingProjectComment, setPostingProjectComment] = useState(false)
    const [newProjectCommentText, setNewProjectCommentText] = useState('')
    const [commentIsPublic, setCommentIsPublic] = useState(false)

    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [taskForm, setTaskForm] = useState({
        title: '', description: '', status: 'todo' as Task['status'],
        priority: 'normale' as Task['priority'], deadline: '', assignee_id: '',
        category: 'Général',
        tags: [] as string[]
    })
    const [savingTask, setSavingTask] = useState(false)

    const [taskComments, setTaskComments] = useState<TaskComment[]>([])
    const [loadingComments, setLoadingComments] = useState(false)
    const [newCommentText, setNewCommentText] = useState('')
    const [postingComment, setPostingComment] = useState(false)

    const [editingStageId, setEditingStageId] = useState<string | null>(null)
    const [editingStageValue, setEditingStageValue] = useState('')
    const [addingStage, setAddingStage] = useState(false)
    const [newStageName, setNewStageName] = useState('')

    const [showDepsFor, setShowDepsFor] = useState<string | null>(null)
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
    const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)
    const [editingProjectForm, setEditingProjectForm] = useState<EditProjectFormState | null>(null)
    const [customers, setCustomers] = useState<any[]>([])
    const [savingProject, setSavingProject] = useState(false)

    // Invoice
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
    const [generatingInvoice, setGeneratingInvoice] = useState(false)

    // Share
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    const handleCopyLink = () => {
        const url = `${window.location.origin}/projects/share/${project?.access_token}`;
        navigator.clipboard.writeText(url);
        showToast("Lien copié dans le presse-papiers !", "success");
    }

    const handleRegenerateToken = async () => {
        if (!confirm("Voulez-vous invalider le lien actuel et en générer un nouveau ? L'ancien lien ne fonctionnera plus.")) return;
        try {
            const newToken = self.crypto.randomUUID();
            const { error } = await supabase.from('agency_projects').update({ access_token: newToken }).eq('id', projectId);
            if (error) throw error;
            showToast("Nouveau lien généré !", "success");
            fetchAll();
        } catch (e) {
            showToast("Erreur lors de la régénération", "error");
        }
    }

    const handleArchiveProject = async () => {
        if (!confirm("Voulez-vous archiver ce projet ? Il ne sera plus visible dans la liste active.")) return;
        try {
            const { error } = await supabase.from('agency_projects').update({ is_archived: true }).eq('id', projectId);
            if (error) throw error;
            showToast("Projet archivé avec succès", "success");
            router.push('/projects');
        } catch (e) {
            showToast("Erreur lors de l'archivage", "error");
        }
    }

    const fetchAll = useCallback(async () => {
        if (!projectId || !activeShop?.id) return
        setLoading(true)
        try {
            const [
                { data: proj }, 
                { data: stageData }, 
                { data: links }, 
                { data: profs }, 
                { data: custData },
                { data: cats },
                { data: bdgs }
            ] = await Promise.all([
                supabase.from('agency_projects').select('*, customers(*)').eq('id', projectId).single(),
                supabase.from('agency_stages').select('*').eq('project_id', projectId).order('position'),
                supabase.from('agency_task_links').select('*'),
                supabase.from('profiles').select('id, full_name, email, shop_id, shop_ids, role'),
                supabase.from('customers').select('id, name').order('name'),
                supabase.from('agency_task_categories').select('*').order('name'),
                supabase.from('agency_task_badges').select('*').order('name')
            ])

            if (!proj) { router.push('/projects'); return }
            setProject(proj)
            setTaskLinks(links || [])
            setCustomers(custData || [])
            setTaskCategories(cats || [])
            setTaskBadges(bdgs || [])
            
            const filteredProfiles = (profs || []).filter((p: any) => 
                p.role === 'admin' ||
                Number(p.shop_id) === Number(activeShop?.id) || 
                (p.shop_ids && p.shop_ids.map(Number).includes(Number(activeShop?.id)))
            ).filter((p: any) => p.role !== 'client')
            setProfiles(filteredProfiles)

            const stageIds = (stageData || []).map((s: Stage) => s.id)
            let tasks: Task[] = []
            if (stageIds.length > 0) {
                const { data: taskData } = await supabase.from('agency_tasks').select('*').in('stage_id', stageIds).order('position')
                tasks = taskData || []
            }
            setAllTasks(tasks)

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
                return { ...stage, tasks: stageTasks }
            })
            setStages(enriched)
        } catch { showToast('Erreur de chargement', 'error') } finally { setLoading(false) }
    }, [projectId, activeShop?.id, supabase, router, showToast])

    useEffect(() => { fetchAll() }, [fetchAll])

    const fetchFinances = async () => {
        if (!projectId) return
        setLoadingFinances(true)
        try {
            const [{ data: ex }, { data: sa }, { data: timeData }] = await Promise.all([
                supabase.from('expenses').select('*').eq('project_id', projectId).order('date', { ascending: false }),
                supabase.from('sales').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
                supabase.from('agency_task_time_entries')
                    .select('duration_seconds, agency_tasks(category)')
                    .eq('agency_tasks.stage_id', stages[0]?.id) // Simplified filter
            ])

            // Since stages[0].id is too simple, we fetch by task IDs belonging to project stages
            const taskIds = allTasks.map(t => t.id);
            const { data: realTimeData } = await supabase
                .from('agency_task_time_entries')
                .select('duration_seconds, task_id')
                .in('task_id', taskIds);

            const totalSeconds = (realTimeData || []).reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
            
            setFinances({ expenses: ex || [], sales: sa || [] })
            setTimeStats({ totalSeconds, byCategory: {} })
        } catch { showToast('Erreur lors du chargement des finances', 'error') } finally { setLoadingFinances(false) }
    }

    useEffect(() => { if (activeTab === 'finances' && projectId) fetchFinances() }, [activeTab, projectId])

    const markAsRead = useCallback(async () => {
        if (!projectId) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase.rpc('mark_project_comments_as_read', { 
            p_project_id: projectId, 
            p_user_id: user.id 
        });
        setUnreadCount(0);
    }, [projectId, supabase]);

    const fetchProjectComments = useCallback(async () => {
        if (!projectId) return
        setLoadingProjectComments(true)
        try {
            // 1. Fetch general project comments
            const { data: pComments, error: pError } = await supabase
                .from('agency_project_comments')
                .select('*, profiles(full_name, email)')
                .eq('project_id', projectId)

            if (pError) throw pError

            // 2. Fetch task comments for all tasks in this project
            const taskIds = allTasks.map(t => t.id)
            let tComments: any[] = []
            
            if (taskIds.length > 0) {
                const { data: taskCommData, error: tError } = await supabase
                    .from('agency_task_comments')
                    .select('*, profiles(full_name, email), agency_tasks(title)')
                    .in('task_id', taskIds)
                
                if (tError) throw tError
                tComments = taskCommData || []
            }

            // 3. Merge and Sort
            const combined = [
                ...(pComments || []).map(c => ({ ...c, type: 'project' })),
                ...tComments.map(c => ({ 
                    ...c, 
                    type: 'task', 
                    taskTitle: c.agency_tasks?.title
                }))
            ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

            setProjectComments(combined)

            // 4. Update unread count if not in chat tab
            if (activeTab !== 'chat') {
                const { data: { user } } = await supabase.auth.getUser();
                const unread = combined.filter((c: any) => !c.read_at && c.user_id !== user?.id).length;
                setUnreadCount(unread);
            }
        } catch (e) {
            console.error('Erreur chat unifié:', e)
        } finally {
            setLoadingProjectComments(false)
        }
    }, [projectId, supabase, allTasks, activeTab])

    useEffect(() => {
        if (activeTab === 'chat' && projectId) {
            fetchProjectComments()
            markAsRead()
        }
    }, [activeTab, projectId, fetchProjectComments, markAsRead])

    // Real-time subscription
    useEffect(() => {
        if (!projectId) return;

        const projectCommentsChannel = supabase
            .channel(`project-comments-${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'agency_project_comments',
                filter: `project_id=eq.${projectId}`
            }, () => {
                fetchProjectComments();
                if (activeTab === 'chat') markAsRead();
            })
            .subscribe();

        const taskCommentsChannel = supabase
            .channel(`task-comments-${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'agency_task_comments'
            }, (payload) => {
                if (allTasks.some(t => t.id === payload.new.task_id)) {
                    fetchProjectComments();
                    if (activeTab === 'chat') markAsRead();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(projectCommentsChannel);
            supabase.removeChannel(taskCommentsChannel);
        }
    }, [projectId, supabase, activeTab, fetchProjectComments, markAsRead, allTasks]);

    const postProjectComment = async () => {
        if (!newProjectCommentText.trim() || !projectId) return
        setPostingProjectComment(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Non connecté')
            const { error } = await supabase.from('agency_project_comments').insert([{ 
                project_id: projectId, 
                user_id: user.id, 
                content: newProjectCommentText.trim(),
                is_public: commentIsPublic
            }])
            if (error) throw error
            setNewProjectCommentText(''); fetchProjectComments()
        } catch { showToast('Erreur lors de l\'envoi', 'error') } finally { setPostingProjectComment(false) }
    }

    const addStage = async () => {
        if (!newStageName.trim() || !projectId) return
        const maxPos = stages.length > 0 ? Math.max(...stages.map(s => s.position)) + 1 : 0
        const { error } = await supabase.from('agency_stages').insert([{ project_id: projectId, name: newStageName.trim(), position: maxPos }])
        if (error) { showToast('Erreur', 'error'); return }
        setNewStageName(''); setAddingStage(false); fetchAll()
    }

    const renameStage = async (stageId: string) => {
        if (!editingStageValue.trim()) return
        await supabase.from('agency_stages').update({ name: editingStageValue.trim() }).eq('id', stageId)
        setEditingStageId(null); fetchAll()
    }

    const deleteStage = async (stageId: string) => {
        if (!confirm('Supprimer cette étape et toutes ses tâches ?')) return
        await supabase.from('agency_stages').delete().eq('id', stageId); fetchAll()
    }

    const fetchComments = async (taskId: string) => {
        setLoadingComments(true)
        try {
            const { data, error } = await supabase.from('agency_task_comments').select('*, profiles(full_name, email)').eq('task_id', taskId).order('created_at', { ascending: true })
            if (error) throw error
            setTaskComments(data || [])
        } catch (e) { console.error('Erreur commentaires:', e) } finally { setLoadingComments(false) }
    }

    const postComment = async () => {
        if (!newCommentText.trim() || !selectedTask?.id) return
        setPostingComment(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Non connecté')
            const { error } = await supabase.from('agency_task_comments').insert([{ task_id: selectedTask.id, user_id: user.id, content: newCommentText.trim() }])
            if (error) throw error
            setNewCommentText(''); fetchComments(selectedTask.id)
        } catch { showToast('Erreur lors de l\'envoi', 'error') } finally { setPostingComment(false) }
    }

    const openNewTask = (stageId: string) => {
        setSelectedTask({ id: '', stage_id: stageId, title: '', description: null, status: 'todo', priority: 'normale', assignee_id: null, deadline: null, position: 0 })
        setTaskForm({ title: '', description: '', status: 'todo', priority: 'normale', deadline: '', assignee_id: '', category: 'Général', tags: [] })
        setTaskComments([]); setIsTaskModalOpen(true)
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
            category: task.category || 'Général',
            tags: task.tags || []
        })
        fetchComments(task.id); setIsTaskModalOpen(true)
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
                category: taskForm.category,
                tags: taskForm.tags
            }
            if (selectedTask.id) await supabase.from('agency_tasks').update(payload).eq('id', selectedTask.id)
            else {
                const maxPos = stages.find(s => s.id === selectedTask.stage_id)?.tasks?.length || 0
                await supabase.from('agency_tasks').insert([{ ...payload, stage_id: selectedTask.stage_id, position: maxPos }])
            }
            showToast('Tâche sauvegardée !', 'success'); setIsTaskModalOpen(false); fetchAll()
        } catch { showToast('Erreur', 'error') } finally { setSavingTask(false) }
    }

    const cycleStatus = async (task: Task) => {
        const next: Record<string, Task['status']> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
        const newStatus = next[task.status]
        if (newStatus === 'done' && task._blocked) { showToast('Action impossible : cette tâche dépend de tâches non terminées.', 'error'); return }
        await supabase.from('agency_tasks').update({ status: newStatus }).eq('id', task.id); fetchAll()
    }

    const toggleDep = async (fromId: string, toId: string) => {
        const exists = taskLinks.some(l => l.from_task_id === fromId && l.to_task_id === toId)
        if (exists) await supabase.from('agency_task_links').delete().match({ from_task_id: fromId, to_task_id: toId })
        else await supabase.from('agency_task_links').insert([{ from_task_id: fromId, to_task_id: toId }])
        fetchAll()
    }

    const deleteDep = async (fromId: string, toId: string) => {
        await supabase.from('agency_task_links').delete().match({ from_task_id: fromId, to_task_id: toId })
        fetchAll()
    }

    const deleteTask = async (taskId: string) => {
        if (!confirm('Supprimer cette tâche ?')) return
        await supabase.from('agency_tasks').delete().eq('id', taskId); fetchAll()
    }

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault(); if (!editingProjectForm || !projectId) return
        setSavingProject(true)
        try {
            const oldStatus = project?.status;
            const newStatus = editingProjectForm.status;

            const payload = { name: editingProjectForm.name, type: editingProjectForm.type, status: newStatus, budget: editingProjectForm.budget ? parseFloat(editingProjectForm.budget) : null, description: editingProjectForm.description || null, start_date: editingProjectForm.start_date || null, end_date: editingProjectForm.end_date || null, client_id: editingProjectForm.client_id || null }
            const { error } = await supabase.from('agency_projects').update(payload).eq('id', projectId)
            if (error) throw error

            // 🚀 n8n Automation: Trigger only when project becomes 'termine'
            if (newStatus === 'termine' && oldStatus !== 'termine') {
                triggerN8nAutomation();
            }

            showToast('Projet mis à jour !', 'success'); setIsEditProjectModalOpen(false); fetchAll()
        } catch { showToast('Erreur lors de la mise à jour', 'error') } finally { setSavingProject(false) }
    }

    const triggerN8nAutomation = async () => {
        const N8N_WEBHOOK_URL = "https://n8n.srv812544.hstgr.cloud/webhook/42498e23-0479-486a-8530-d1e768662b57";
        
        const reportData = {
            project: project,
            stages: stages,
            finances: finances,
            chat_history: projectComments.map(c => ({
                sender: c.user_id === null ? 'Client' : (c.profiles?.full_name || 'Équipe'),
                content: c.content,
                date: c.created_at,
                is_public: c.is_public,
                type: c.type // 'project' or 'task'
            })),
            stats: {
                total_tasks: allTasks.length,
                done_tasks: allTasks.filter(t => t.status === 'done').length,
                progress: progress
            },
            portal_url: `${window.location.origin}/projects/share/${project?.access_token}`,
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData)
            });
            showToast('Rapport client envoyé à n8n !', 'success');
        } catch (e) {
            console.error('Erreur automation n8n:', e);
            showToast('L\'automation n8n a échoué, mais le projet est terminé.', 'error');
        }
    }

    const handleCreateInvoice = async () => {
        if (!project || !projectId) return
        setGeneratingInvoice(true)
        try {
            const doneStages = stages.filter(s => (s.tasks || []).length > 0 && (s.tasks || []).every(t => t.status === 'done'))
            const totalAmount = project.budget || 0
            
            // Create a sale record
            const { data: sale, error } = await supabase.from('sales').insert([{
                project_id: projectId,
                shop_id: activeShop?.id,
                total_amount: totalAmount,
                payment_method: 'virement',
                customer_id: project.client_id,
                status: 'completed'
            }]).select().single()

            if (error) throw error
            
            showToast('Facture générée avec succès !', 'success')
            setIsInvoiceModalOpen(false)
            fetchFinances()
        } catch (e) {
            showToast('Erreur lors de la génération', 'error')
        } finally {
            setGeneratingInvoice(false)
        }
    }

    const handleDragStart = (e: React.DragEvent, taskId: string) => { e.dataTransfer.setData('taskId', taskId); setDraggingTaskId(taskId) }
    const handleDragOver = (e: React.DragEvent, stageId: string) => { e.preventDefault(); if (dragOverStageId !== stageId) setDragOverStageId(stageId) }
    const handleDragLeave = () => setDragOverStageId(null)
    const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
        e.preventDefault(); setDragOverStageId(null); setDraggingTaskId(null)
        const taskId = e.dataTransfer.getData('taskId')
        if (!taskId) return
        await supabase.from('agency_tasks').update({ stage_id: targetStageId }).eq('id', taskId); fetchAll()
    }

    const totalTasks = allTasks.length
    const doneTasks = allTasks.filter(t => t.status === 'done').length
    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

    if (loading) return <div className="flex items-center justify-center min-h-screen opacity-30"><Loader2 className="w-12 h-12 animate-spin text-shop" /></div>
    if (!project) return null

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-panel sticky top-0 z-50 m-2 sm:m-4 rounded-[20px] sm:rounded-[24px] shadow-xl">
                <div className="max-w-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button onClick={() => router.push('/projects')} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></button>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm sm:text-lg font-black shop-gradient-text uppercase tracking-tighter leading-none truncate">{project.name}</h1>
                                <button onClick={() => { setEditingProjectForm({ ...project, budget: project.budget?.toString() || '' }); setIsEditProjectModalOpen(true) }} className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setIsShareModalOpen(true)} className="p-1.5 bg-shop/10 text-shop rounded-lg hover:bg-shop/20 transition-all border border-shop/20 shadow-sm" title="Partager au client"><Globe className="w-3.5 h-3.5" /></button>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                {project.customers?.name && <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{project.customers.name}</span>}
                                {project.end_date && <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.end_date).toLocaleDateString('fr-FR')}</span>}
                            </div>
                        </div>
                        {/* Mobile Report Button */}
                        <button 
                            onClick={() => triggerN8nAutomation()}
                            disabled={progress < 100}
                            className={`lg:hidden flex items-center justify-center p-2.5 rounded-xl transition-all shadow-xl
                                ${progress < 100 
                                    ? 'bg-white/5 text-muted-foreground opacity-50' 
                                    : 'bg-shop text-white border border-shop/20'}`}
                        >
                            <FileText className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                        <div className="flex bg-black/40 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                            {(['kanban', 'timeline', 'finances', 'chat'] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}>
                                    {tab === 'kanban' ? <span className="flex items-center justify-center gap-2"><FolderKanban className="w-3.5 h-3.5" />Tâches</span> : 
                                    tab === 'timeline' ? <span className="flex items-center justify-center gap-2"><Calendar className="w-3.5 h-3.5" />Gantt</span> :
                                    tab === 'chat' ? (
                                        <span className="flex items-center justify-center gap-2 relative">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Chat
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-2 flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-shop opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-shop text-[6px] items-center justify-center text-white font-black">
                                                        {unreadCount}
                                                    </span>
                                                </span>
                                            )}
                                        </span>
                                    ) :
                                    <span className="flex items-center justify-center gap-2"><DollarSign className="w-3.5 h-3.5" />Finances</span>}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:flex items-center gap-4 ml-auto">
                            <button 
                                onClick={() => triggerN8nAutomation()}
                                disabled={progress < 100}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl
                                    ${progress < 100 
                                        ? 'bg-white/5 text-muted-foreground cursor-not-allowed border border-white/5 opacity-50' 
                                        : 'bg-shop text-white hover:scale-105 active:scale-95 border border-shop/20 animate-pulse hover:animate-none'}`}
                            >
                                <FileText className="w-4 h-4" />
                                {progress < 100 ? `Production: ${progress}%` : "Générer Rapport"}
                            </button>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Avancement</p>
                                <p className="text-2xl font-black shop-gradient-text">{progress}%</p>
                            </div>
                            <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-shop rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-2 sm:px-4 py-4">
                {activeTab === 'kanban' ? (
                    <div className="flex flex-col gap-6 sm:gap-10">
                        {/* Mobile Progress Bar */}
                        <div className="lg:hidden glass-panel mx-2 p-3 rounded-2xl border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                <span>Progression globale</span>
                                <span className="text-shop">{progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-shop rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-4 pb-12 sm:pb-6 px-2 sm:px-4">
                            {stages.map(stage => (
                                <div key={stage.id} id={stage.id} className={`w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 rounded-[24px] transition-colors duration-300 ${dragOverStageId === stage.id ? 'bg-shop/5 border border-dashed border-shop/40' : 'bg-transparent'}`} onDragOver={(e) => handleDragOver(e, stage.id)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, stage.id)}>
                                    <div className="glass-panel rounded-[20px] px-4 py-3.5 border-white/5 flex items-center gap-2">
                                        {editingStageId === stage.id ? (
                                            <div className="flex-1 flex gap-2">
                                                <input autoFocus className="flex-1 bg-white/10 rounded-xl px-3 py-1 text-sm font-black outline-none" value={editingStageValue} onChange={e => setEditingStageValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') renameStage(stage.id); if (e.key === 'Escape') setEditingStageId(null) }} />
                                                <button onClick={() => renameStage(stage.id)} className="p-1 text-shop"><Save className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="flex-1 text-[11px] font-black uppercase tracking-[0.15em] text-white truncate">{stage.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-white/5 rounded-lg text-muted-foreground mr-2">{(stage.tasks || []).length}</span>
                                                    <button onClick={() => { setEditingStageId(stage.id); setEditingStageValue(stage.name) }} className="p-1.5 text-muted-foreground hover:text-shop transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {(stage.tasks || []).map(task => {
                                            const sCfg = STATUS_CONFIG[task.status]
                                            const StatusIcon = sCfg.icon
                                            const isWaiting = task.status === 'todo' && task._blocked
                                            const isTracking = activeEntry?.task_id === task.id
                                            
                                            return (
                                                <div 
                                                    key={task.id} 
                                                    draggable 
                                                    onDragStart={(e) => handleDragStart(e, task.id)} 
                                                    className={`glass-panel rounded-[24px] p-4.5 sm:p-4 border transition-all group cursor-pointer border-l-[6px] ${PRIORITY_CONFIG[task.priority].border} 
                                                        ${task.status === 'done' ? 'opacity-40 grayscale-[0.5]' : ''}
                                                        ${isTracking ? 'border-shop shadow-[0_0_20px_rgba(0,85,255,0.2)] scale-[1.02] bg-shop/5' : ''}
                                                        ${isWaiting ? 'opacity-20 grayscale border-dashed border-white/5 cursor-not-allowed' : 'hover:border-white/20'}`} 
                                                    onClick={() => openEditTask(task)}
                                                >
                                                    <div className="flex items-center justify-between mb-2.5">
                                                        <div className="flex items-center gap-2">
                                                            {task._blocked && <AlertTriangle className={`w-3.5 h-3.5 ${isWaiting ? 'text-muted-foreground' : 'text-red-400'}`} />}
                                                            {isWaiting && <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">En attente</span>}
                                                            {isTracking && <div className="flex items-center gap-1.5 bg-shop/20 px-2 py-0.5 rounded-full animate-pulse"><Clock className="w-2.5 h-2.5 text-shop" /><span className="text-[8px] font-black uppercase text-shop">Chrono</span></div>}
                                                        </div>
                                                        <GripVertical className="w-3.5 h-3.5 text-white/10" />
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if(!isWaiting) cycleStatus(task); }} 
                                                            className={`mt-0.5 flex-shrink-0 p-1.5 rounded-lg bg-white/5 ${isWaiting ? 'text-muted-foreground/30' : sCfg.color} hover:scale-110 transition-transform`}
                                                            disabled={isWaiting}
                                                        >
                                                            <StatusIcon className="w-5 h-5" />
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-[13px] sm:text-xs font-bold leading-tight ${task.status === 'done' ? 'line-through' : isWaiting ? 'text-muted-foreground' : 'text-white'}`}>{task.title}</p>
                                                            
                                                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                                {task.category && task.category !== 'Général' && (
                                                                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black uppercase text-muted-foreground">{task.category}</span>
                                                                )}
                                                                {task.tags?.map(tag => (
                                                                    <span key={tag} className="px-2 py-0.5 bg-shop/5 border border-shop/10 rounded-md text-[8px] font-black uppercase text-shop">{tag}</span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {!isWaiting && task.status !== 'done' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); isTracking ? stopTimer() : startTimer(task.id, task.title); }}
                                                                className={`p-2.5 rounded-xl transition-all shadow-lg ${isTracking ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-muted-foreground hover:bg-shop hover:text-white opacity-0 group-hover:opacity-100'}`}
                                                            >
                                                                {isTracking ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${PRIORITY_CONFIG[task.priority].bg} ${PRIORITY_CONFIG[task.priority].color}`}>{task.priority}</span>
                                                            {task._assignee && <div className="w-5 h-5 rounded-full bg-shop/20 text-shop border border-shop/10 flex items-center justify-center text-[9px] font-black uppercase">{task._assignee.full_name?.charAt(0)}</div>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {task.deadline && <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setShowDepsFor(showDepsFor === task.id ? null : task.id); }}
                                                                className={`p-1.5 rounded-lg transition-all ${showDepsFor === task.id ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground hover:text-shop hover:bg-shop/10 opacity-0 group-hover:opacity-100'}`}
                                                            >
                                                                <Link2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {showDepsFor === task.id && (
                                                        <div className="mt-4 pt-4 border-t border-white/10 space-y-2 animate-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
                                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Dépend de :</p>
                                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                                                {allTasks.filter(t => t.id !== task.id).map(otherTask => {
                                                                    const linked = taskLinks.some(l => l.from_task_id === otherTask.id && l.to_task_id === task.id)
                                                                    return (
                                                                        <button
                                                                            key={otherTask.id}
                                                                            onClick={() => toggleDep(otherTask.id, task.id)}
                                                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${linked ? 'bg-shop/10 text-shop border border-shop/20 shadow-sm shadow-shop/10' : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent'}`}
                                                                        >
                                                                            {linked ? <Link2 className="w-4 h-4 flex-shrink-0" /> : <Link2Off className="w-4 h-4 flex-shrink-0" />}
                                                                            <span className="truncate">{otherTask.title}</span>
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        <button onClick={() => openNewTask(stage.id)} className="w-full h-14 glass-panel rounded-[24px] border border-dashed border-white/10 text-[10px] font-black uppercase text-muted-foreground hover:text-shop flex items-center justify-center gap-2 transition-all active:scale-95"><Plus className="w-4 h-4" /> Ajouter une tâche</button>
                                    </div>
                                </div>
                            ))}
                            <div className="w-full lg:w-80 flex-shrink-0">
                                {addingStage ? (
                                    <div className="glass-panel rounded-[28px] p-5 space-y-4 shadow-2xl">
                                        <input autoFocus className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-white outline-none focus:border-shop/50" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Nom de l'étape..." onKeyDown={e => e.key === 'Enter' && addStage()} />
                                        <div className="flex gap-2"><button onClick={addStage} className="flex-1 py-3 bg-shop text-white text-[11px] font-black uppercase rounded-2xl shadow-lg">Ajouter</button><button onClick={() => setAddingStage(false)} className="px-4 py-3 bg-white/5 text-muted-foreground rounded-2xl hover:text-white transition-colors"><X className="w-4 h-4" /></button></div>
                                    </div>
                                ) : (
                                    <button onClick={() => setAddingStage(true)} className="w-full h-16 glass-panel rounded-[28px] border border-dashed border-white/10 text-[10px] font-black uppercase text-muted-foreground hover:text-shop flex items-center justify-center gap-2 transition-all active:scale-95"><Plus className="w-5 h-5" /> Nouvelle Étape</button>
                                )}
                            </div>
                        </div>

                        <TaskMindMap 
                            stages={stages} 
                            taskLinks={taskLinks} 
                            onTaskClick={openEditTask} 
                            onLinkCreate={toggleDep}
                            onLinkDelete={deleteDep}
                            onTaskMove={async (taskId, targetStageId) => {
                                await supabase.from('agency_tasks').update({ stage_id: targetStageId }).eq('id', taskId);
                                fetchAll();
                            }}
                        />
                    </div>
                ) : activeTab === 'timeline' ? (
                    <div className="max-w-5xl mx-auto w-full px-4">
                        <TaskTimeline stages={stages} projectStart={project.start_date} projectEnd={project.end_date} />
                    </div>
                ) : activeTab === 'chat' ? (
                    <div className="max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-250px)] glass-panel rounded-[40px] border-white/5 bg-black/20 overflow-hidden animate-in fade-in duration-500">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-shop/20 rounded-2xl flex items-center justify-center text-shop"><MessageSquare className="w-5 h-5" /></div>
                                <div><h3 className="text-sm font-black uppercase tracking-widest text-white leading-none">Discussion de Projet</h3><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Espace collaboratif pour l'équipe</p></div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {loadingProjectComments ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30"><Loader2 className="w-10 h-10 animate-spin text-shop" /></div>
                            ) : projectComments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center"><MessageSquare className="w-10 h-10" /></div>
                                    <div><p className="text-sm font-black uppercase tracking-widest">Aucun message ici.</p><p className="text-[10px] font-bold mt-1 uppercase">Lancez la discussion !</p></div>
                                </div>
                            ) : projectComments.map((msg: any) => {
                                const isMe = profiles.find(p => p.email === msg.profiles?.email)?.id === msg.user_id;
                                const isClient = msg.user_id === null;
                                
                                return (
                                    <div key={`${msg.type}-${msg.id}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-2 animate-in slide-in-from-bottom-2 duration-300`}>
                                        {/* Header Info */}
                                        <div className={`flex items-center gap-3 px-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] font-black text-white uppercase tracking-tight">
                                                {isClient ? 'Client (Portail)' : (msg.profiles?.full_name || 'Équipe')}
                                            </span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {msg.is_public && <span title="Visible par le client"><Globe className="w-3 h-3 text-green-500" /></span>}
                                            {!msg.is_public && !isClient && <span title="Message interne"><Lock className="w-3 h-3 text-muted-foreground/30" /></span>}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`group relative max-w-[80%] p-5 rounded-[28px] border shadow-xl transition-all
                                            ${isMe 
                                                ? 'bg-shop text-white border-shop/20 rounded-tr-none shadow-shop/10' 
                                                : isClient 
                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 rounded-tl-none' 
                                                : 'bg-white/[0.03] border-white/10 text-muted-foreground rounded-tl-none'
                                            }`}
                                        >
                                            {/* Context Badge (if task comment) */}
                                            {msg.type === 'task' && (
                                                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/5">
                                                    <span className="text-[7px] font-black uppercase bg-white/10 px-1.5 py-0.5 rounded text-white/50">Tâche :</span>
                                                    <span className="text-[7px] font-bold uppercase truncate max-w-[150px]">{msg.taskTitle}</span>
                                                </div>
                                            )}

                                            <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            
                                            {/* Public/Private Visual Indicator Badge */}
                                            {msg.is_public && (
                                                <div className={`absolute -bottom-2 ${isMe ? 'right-4' : 'left-4'} px-2 py-0.5 bg-green-500 text-[7px] font-black uppercase rounded-full text-white shadow-lg`}>
                                                    Public
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-black/40 border-t border-white/5">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setCommentIsPublic(!commentIsPublic)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${commentIsPublic ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10 text-muted-foreground opacity-50'}`}
                                        >
                                            {commentIsPublic ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                            <span className="text-[9px] font-black uppercase tracking-widest">{commentIsPublic ? 'Visible par le client' : 'Interne (Équipe uniquement)'}</span>
                                        </button>
                                    </div>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Appuyez sur Entrée pour envoyer</p>
                                </div>

                                <div className="relative group">
                                    <textarea 
                                        rows={1}
                                        placeholder={commentIsPublic ? "Écrire au client..." : "Écrire un message interne..."}
                                        className={`w-full bg-white/5 border rounded-[24px] py-4 pl-6 pr-16 text-sm text-white placeholder:text-muted-foreground/30 outline-none transition-all resize-none max-h-32 shadow-inner ${commentIsPublic ? 'border-green-500/30 focus:border-green-500/50' : 'border-white/10 focus:border-shop/50'}`}
                                        value={newProjectCommentText}
                                        onChange={e => setNewProjectCommentText(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                postProjectComment();
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => postProjectComment()}
                                        disabled={postingProjectComment || !newProjectCommentText.trim()}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-xl ${commentIsPublic ? 'bg-green-500 shadow-green-500/20' : 'bg-shop shadow-shop/20'}`}
                                    >
                                        {postingProjectComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto w-full space-y-10 animate-in fade-in duration-500">
                        {loadingFinances ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-shop" /></div> : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                                    <div className="glass-panel p-6 rounded-[32px] border-white/5"><p className="text-[10px] font-black uppercase text-muted-foreground">Revenus</p><p className="text-2xl font-black text-green-400 mt-2">{finances.sales.reduce((s,c)=>s+c.total_amount,0).toLocaleString()} CFA</p></div>
                                    <div className="glass-panel p-6 rounded-[32px] border-white/5"><p className="text-[10px] font-black uppercase text-muted-foreground">Dépenses</p><p className="text-2xl font-black text-red-400 mt-2">{finances.expenses.reduce((s,c)=>s+c.amount,0).toLocaleString()} CFA</p></div>
                                    <div className="glass-panel p-6 rounded-[32px] border-shop/20 bg-shop/5"><p className="text-[10px] font-black uppercase text-shop">Temps Passé</p><p className="text-2xl font-black text-white mt-2">{Math.floor(timeStats.totalSeconds / 3600)}h {Math.floor((timeStats.totalSeconds % 3600) / 60)}m</p></div>
                                    <div className="glass-panel p-6 rounded-[32px] border-amber-500/20 bg-amber-500/5"><p className="text-[10px] font-black uppercase text-amber-500">Rentabilité</p><p className="text-2xl font-black text-white mt-2">{(finances.sales.reduce((s,c)=>s+c.total_amount,0) - finances.expenses.reduce((s,c)=>s+c.amount,0) - (Math.floor(timeStats.totalSeconds / 3600) * 15000)).toLocaleString()} CFA</p></div>
                                </div>

                                <div className="flex justify-end px-4">
                                    <button 
                                        onClick={() => setIsInvoiceModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
                                    >
                                        <FileText className="w-4 h-4" /> Générer Facture Automatique
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ArrowUpRight className="text-green-400 w-4 h-4"/>Ventes</h3>
                                        <div className="glass-panel p-4 rounded-[32px] space-y-2">
                                            {finances.sales.map(s => <div key={s.id} className="flex justify-between p-3 bg-white/5 rounded-2xl"><span className="text-xs font-bold text-white">#{s.id}</span><span className="text-xs font-black text-green-400">+{s.total_amount.toLocaleString()}</span></div>)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ArrowDownRight className="text-red-400 w-4 h-4"/>Dépenses</h3>
                                        <div className="glass-panel p-4 rounded-[32px] space-y-2">
                                            {finances.expenses.map(e => <div key={e.id} className="flex justify-between p-3 bg-white/5 rounded-2xl"><span className="text-xs font-bold text-white">{e.description}</span><span className="text-xs font-black text-red-400">-{e.amount.toLocaleString()}</span></div>)}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* Invoice Generation Modal */}
            {isInvoiceModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-2xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsInvoiceModalOpen(false)} className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-white"><X className="w-6 h-6"/></button>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop"><FileText className="w-6 h-6" /></div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Générer Facture</h2>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Basé sur le budget et l'avancement</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="glass-panel p-6 rounded-3xl border-white/5 bg-white/[0.02]">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-muted-foreground">Client</span>
                                    <span className="text-xs font-black text-white">{project.customers?.name || 'Inconnu'}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-muted-foreground">Projet</span>
                                    <span className="text-xs font-black text-white">{project.name}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <span className="text-sm font-black text-white uppercase">Montant Total</span>
                                    <span className="text-xl font-black text-shop">{(project.budget || 0).toLocaleString()} CFA</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase text-muted-foreground ml-2">Éléments inclus</p>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                    {stages.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                                            <span className="text-xs font-bold text-white">{s.name}</span>
                                            { (s.tasks || []).every(t => t.status === 'done') && (s.tasks || []).length > 0 ? 
                                                <span className="text-[8px] font-black bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase">Terminé</span> :
                                                <span className="text-[8px] font-black bg-white/5 text-muted-foreground px-2 py-1 rounded-full uppercase">En cours</span>
                                            }
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={handleCreateInvoice}
                                    disabled={generatingInvoice}
                                    className="flex-1 py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    {generatingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                    Confirmer & Créer
                                </button>
                                <button 
                                    onClick={() => setIsInvoiceModalOpen(false)}
                                    className="px-8 py-5 bg-white/5 text-muted-foreground font-black uppercase tracking-widest rounded-3xl hover:bg-white/10 transition-all"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {isTaskModalOpen && selectedTask && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-4xl p-0 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
                        <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full text-muted-foreground z-10"><X className="w-5 h-5" /></button>
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar border-r border-white/5">
                            <div className="mb-6"><h2 className="text-lg font-black uppercase tracking-tight">{selectedTask.id ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2></div>
                            <div className="space-y-4">
                                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Titre</label><input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold text-white outline-none focus:border-shop/50" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Statut</label><CustomDropdown options={[{ label: 'À faire', value: 'todo' }, { label: 'En cours', value: 'in_progress' }, { label: 'Terminé', value: 'done' }]} value={taskForm.status} onChange={v => setTaskForm({ ...taskForm, status: v })} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Priorité</label><CustomDropdown options={[{ label: 'Basse', value: 'basse' }, { label: 'Normale', value: 'normale' }, { label: 'Haute', value: 'haute' }, { label: 'Urgente', value: 'urgente' }]} value={taskForm.priority} onChange={v => setTaskForm({ ...taskForm, priority: v })} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Assignation</label><CustomDropdown options={[{ label: '— Non assigné —', value: '' }, ...profiles.map(p => ({ label: p.full_name || p.email || 'Sans nom', value: p.id }))]} value={taskForm.assignee_id} onChange={v => setTaskForm({ ...taskForm, assignee_id: v })} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Deadline</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold text-white outline-none focus:border-shop/50" value={taskForm.deadline} onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })} /></div>
                                </div>
                                                                                                <div className="space-y-2">
                                                                                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description</label>
                                                                                                    <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-sm font-bold text-white outline-none focus:border-shop/50 resize-none" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
                                                                                                </div>
                                                                
                                                                                                                                {/* CATEGORIES & TAGS SECTION (DYNAMIC) */}
                                                                                                                                <div className="p-6 bg-white/[0.03] rounded-[32px] border border-white/5 space-y-6">
                                                                                                                                    <div className="grid grid-cols-2 gap-6">
                                                                                                                                        {/* Category Management */}
                                                                                                                                        <div className="space-y-2">
                                                                                                                                            <div className="flex justify-between items-center ml-1 mb-1">
                                                                                                                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Catégorie</label>
                                                                                                                                                <button 
                                                                                                                                                    type="button" 
                                                                                                                                                    onClick={async () => {
                                                                                                                                                        const name = prompt("Nouvelle catégorie ?");
                                                                                                                                                        if (name) {
                                                                                                                                                            await supabase.from('agency_task_categories').insert([{ name, shop_id: activeShop?.id }]);
                                                                                                                                                            fetchAll();
                                                                                                                                                        }
                                                                                                                                                    }}
                                                                                                                                                    className="text-[8px] font-black text-shop hover:underline uppercase"
                                                                                                                                                >
                                                                                                                                                    + Ajouter
                                                                                                                                                </button>
                                                                                                                                            </div>
                                                                                                                                            <div className="relative group">
                                                                                                                                                <CustomDropdown 
                                                                                                                                                    options={taskCategories.map(c => ({ 
                                                                                                                                                        label: c.name, 
                                                                                                                                                        value: c.name, 
                                                                                                                                                        icon: <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} /> 
                                                                                                                                                    }))}
                                                                                                                                                    value={taskForm.category}
                                                                                                                                                    onChange={v => setTaskForm({ ...taskForm, category: v })}
                                                                                                                                                />
                                                                                                                                                {taskForm.category && taskForm.category !== 'Général' && (
                                                                                                                                                    <button 
                                                                                                                                                        type="button"
                                                                                                                                                        onClick={async (e) => {
                                                                                                                                                            e.stopPropagation();
                                                                                                                                                            if (confirm(`Supprimer la catégorie ${taskForm.category} ?`)) {
                                                                                                                                                                await supabase.from('agency_task_categories').delete().eq('name', taskForm.category);
                                                                                                                                                                setTaskForm({ ...taskForm, category: 'Général' });
                                                                                                                                                                fetchAll();
                                                                                                                                                            }
                                                                                                                                                        }}
                                                                                                                                                        className="absolute -right-2 -top-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                                                                                                                                    >
                                                                                                                                                        <X className="w-3 h-3" />
                                                                                                                                                    </button>
                                                                                                                                                )}
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                
                                                                                                                                        {/* Badge Management */}
                                                                                                                                        <div className="space-y-2">
                                                                                                                                            <div className="flex justify-between items-center ml-1 mb-1">
                                                                                                                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nouveau Badge</label>
                                                                                                                                                <button 
                                                                                                                                                    type="button"
                                                                                                                                                    onClick={async () => {
                                                                                                                                                        const name = prompt("Nom du nouveau badge ?");
                                                                                                                                                        if (name) {
                                                                                                                                                            await supabase.from('agency_task_badges').insert([{ name, shop_id: activeShop?.id }]);
                                                                                                                                                            fetchAll();
                                                                                                                                                        }
                                                                                                                                                    }}
                                                                                                                                                    className="text-[8px] font-black text-shop hover:underline uppercase"
                                                                                                                                                >
                                                                                                                                                    + Créer
                                                                                                                                                </button>
                                                                                                                                            </div>
                                                                                                                                            <div className="flex flex-wrap gap-1.5 p-3 bg-white/5 border border-white/10 rounded-2xl max-h-32 overflow-y-auto custom-scrollbar shadow-inner">
                                                                                                                                                {taskBadges.map(badge => {
                                                                                                                                                    const isSelected = taskForm.tags.includes(badge.name);
                                                                                                                                                    return (
                                                                                                                                                        <button
                                                                                                                                                            key={badge.id}
                                                                                                                                                            type="button"
                                                                                                                                                            onClick={() => {
                                                                                                                                                                const newTags = isSelected 
                                                                                                                                                                    ? taskForm.tags.filter(t => t !== badge.name)
                                                                                                                                                                    : [...taskForm.tags, badge.name];
                                                                                                                                                                setTaskForm({ ...taskForm, tags: newTags });
                                                                                                                                                            }}
                                                                                                                                                            onContextMenu={async (e) => {
                                                                                                                                                                e.preventDefault();
                                                                                                                                                                if (confirm(`Supprimer définitivement le badge ${badge.name} ?`)) {
                                                                                                                                                                    await supabase.from('agency_task_badges').delete().eq('id', badge.id);
                                                                                                                                                                    fetchAll();
                                                                                                                                                                }
                                                                                                                                                            }}
                                                                                                                                                            className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                                                                                                                                                isSelected 
                                                                                                                                                                ? 'bg-shop border-shop text-white shadow-lg' 
                                                                                                                                                                : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
                                                                                                                                                            }`}
                                                                                                                                                            title="Clic droit pour supprimer de la liste"
                                                                                                                                                        >
                                                                                                                                                            {badge.name}
                                                                                                                                                        </button>
                                                                                                                                                    );
                                                                                                                                                })}
                                                                                                                                                {taskBadges.length === 0 && <p className="text-[8px] text-muted-foreground italic p-2">Aucun badge configuré</p>}
                                                                                                                                            </div>
                                                                                                                                        </div>
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                                                                                                <button onClick={saveTask} disabled={savingTask} className="w-full py-4 bg-white text-black font-black uppercase rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl">{savingTask ? 'Sauvegarde...' : 'Sauvegarder'}</button>
                                                                
                                                                                                </div>
                        </div>
                        {selectedTask.id && (
                            <div className="w-full md:w-96 bg-black/20 flex flex-col relative h-96 md:h-auto">
                                <div className="p-6 border-b border-white/5 flex-shrink-0"><h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><MessageSquare className="w-4 h-4 text-shop" /> Discussion</h3></div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {loadingComments ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-shop" /></div> : taskComments.map(c => (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-shop/20 text-shop border border-shop/30 flex items-center justify-center text-[10px] font-black uppercase">{c.profiles?.full_name?.charAt(0) || '?'}</div>
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex-1"><p className="text-xs text-muted-foreground">{c.content}</p></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/5 bg-black/40"><div className="relative flex items-center"><input type="text" placeholder="Commentaire..." className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm outline-none focus:border-shop/50" value={newCommentText} onChange={e => setNewCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && postComment()} /><button onClick={postComment} disabled={postingComment} className="absolute right-2 p-1.5 bg-shop text-white rounded-full transition-all">{postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button></div></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Project Edit Modal */}
            {isEditProjectModalOpen && editingProjectForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                    <div className="relative glass-card w-full max-w-2xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsEditProjectModalOpen(false)} className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-white"><X className="w-6 h-6"/></button>
                        <h2 className="text-xl font-black uppercase tracking-tight mb-8">Modifier le Projet</h2>
                        <form onSubmit={handleUpdateProject} className="space-y-5">
                            <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Nom du projet</label><input required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-shop/50" value={editingProjectForm.name} onChange={e => setEditingProjectForm({ ...editingProjectForm, name: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Status</label><CustomDropdown options={[{label:'Planifié', value:'planifie'}, {label:'En cours', value:'en_cours'}, {label:'Terminé', value:'termine'}, {label:'Annulé', value:'annule'}]} value={editingProjectForm.status} onChange={v => setEditingProjectForm({ ...editingProjectForm, status: v })} /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Budget</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-shop/50" value={editingProjectForm.budget} onChange={e => setEditingProjectForm({ ...editingProjectForm, budget: e.target.value })} /></div>
                            </div>
                            <button type="submit" disabled={savingProject} className="w-full py-5 bg-white text-black font-black uppercase tracking-widest rounded-3xl hover:bg-shop hover:text-white transition-all shadow-xl">{savingProject ? 'Chargement...' : 'Enregistrer'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Project Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
                    <div className="relative glass-card w-full max-w-md p-10 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsShareModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-muted-foreground hover:text-white"><X className="w-6 h-6"/></button>
                        
                        <div className="flex items-center space-x-5 mb-10">
                            <div className="w-16 h-16 bg-shop/20 text-shop border border-shop/20 rounded-3xl flex items-center justify-center shadow-2xl">
                                <Globe className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Portail Client</h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">Lien de suivi public</p>
                            </div>
                        </div>

                        <div className="space-y-8 text-center">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-4">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Partagez ce lien secret avec votre client. Il pourra suivre la **Roadmap**, le **Mind Map** et le **Gantt** en direct.
                                </p>
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col gap-3">
                                    <div className="break-all text-[10px] font-mono text-shop/80">
                                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/projects/share/${project?.access_token}`}
                                    </div>
                                    <button onClick={handleRegenerateToken} className="text-[8px] font-black uppercase text-muted-foreground hover:text-red-400 transition-colors flex items-center justify-center gap-1">
                                        <RefreshCcw className="w-2.5 h-2.5" /> Régénérer le code secret
                                    </button>
                                </div>
                                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                    <p className="text-[8px] font-black uppercase text-amber-500 flex items-center justify-center gap-1.5">
                                        <Lock className="w-3 h-3" /> Sécurité Automatique : L'accès sera coupé dès que le projet passera en "Terminé".
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={handleCopyLink}
                                className="w-full py-6 bg-white text-black hover:bg-shop hover:text-white rounded-[28px] text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-3"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Copier le lien secret</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
