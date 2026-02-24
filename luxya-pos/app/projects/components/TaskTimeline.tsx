'use client'

import React, { useMemo } from 'react'
import { Calendar, Clock, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react'

interface Task {
    id: string;
    title: string;
    status: string;
    deadline: string | null;
    priority: string;
    stage_id: string;
}

interface Stage {
    id: string;
    name: string;
    tasks?: Task[];
}

interface TaskTimelineProps {
    stages: Stage[];
    projectStart: string | null;
    projectEnd: string | null;
}

export default function TaskTimeline({ stages, projectStart, projectEnd }: TaskTimelineProps) {
    // 1. Flatten tasks and inject stage info
    const allTasks = useMemo(() => {
        return stages.flatMap(s => (s.tasks || []).map(t => ({ 
            ...t, 
            stageName: s.name,
            // Fallback date if missing to at least show something or handle it
            parsedDate: t.deadline ? new Date(t.deadline) : null
        })))
        .sort((a, b) => {
            if (!a.parsedDate) return 1;
            if (!b.parsedDate) return -1;
            return a.parsedDate.getTime() - b.parsedDate.getTime();
        });
    }, [stages])

    const tasksWithDeadlines = allTasks.filter(t => t.parsedDate);

    if (tasksWithDeadlines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 glass-panel rounded-[40px] border-white/5 bg-white/[0.01] mx-4">
                <div className="w-20 h-20 bg-shop/10 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-shop opacity-50" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter italic text-white">Pas de planning.</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center max-w-xs leading-relaxed">
                    Définissez des <span className="text-shop">dates d'échéance</span> sur vos tâches pour générer automatiquement la ligne du temps.
                </p>
            </div>
        )
    }

    return (
        <div className="mt-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Legend */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                        Planning <span className="text-shop">Gantt.</span>
                        <BarChart3 className="w-5 h-5 text-shop/50" />
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Séquençage chronologique des livrables</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6 bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" /><span className="text-[9px] font-black uppercase text-muted-foreground">Livrées</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-shop shadow-[0_0_8px_rgba(0,85,255,0.4)]" /><span className="text-[9px] font-black uppercase text-muted-foreground">Actives</span></div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" /><span className="text-[9px] font-black uppercase text-muted-foreground">Retard</span></div>
                </div>
            </div>

            {/* Timeline List */}
            <div className="relative px-4 pb-20">
                {/* Vertical Central Line */}
                <div className="absolute left-[140px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/10 via-white/[0.02] to-transparent z-0" />

                <div className="space-y-6 relative z-10">
                    {tasksWithDeadlines.map((task, idx) => {
                        const date = task.parsedDate!;
                        const isOverdue = date < new Date() && task.status !== 'done';
                        const isDone = task.status === 'done';
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                            <div key={task.id} className="flex items-center group transition-all duration-500">
                                {/* Time Marker */}
                                <div className="w-[140px] pr-8 text-right shrink-0">
                                    <p className={`text-xs font-black transition-colors ${isToday ? 'text-shop' : isOverdue ? 'text-red-400' : 'text-white'}`}>
                                        {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                                    </p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                        {date.getFullYear()}
                                    </p>
                                </div>

                                {/* Node Dot */}
                                <div className="relative z-20">
                                    <div className={`w-4 h-4 rounded-full border-4 border-[#121215] shadow-xl transition-all duration-500 group-hover:scale-125
                                        ${isDone ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-shop'}`} 
                                    />
                                    {isToday && <div className="absolute inset-0 bg-shop rounded-full animate-ping opacity-20" />}
                                </div>

                                {/* Task Card */}
                                <div className={`ml-8 flex-1 glass-panel p-5 rounded-[28px] border transition-all duration-500 group-hover:translate-x-2
                                    ${isDone ? 'bg-green-500/[0.02] border-green-500/10 opacity-60' : isOverdue ? 'bg-red-500/[0.03] border-red-500/20' : 'bg-white/[0.02] border-white/5 group-hover:border-white/20'}`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className={`text-sm font-black truncate ${isDone ? 'text-muted-foreground line-through' : 'text-white'}`}>
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] font-black bg-white/5 px-2 py-0.5 rounded-full text-muted-foreground uppercase tracking-widest border border-white/5">
                                                    {task.stageName}
                                                </span>
                                                {isToday && <span className="text-[8px] font-black text-shop uppercase tracking-widest animate-pulse">Aujourd'hui</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 shrink-0">
                                            {isOverdue && (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[7px] font-black text-red-500 uppercase tracking-widest mb-1">Attention</span>
                                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                                </div>
                                            )}
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                                                ${isDone ? 'bg-green-500/10 text-green-500' : isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-shop/10 text-shop'}`}
                                            >
                                                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-Progress Bar */}
                                    {!isDone && (
                                        <div className="mt-4 h-[3px] bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ease-out ${isOverdue ? 'bg-red-500' : 'bg-shop shadow-[0_0_10px_rgba(0,85,255,0.5)]'}`}
                                                style={{ width: isToday ? '100%' : '30%' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
