'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { Zap, Link2, Sparkles, X, Plus, Globe, Move, Trash2 } from 'lucide-react'

interface Task {
    id: string;
    stage_id: string;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'basse' | 'normale' | 'haute' | 'urgente';
    assignee_id: string | null;
    deadline: string | null;
    position: number;
    category?: string;
    tags?: string[];
    _blocked?: boolean;
    _assignee?: { id: string; full_name: string | null; email: string | null } | null;
}

interface Stage {
    id: string;
    name: string;
    tasks?: Task[];
}

interface TaskLink {
    from_task_id: string;
    to_task_id: string;
}

interface TaskMindMapProps {
    stages: Stage[];
    taskLinks: TaskLink[];
    onTaskClick: (task: Task) => void;
    onLinkCreate: (fromId: string, toId: string) => void;
    onLinkDelete: (fromId: string, toId: string) => void;
    onTaskMove: (taskId: string, targetStageId: string) => void;
}

export default function TaskMindMap({ stages, taskLinks, onTaskClick, onLinkCreate, onLinkDelete, onTaskMove }: TaskMindMapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const [hoveredTask, setHoveredTask] = useState<string | null>(null)
    const [hoveredLink, setHoveredLink] = useState<string | null>(null)
    
    // Drag-to-Link State
    const [drawingLinkFrom, setDrawingLinkFrom] = useState<string | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Drag-to-Move State
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
    const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

    useEffect(() => {
        const update = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.scrollWidth,
                    height: containerRef.current.scrollHeight
                })
            }
        }
        update()
        setTimeout(update, 800); 
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [stages])

    // Track mouse for drawing lines
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!drawingLinkFrom || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
            x: e.clientX - rect.left + containerRef.current.scrollLeft,
            y: e.clientY - rect.top + containerRef.current.scrollTop
        })
    }

    const nodePositions = useMemo(() => {
        const positions: Record<string, { x: number, y: number }> = {}
        if (!containerRef.current) return positions

        stages.forEach((stage) => {
            const stageTasks = stage.tasks || []
            stageTasks.forEach((task) => {
                const el = document.getElementById(`mindnode-${task.id}`)
                if (el && containerRef.current) {
                    const rect = el.getBoundingClientRect()
                    const containerRect = containerRef.current.getBoundingClientRect()
                    positions[task.id] = {
                        x: (rect.left - containerRect.left) + rect.width / 2 + containerRef.current.scrollLeft,
                        y: (rect.top - containerRect.top) + rect.height / 2 + containerRef.current.scrollTop
                    }
                }
            })
        })
        return positions
    }, [stages, dimensions])

    return (
        <div 
            className="mt-12 mx-4 p-10 glass-panel rounded-[40px] border-white/5 bg-white/[0.01] relative overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDrawingLinkFrom(null)}
        >
            <div className="flex items-center justify-between mb-12 relative z-20">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Canevas <span className="text-shop">Interactif.</span></h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Glissez pour déplacer • Tirez pour lier • Cliquez pour éditer</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-shop shadow-[0_0_10px_rgba(var(--shop-primary),0.5)]" /><span className="text-[9px] font-black uppercase text-muted-foreground">Tâche</span></div>
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /><span className="text-[9px] font-black uppercase text-muted-foreground">Liaison active</span></div>
                </div>
            </div>

            <div ref={containerRef} className="relative min-h-[600px] overflow-x-auto custom-scrollbar pb-10">
                <svg 
                    className="absolute inset-0 z-0" 
                    width={dimensions.width} 
                    height={dimensions.height}
                    style={{ minWidth: '100%', minHeight: '100%' }}
                >
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.15)" />
                        </marker>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>

                    {/* Task Links */}
                    {taskLinks.map((link) => {
                        const start = nodePositions[link.from_task_id]
                        const end = nodePositions[link.to_task_id]
                        if (!start || !end) return null

                        const linkId = `${link.from_task_id}-${link.to_task_id}`;
                        const isHovered = hoveredLink === linkId;

                        // Find source task status for styling
                        let sourceTask: Task | undefined;
                        for (const stage of stages) {
                            sourceTask = stage.tasks?.find(t => t.id === link.from_task_id);
                            if (sourceTask) break;
                        }

                        const isCompleted = sourceTask?.status === 'done';
                        const isActive = sourceTask?.status === 'in_progress';

                        // Styling logic
                        let strokeColor = "rgba(255,255,255,0.05)";
                        let strokeWidth = "1.5";
                        let dashArray = "6,6";
                        let animationDuration = "40s";
                        let filter = "";

                        if (isCompleted) {
                            strokeColor = "rgba(34,197,94,0.3)"; 
                            strokeWidth = "2.5";
                            dashArray = "0"; 
                            animationDuration = "0s";
                        } else if (isActive) {
                            strokeColor = "rgba(0,85,255,0.5)"; 
                            strokeWidth = "3";
                            dashArray = "10,10";
                            animationDuration = "10s";
                            filter = "url(#glow)";
                        }

                        if (isHovered) {
                            strokeColor = "#ef4444";
                            strokeWidth = "4";
                            dashArray = "0";
                            filter = "url(#glow)";
                        }

                        // Cubic Bezier curve path
                        const pathD = `M ${start.x} ${start.y} C ${start.x + 100} ${start.y}, ${end.x - 100} ${end.y}, ${end.x} ${end.y}`;
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;

                        return (
                            <g 
                                key={linkId} 
                                onMouseEnter={() => setHoveredLink(linkId)}
                                onMouseLeave={() => setHoveredLink(null)}
                                className="group/link"
                            >
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="24"
                                    className="cursor-pointer pointer-events-auto"
                                />
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    markerEnd="url(#arrowhead)"
                                    filter={filter}
                                    className="transition-all duration-300"
                                    style={{ 
                                        strokeDasharray: dashArray,
                                        animation: `dash ${animationDuration} linear infinite`
                                    }}
                                />
                                {isHovered && (
                                    <foreignObject x={midX - 12} y={midY - 12} width="24" height="24" className="pointer-events-auto">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onLinkDelete(link.from_task_id, link.to_task_id); }}
                                            className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </foreignObject>
                                )}
                            </g>
                        )
                    })}

                    {/* Temporary Link being drawn */}
                    {drawingLinkFrom && nodePositions[drawingLinkFrom] && (
                        <path
                            d={`M ${nodePositions[drawingLinkFrom].x} ${nodePositions[drawingLinkFrom].y} C ${nodePositions[drawingLinkFrom].x + 100} ${nodePositions[drawingLinkFrom].y}, ${mousePos.x - 100} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                            fill="none"
                            stroke="#0055ff"
                            strokeWidth="3"
                            strokeDasharray="8,8"
                            className="animate-pulse"
                        />
                    )}
                </svg>

                <div className="flex justify-between gap-32 min-w-max px-20 relative z-10">
                    {stages.map((stage) => (
                        <div 
                            key={stage.id} 
                            className={`flex flex-col gap-12 w-72 p-6 rounded-[48px] transition-colors duration-300 ${dragOverStageId === stage.id ? 'bg-shop/5 ring-2 ring-dashed ring-shop/30' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverStageId(stage.id); }}
                            onDragLeave={() => setDragOverStageId(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOverStageId(null);
                                if (draggingTaskId) onTaskMove(draggingTaskId, stage.id);
                                setDraggingTaskId(null);
                            }}
                        >
                            <div className="text-center group/stage relative min-h-[40px] flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 py-3 px-8 bg-white/[0.03] rounded-full border border-white/10 shadow-xl backdrop-blur-md whitespace-nowrap">
                                    {stage.name}
                                </span>
                            </div>

                            <div className="flex flex-col gap-10 items-center">
                                {(stage.tasks || []).map((task) => {
                                    const isDone = task.status === 'done'
                                    const isDoing = task.status === 'in_progress'
                                    const isWaiting = task.status === 'todo' && task._blocked;
                                    const isStandaloneTodo = task.status === 'todo' && !task._blocked;
                                    
                                    return (
                                        <div 
                                            key={task.id} 
                                            id={`mindnode-${task.id}`}
                                            draggable
                                            onDragStart={(e) => {
                                                if (drawingLinkFrom) { e.preventDefault(); return; }
                                                setDraggingTaskId(task.id);
                                            }}
                                            onMouseEnter={() => setHoveredTask(task.id)}
                                            onMouseLeave={() => setHoveredTask(null)}
                                            onMouseUp={(e) => {
                                                if (drawingLinkFrom && drawingLinkFrom !== task.id) {
                                                    e.stopPropagation();
                                                    onLinkCreate(drawingLinkFrom, task.id);
                                                    setDrawingLinkFrom(null);
                                                }
                                            }}
                                            onClick={() => !drawingLinkFrom && onTaskClick(task)}
                                            className={`group relative w-56 p-6 rounded-[32px] border transition-all duration-500 cursor-pointer
                                                ${draggingTaskId === task.id ? 'opacity-20 scale-90' : ''}
                                                ${isDone 
                                                    ? 'bg-green-500/5 border-green-500/20 opacity-40 scale-95 grayscale-[0.5]' 
                                                    : isDoing 
                                                    ? 'bg-shop/10 border-shop/40 shadow-[0_0_50px_rgba(0,85,255,0.25)] scale-105 z-50' 
                                                    : isWaiting 
                                                    ? 'bg-white/[0.01] border-white/5 opacity-20 grayscale scale-95' 
                                                    : 'bg-white/[0.03] border-white/10'}
                                                hover:scale-110 hover:border-white/40 hover:bg-white/[0.07] hover:z-[60] hover:opacity-100 hover:grayscale-0 shadow-2xl active:cursor-grabbing`}
                                        >
                                            {/* Drag Handle for Moving */}
                                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-white transition-all cursor-grab active:cursor-grabbing">
                                                <Move className="w-4 h-4" />
                                            </div>

                                            <p className={`text-[11px] font-black leading-tight uppercase tracking-tight text-center 
                                                ${isDone ? 'text-green-400' : isDoing ? 'text-white' : 'text-white/60'}`}>
                                                {task.title}
                                            </p>

                                            <div className="flex justify-center gap-1.5 mt-2">
                                                {task.category && task.category !== 'Général' && (
                                                    <span className="text-[6px] font-black uppercase text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{task.category}</span>
                                                )}
                                            </div>

                                            {/* Link Circle for Drag-to-Link */}
                                            <div 
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    setDrawingLinkFrom(task.id);
                                                    const rect = containerRef.current!.getBoundingClientRect();
                                                    setMousePos({ 
                                                        x: e.clientX - rect.left + containerRef.current!.scrollLeft, 
                                                        y: e.clientY - rect.top + containerRef.current!.scrollTop 
                                                    });
                                                }}
                                                className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-125 transition-all shadow-xl cursor-crosshair border-4 border-[#0a0a0c]"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </div>

                                            {/* Assignee */}
                                            {task._assignee && (
                                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#121215] border-2 border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <span className="text-[9px] font-black text-shop uppercase">{task._assignee.full_name?.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <style jsx>{`
                @keyframes dash {
                    to { stroke-dashoffset: -1000; }
                }
            `}</style>
        </div>
    )
}
