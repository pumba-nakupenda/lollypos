
'use client'

import React, { useState } from 'react'
import { X, Tag, Edit2, Trash2, Check, RefreshCw, Plus, Sparkles } from 'lucide-react'
import { API_URL, authFetch } from '@/utils/api'
import { useToast } from '@/context/ToastContext'
import ConfirmDialog from './ConfirmDialog'

interface ManageBrandsModalProps {
    isOpen: boolean
    onClose: () => void
    brands: string[]
    shopId?: number
    onRefresh: () => void
}

export default function ManageBrandsModal({ isOpen, onClose, brands, shopId, onRefresh }: ManageBrandsModalProps) {
    const { showToast } = useToast()
    const [editingBrand, setEditingBrand] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

    if (!isOpen) return null

    const handleRename = async (oldName: string) => {
        if (!newName || newName === oldName) return setEditingBrand(null)

        setLoading(true)
        try {
            await authFetch(`${API_URL}/products/brands/rename`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName, shopId })
            })

            showToast("Marque renommée avec succès", "success")
            setEditingBrand(null)
            onRefresh()
        } catch (err) {
            showToast("Erreur lors du renommage", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (name: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Supprimer la marque',
            message: `Supprimer la marque "${name}" de tous les produits ?`,
            onConfirm: async () => {
                setConfirmState(prev => ({...prev, isOpen: false}))
                setLoading(true)
                try {
                    await authFetch(`${API_URL}/products/brands/delete`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, shopId })
                    })

                    showToast("Marque supprimée", "success")
                    onRefresh()
                } catch (err) {
                    showToast("Erreur lors de la suppression", "error")
                } finally {
                    setLoading(false)
                }
            }
        })
        return
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
            <div role="dialog" aria-modal="true" className="relative glass-card w-full max-w-md p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full" aria-label="Fermer"><X className="w-5 h-5" /></button>

                <div className="flex items-center space-x-3 mb-8">
                    <div className="w-10 h-10 bg-shop/20 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-shop" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Gérer les Marques</h2>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {brands.length === 0 ? (
                        <p className="text-center py-10 text-muted-foreground font-bold uppercase text-[10px] tracking-widest opacity-60">Aucune marque trouvée</p>
                    ) : (
                        brands.filter(b => b && b !== "").map((brand) => (
                            <div key={brand} className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-shop/30 transition-all">
                                {editingBrand === brand ? (
                                    <div className="flex-1 flex items-center space-x-2">
                                        <input
                                            autoFocus
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="flex-1 bg-white/10 border border-shop/50 rounded-lg px-3 py-1.5 text-sm outline-none text-white"
                                        />
                                        <button onClick={() => handleRename(brand)} className="p-2 bg-green-500 rounded-lg text-white"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => setEditingBrand(null)} className="p-2 bg-white/10 rounded-lg"><X className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-bold uppercase text-white">{brand}</span>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingBrand(brand); setNewName(brand); }}
                                                className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(brand)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg text-muted-foreground hover:text-red-400"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground text-center tracking-widest">Modifier une marque impactera tous ses produits</p>
                </div>
            </div>
            <ConfirmDialog {...confirmState} onCancel={() => setConfirmState(prev => ({...prev, isOpen: false}))} />
        </div>
    )
}
