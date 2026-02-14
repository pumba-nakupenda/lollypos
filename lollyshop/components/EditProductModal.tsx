'use client'

import React, { useState } from 'react';
import { X, Loader2, Save, Package, Image as ImageIcon } from 'lucide-react';

interface EditProductModalProps {
    product: any;
    onClose: () => void;
    onSave: (updatedProduct: any) => void;
}

export default function EditProductModal({ product, onClose, onSave }: EditProductModalProps) {
    const [formData, setFormData] = useState({ ...product });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                onSave(formData);
                onClose();
            }
        } catch (error) {
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#111114] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[48px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                <header className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-lolly/10 rounded-2xl flex items-center justify-center text-lolly">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black italic uppercase">Édition Produit</h2>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Modifier les détails web</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl transition-all group">
                        <X className="w-6 h-6 text-gray-500 group-hover:text-white" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Nom du Produit</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Prix (CFA)</label>
                                    <input 
                                        type="number" 
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Stock</label>
                                    <input 
                                        type="number" 
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Catégorie</label>
                                <input 
                                    type="text" 
                                    value={formData.category || ''}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white"
                                />
                            </div>
                        </div>

                        {/* Image Preview & Description */}
                        <div className="space-y-6">
                            <div className="aspect-video bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex items-center justify-center group relative">
                                {formData.image ? (
                                    <img src={formData.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-12 h-12 text-white/5" />
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-2">
                                    <label className="text-[9px] font-black uppercase text-gray-500">Description Marketing</label>
                                </div>
                                <textarea 
                                    rows={6}
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:border-lolly outline-none text-white resize-none"
                                    placeholder="Décrivez votre produit..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-end">
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center space-x-3 px-12 py-5 bg-lolly text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-lolly/20 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Enregistrer les modifications</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
