'use client'
import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', variant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
    if (!isOpen) return null

    const colors = variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-orange-500' : 'bg-shop'

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-xl bg-background/40 animate-in fade-in duration-300">
            <div className="relative glass-card w-full max-w-sm p-8 rounded-[32px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full" aria-label="Fermer">
                    <X className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-14 h-14 ${colors}/20 rounded-2xl flex items-center justify-center border ${colors}/30`}>
                        <AlertTriangle className={`w-7 h-7 ${variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-orange-400' : 'text-shop'}`} />
                    </div>
                    <h3 id="confirm-title" className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
                    <p id="confirm-message" className="text-xs text-muted-foreground leading-relaxed">{message}</p>
                    <div className="flex space-x-3 w-full pt-2">
                        <button onClick={onCancel} className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/10 transition-all">
                            {cancelLabel}
                        </button>
                        <button onClick={onConfirm} className={`flex-1 py-3 px-4 ${colors} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg`}>
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
