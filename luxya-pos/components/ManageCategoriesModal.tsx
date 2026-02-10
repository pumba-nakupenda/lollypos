
'use client'

import React, { useState } from 'react'
import { X, Edit2, Trash2, Check, Tags, AlertTriangle } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import Portal from './Portal'
import { API_URL } from '@/utils/api'

interface ManageCategoriesModalProps {
    isOpen: boolean
    onClose: () => void
    categories: string[]
    shopId?: number
    onRefresh: () => void
}

export default function ManageCategoriesModal({ isOpen, onClose, categories, shopId, onRefresh }: ManageCategoriesModalProps) {
    const { showToast } = useToast()
    const [editingCat, setEditingCat] = useState<string | null>(null)
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)

    if (!isOpen) return null

    const handleRename = async (oldName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingCat(null)
            return
        }

        setLoading(true)
        try {
            const shopParam = shopId ? `?shopId=${shopId}` : ''
            const res = await fetch(`${API_URL}/products/categories/rename${shopParam}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, newName: newName.trim() })
            })

            if (res.ok) {
                showToast("Catégorie renommée avec succès", "success")
                setEditingCat(null)
                onRefresh()
            }
        } catch (err) {
            showToast("Erreur lors du renommage", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (name: string) => {
        if (!confirm(`Supprimer la catégorie "${name}" ? Tous les produits associés seront déplacés vers "Général".`)) return

        setLoading(true)
        try {
            const shopParam = shopId ? `?shopId=${shopId}` : ''
            const res = await fetch(`${API_URL}/products/categories/${encodeURIComponent(name)}${shopParam}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                showToast("Catégorie supprimée", "success")
                onRefresh()
            }
        } catch (err) {
            showToast("Erreur lors de la suppression", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Portal>
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
                <div className="relative glass-card w-full max-w-md p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center">
                            <Tags className="w-6 h-6 text-shop" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white">Gérer les Catégories</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Modification globale</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                        {categories.length === 0 ? (
                            <p className="text-center py-10 text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-50">Aucune catégorie personnalisée</p>
                        ) : (
                            categories.filter(c => c !== 'Général').map((cat) => (
                                <div key={cat} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-shop/30 transition-all">
                                    {editingCat === cat ? (
                                        <div className="flex-1 flex items-center space-x-2 mr-2">
                                            <input 
                                                autoFocus
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="flex-1 bg-black/40 border border-shop/50 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                                            />
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleRename(cat)}
                                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-sm font-bold text-white/80 uppercase truncate">{cat}</span>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setEditingCat(cat); setNewName(cat); }}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-shop"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(cat)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-400"
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

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-start space-x-3">
                            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-orange-200/70 font-medium leading-relaxed uppercase">
                                Les modifications effectuées ici s'appliqueront à **tous** les produits portant ce nom de catégorie.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    )
}
