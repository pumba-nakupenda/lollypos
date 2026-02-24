'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Play, Pause, Square, Clock, X, CheckCircle2 } from 'lucide-react'

interface TimeTrackerContextType {
    activeEntry: any | null;
    startTimer: (taskId: string, taskTitle: string) => Promise<void>;
    stopTimer: () => Promise<void>;
    elapsed: number;
}

const TimeTrackerContext = createContext<TimeTrackerContextType | undefined>(undefined)

export function TimeTrackerProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient()
    const [activeEntry, setActiveEntry] = useState<any | null>(null)
    const [elapsed, setElapsed] = useState(0)

    // 1. Recover active timer on mount
    useEffect(() => {
        const recover = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('agency_task_time_entries')
                .select('*, agency_tasks(title)')
                .eq('user_id', user.id)
                .is('end_time', null)
                .maybeSingle()

            if (data) {
                setActiveEntry(data)
                const start = new Date(data.start_time).getTime()
                setElapsed(Math.floor((Date.now() - start) / 1000))
            }
        }
        recover()
    }, [])

    // 2. Tick
    useEffect(() => {
        let interval: any;
        if (activeEntry) {
            interval = setInterval(() => {
                const start = new Date(activeEntry.start_time).getTime()
                setElapsed(Math.floor((Date.now() - start) / 1000))
            }, 1000)
        } else {
            setElapsed(0)
        }
        return () => clearInterval(interval)
    }, [activeEntry])

    const startTimer = async (taskId: string, taskTitle: string) => {
        if (activeEntry) await stopTimer() // Stop previous if any

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('agency_task_time_entries')
            .insert([{ task_id: taskId, user_id: user.id }])
            .select()
            .single()

        if (data) {
            setActiveEntry({ ...data, agency_tasks: { title: taskTitle } })
        }
    }

    const stopTimer = async () => {
        if (!activeEntry) return

        const end = new Date().toISOString()
        const start = new Date(activeEntry.start_time).getTime()
        const duration = Math.floor((Date.now() - start) / 1000)

        await supabase
            .from('agency_task_time_entries')
            .update({ end_time: end, duration_seconds: duration })
            .eq('id', activeEntry.id)

        setActiveEntry(null)
        setElapsed(0)
    }

    return (
        <TimeTrackerContext.Provider value={{ activeEntry, startTimer, stopTimer, elapsed }}>
            {children}
            {activeEntry && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="glass-panel px-8 py-4 rounded-[32px] border-shop/40 bg-black/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-8 min-w-[400px]">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop animate-pulse shadow-lg border border-shop/20">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-shop tracking-widest leading-none mb-1">Session Active</p>
                                <p className="text-sm font-bold text-white truncate max-w-[200px]">{activeEntry.agency_tasks?.title}</p>
                            </div>
                        </div>

                        <div className="h-10 w-[1px] bg-white/10" />

                        <div className="flex-1 text-center tabular-nums">
                            <p className="text-2xl font-black text-white leading-none">
                                {Math.floor(elapsed / 3600).toString().padStart(2, '0')}:
                                {Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')}:
                                {(elapsed % 60).toString().padStart(2, '0')}
                            </p>
                        </div>

                        <button 
                            onClick={stopTimer}
                            className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                        >
                            <Square className="w-5 h-5 fill-current" />
                        </button>
                    </div>
                </div>
            )}
        </TimeTrackerContext.Provider>
    )
}

export function useTimeTracker() {
    const context = useContext(TimeTrackerContext)
    if (!context) throw new Error('useTimeTracker must be used within TimeTrackerProvider')
    return context
}
