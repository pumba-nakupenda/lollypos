
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Minus, Check, ChevronLeft, Loader2, Camera, RefreshCw, X, Upload, PlusCircle, DollarSign } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/utils/supabase/client';
import { API_URL } from '@/utils/api';
import Link from 'next/link';

export default function QuickInventoryPage() {
    const { activeShop } = useShop();
    const { showToast } = useToast();
    const supabase = createClient();
    
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    // Create Quick Product State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '1', category: 'Général', image: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeShop) fetchProducts();
    }, [activeShop]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/products?shopId=${activeShop?.id}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (e) {
            showToast("Erreur de chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsCreating(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setNewProduct({ ...newProduct, image: publicUrl });
            showToast("Photo prête", "success");
        } catch (error: any) {
            showToast("Erreur photo : " + error.message, "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateQuickProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    stock: parseInt(newProduct.stock),
                    category: newProduct.category,
                    image: newProduct.image,
                    shop_id: activeShop?.id
                })
            });

            if (res.ok) {
                showToast("Produit ajouté !", "success");
                setIsModalOpen(false);
                setNewProduct({ name: '', price: '', stock: '1', category: 'Général', image: '' });
                fetchProducts();
            }
        } catch (e) {
            showToast("Erreur de création", "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateStock = async (id: number, currentStock: number, delta: number) => {
        const newStock = Math.max(0, currentStock + delta);
        setUpdating(id);
        
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
                showToast("Stock mis à jour", "success");
            }
        } catch (e) {
            showToast("Erreur de mise à jour", "error");
        } finally {
            setUpdating(null);
        }
    };

    const handleUpdatePhoto = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUpdating(id);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${id}-${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);

            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: publicUrl })
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, image: publicUrl } : p));
                showToast("Photo mise à jour", "success");
            }
        } catch (error: any) {
            showToast("Erreur photo", "error");
        } finally {
            setUpdating(null);
        }
    };

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col">
            {/* Header Mobile Rapide */}
            <header className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <Link href="/inventory" className="p-2 hover:bg-white/5 rounded-xl">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-sm font-black uppercase tracking-widest">Inventaire Rapide</h1>
                <button onClick={fetchProducts} className="p-2 hover:bg-white/5 rounded-xl">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </header>

            {/* Barre de recherche massive pour le pouce */}
            <div className="p-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Scanner ou chercher un produit..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Liste des produits optimisée mobile */}
            <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Initialisation...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-center py-20 text-muted-foreground text-xs uppercase font-bold">Aucun produit trouvé</p>
                ) : (
                    filtered.map(p => (
                        <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-[24px] p-4 flex items-center justify-between group active:bg-white/[0.05] transition-all">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                {/* Thumbnail with Camera Trigger */}
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0 border border-white/5">
                                    {p.image ? (
                                        <img src={p.image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <Package className="w-6 h-6 m-auto text-white/10" />
                                    )}
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="w-4 h-4 text-white" />
                                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleUpdatePhoto(p.id, e)} />
                                    </label>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[8px] font-black text-shop uppercase tracking-widest mb-0.5">{p.category}</p>
                                    <h3 className="font-bold text-xs truncate uppercase text-white/90">{p.name}</h3>
                                    <p className="text-[10px] font-black text-muted-foreground mt-0.5">Stock : <span className="text-white">{p.stock}</span></p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                                <button 
                                    onClick={() => handleUpdateStock(p.id, p.stock, -1)}
                                    className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-red-500/20 text-red-400 active:scale-90 transition-all"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                
                                <div className="w-14 text-center">
                                    {updating === p.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-shop" />
                                    ) : (
                                        <span className="text-lg font-black">{p.stock}</span>
                                    )}
                                </div>

                                <button 
                                    onClick={() => handleUpdateStock(p.id, p.stock, 1)}
                                    className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-green-500/20 text-green-400 active:scale-90 transition-all"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Aide visuelle en bas */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md flex items-center space-x-3 pointer-events-none">
                <div className="flex-1 bg-shop text-white p-4 rounded-3xl shadow-2xl flex items-center justify-center space-x-3 opacity-90">
                    <Check className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Mode Inventaire Rapide</span>
                </div>
                
                {/* Bouton Création Rapide (Thumb-Friendly) */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="pointer-events-auto w-16 h-16 bg-white text-shop rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
                >
                    <Plus className="w-8 h-8" />
                </button>
            </div>

            {/* Modal Création Rapide */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-xl bg-black/40">
                    <div className="relative bg-[#121214] w-full max-w-lg p-8 rounded-t-[40px] sm:rounded-[40px] shadow-2xl border border-white/5 animate-in slide-in-from-bottom duration-300">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6"/></button>
                        
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center text-shop">
                                <PlusCircle className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Ajout Express</h2>
                        </div>

                        <form onSubmit={handleCreateQuickProduct} className="space-y-6">
                            {/* Photo capture area */}
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative h-40 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden active:bg-white/10 transition-all cursor-pointer"
                            >
                                {newProduct.image ? (
                                    <img src={newProduct.image} className="w-full h-full object-cover" alt="Previsualisation" />
                                ) : (
                                    <>
                                        <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prendre une photo</p>
                                    </>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                            </div>

                            <input required placeholder="Nom du produit" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input required type="number" placeholder="Prix" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                </div>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input required type="number" placeholder="Stock" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                                </div>
                            </div>

                            <button type="submit" disabled={isCreating} className="w-full py-5 bg-shop text-white font-black uppercase rounded-3xl shadow-xl shadow-shop/20 active:scale-95 transition-all">
                                {isCreating ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : "Valider l'ajout"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
