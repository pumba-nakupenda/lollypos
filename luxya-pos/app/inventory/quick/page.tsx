'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Minus, Check, ChevronLeft, Loader2, Camera, RefreshCw, X, Upload, PlusCircle, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/utils/supabase/client';
import { API_URL } from '@/utils/api';
import Link from 'next/link';
import ShopSelector from '@/components/ShopSelector';

export default function QuickInventoryPage() {
    const { activeShop } = useShop();
    const { profile, loading: profileLoading } = useUser();
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

            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
            setNewProduct({ ...newProduct, image: publicUrl });
            showToast("Photo prête", "success");
        } catch (error: any) {
            showToast("Erreur photo", "error");
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
                    shopId: activeShop?.id // Format backend CamelCase
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
            }
        } catch (e) {
            showToast("Erreur", "error");
        } finally {
            setUpdating(null);
        }
    };

    const handleUpdatePhoto = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUpdating(id);
        try {
            const filePath = `products/${id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: publicUrl })
            });
            if (res.ok) {
                setProducts(products.map(p => p.id === id ? { ...p, image: publicUrl } : p));
                showToast("Photo mise à jour", "success");
            }
        } catch (e) { showToast("Erreur", "error"); } finally { setUpdating(null); }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const outOfStock = products.filter(p => p.stock <= 0).length;

    if (profileLoading) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col pb-32">
            <header className="sticky top-0 z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Link href="/inventory" className="p-2 hover:bg-white/5 rounded-xl"><ChevronLeft /></Link>
                    <ShopSelector />
                </div>
                <button onClick={fetchProducts} className="p-2 hover:bg-white/5 rounded-xl"><RefreshCw className={loading ? 'animate-spin' : ''} /></button>
            </header>

            {/* Quick Stats Aligned with main Inventory */}
            <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Valeur Stock</p>
                    <p className="text-sm font-black text-shop">{totalValue.toLocaleString()} CFA</p>
                </div>
                <div className={`p-4 rounded-3xl border ${outOfStock > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Ruptures</p>
                    <p className={`text-sm font-black ${outOfStock > 0 ? 'text-red-400' : 'text-green-400'}`}>{outOfStock}</p>
                </div>
            </div>

            <div className="p-4">
                <input type="text" placeholder="Rechercher..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            <main className="flex-1 overflow-y-auto px-4 space-y-3">
                {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-shop" /></div> : 
                filtered.map(p => (
                    <div key={p.id} className="bg-white/[0.02] border border-white/5 rounded-[24px] p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0 border border-white/5">
                                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-auto text-white/5" />}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity">
                                    <Camera className="w-4 h-4 text-white" />
                                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={e => handleUpdatePhoto(p.id, e)} />
                                </label>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-xs truncate uppercase">{p.name}</h3>
                                <p className="text-[10px] font-black text-muted-foreground mt-0.5">{Number(p.price).toLocaleString()} CFA</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleUpdateStock(p.id, p.stock, -1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-red-400 active:scale-90"><Minus className="w-4 h-4"/></button>
                            <div className="w-8 text-center font-black">{updating === p.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-shop"/> : p.stock}</div>
                            <button onClick={() => handleUpdateStock(p.id, p.stock, 1)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-green-400 active:scale-90"><Plus className="w-4 h-4"/></button>
                        </div>
                    </div>
                ))}
            </main>

            <button onClick={() => setIsModalOpen(true)} className="fixed bottom-8 right-8 w-16 h-16 bg-shop text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all z-[60]">
                <PlusCircle className="w-8 h-8" />
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-xl bg-black/40">
                    <div className="relative bg-[#121214] w-full max-w-lg p-8 rounded-t-[40px] sm:rounded-[40px] border border-white/5">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full"><X/></button>
                        <h2 className="text-xl font-black uppercase mb-8 flex items-center"><PlusCircle className="mr-2 text-shop"/> Nouveau Produit</h2>
                        <form onSubmit={handleCreateQuickProduct} className="space-y-6">
                            <div onClick={() => fileInputRef.current?.click()} className="h-32 bg-white/5 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden">
                                {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <><Camera className="text-muted-foreground mb-1"/><p className="text-[8px] font-black uppercase text-muted-foreground">Photo</p></>}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                            </div>
                            <input required placeholder="Nom" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="number" placeholder="Prix" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                <input required type="number" placeholder="Stock" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                            </div>
                            <button type="submit" disabled={isCreating} className="w-full py-5 bg-shop text-white font-black uppercase rounded-3xl shadow-xl">{isCreating ? <Loader2 className="animate-spin mx-auto"/> : "Valider"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
