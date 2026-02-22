'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (type !== 'loading') {
            setTimeout(() => hideToast(id), 4000);
        }
    }, [hideToast]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md
                            animate-in slide-in-from-right duration-300
                            ${toast.type === 'success' ? 'bg-white/90 border-green-100 text-green-900' : ''}
                            ${toast.type === 'error' ? 'bg-white/90 border-red-100 text-red-900' : ''}
                            ${toast.type === 'info' ? 'bg-[#0055ff]/90 border-blue-400 text-white' : ''}
                            ${toast.type === 'loading' ? 'bg-black/90 border-white/10 text-white' : ''}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-white" />}
                        {toast.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-white" />}
                        
                        <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
                        
                        <button onClick={() => hideToast(toast.id)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
}
