
'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, AlertCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts(prev => [...prev, { id, message, type }])

        // Auto-remove after 5 seconds
        setTimeout(() => removeToast(id), 5000)
    }, [removeToast])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col space-y-4 max-w-md w-full pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem 
                        key={toast.id} 
                        toast={toast} 
                        onClose={() => removeToast(toast.id)} 
                    />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: () => void }) {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertCircle className="w-5 h-5 text-orange-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    }

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/20',
        error: 'bg-red-500/10 border-red-500/20',
        warning: 'bg-orange-500/10 border-orange-500/20',
        info: 'bg-blue-500/10 border-blue-500/20'
    }

    return (
        <div className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl glass-panel border shadow-2xl animate-in slide-in-from-right-full duration-300 ${bgColors[toast.type]}`}>
            <div className="flex items-center space-x-3">
                <div className="shrink-0">{icons[toast.type]}</div>
                <p className="text-xs font-black uppercase tracking-widest text-white leading-tight">
                    {toast.message}
                </p>
            </div>
            <button 
                onClick={onClose}
                className="ml-4 p-1 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}
