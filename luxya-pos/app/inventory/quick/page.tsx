'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Package, Plus, Minus, Check, ChevronLeft, Loader2, Camera, RefreshCw, X, Upload, PlusCircle, DollarSign, TrendingUp, AlertTriangle, Tags, Edit2, Calendar, Sparkles } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { createClient } from '@/utils/supabase/client';
import { API_URL } from '@/utils/api';
import Link from 'next/link';
import ShopSelector from '@/components/ShopSelector';
import ManageCategoriesModal from '@/components/ManageCategoriesModal';
import ManageBrandsModal from '@/components/ManageBrandsModal';
import ManageColorsModal from '@/components/ManageColorsModal';

const supabase = createClient();

export default function QuickInventoryPage() {
    const { activeShop } = useShop();
    const { profile, loading: profileLoading } = useUser();
    const { showToast } = useToast();
    
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    // Restore missing modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [isColorModalOpen, setIsColorModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // ... (keep useMemos and other states)
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'Général'))
        return Array.from(cats).sort()
    }, [products])

    const brands = useMemo(() => {
        const b = new Set(products.map(p => p.brand).filter(Boolean))
        return Array.from(b).sort() as string[]
    }, [products])

    const colors = useMemo(() => {
        const c = new Set(products.flatMap(p => p.variants?.map((v: any) => v.color)).filter(Boolean))
        return Array.from(c).sort() as string[]
    }, [products])

    const [newProduct, setNewProduct] = useState({ 
        name: '', 
        price: '', 
        cost_price: '',
        stock: '1', 
        category: 'Général', 
        brand: '',
        expiry_date: '',
        image: '' 
    });
    const [variants, setVariants] = useState<any[]>([]);
    
    // NEW: Selection States
    const [newColorMode, setNewColorMode] = useState(false);
    const [newBrandMode, setNewBrandMode] = useState(false);
    const [customBrand, setCustomBrand] = useState('');
    const [newVariant, setNewVariant] = useState({ color: '', size: '' });

    const addVariant = () => {
        if (!newVariant.color && !newVariant.size) return;
        setVariants([...variants, { ...newVariant, id: Date.now() }]);
        setNewVariant({ color: '', size: '' });
        setNewColorMode(false); // Reset to selection after add
    };

    const removeVariant = (id: number) => {
        setVariants(variants.filter(v => v.id !== id));
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeShop) fetchProducts();
    }, [activeShop]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', activeShop?.id)
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) setProducts(data);
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
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    cost_price: newProduct.cost_price ? parseFloat(newProduct.cost_price) : undefined,
                    stock: parseInt(newProduct.stock),
                    category: newProduct.category,
                    brand: newBrandMode ? customBrand : newProduct.brand,
                    expiry_date: newProduct.expiry_date || undefined,
                    image: newProduct.image,
                    variants: variants,
                    shop_id: activeShop?.id,
                    created_by: profile?.id,
                    show_on_pos: true,
                    show_on_website: true
                }])
                .select()
                .single();

            if (error) throw error;

            showToast("Produit ajouté !", "success");
            setIsModalOpen(false);
            setNewProduct({ name: '', price: '', cost_price: '', stock: '1', category: 'Général', brand: '', expiry_date: '', image: '' });
            setVariants([]);
            fetchProducts();
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
            const { error } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', id);
            
            if (error) throw error;
            setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
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
            
            const { error } = await supabase
                .from('products')
                .update({ image: publicUrl })
                .eq('id', id);
            
            if (error) throw error;
            
            setProducts(products.map(p => p.id === id ? { ...p, image: publicUrl } : p));
            showToast("Photo mise à jour", "success");
        } catch (e) { showToast("Erreur", "error"); } finally { setUpdating(null); }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const totalCost = products.reduce((acc, p) => acc + (Number(p.cost_price || 0) * p.stock), 0);
    const marginPercent = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;
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

            {/* Quick Stats - Restricted to Super Admin */}
            {profile?.is_super_admin && (
                <div className="p-4 grid grid-cols-2 gap-3 pb-2">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-blue-400 mb-1">Investissement</p>
                        <p className="text-sm font-black text-white">{totalCost.toLocaleString()} CFA</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 relative overflow-hidden">
                        <div className="absolute top-2 right-3 px-1.5 py-0.5 bg-green-500 text-white text-[6px] font-black rounded-full">
                            +{marginPercent.toFixed(0)}%
                        </div>
                        <p className="text-[8px] font-black uppercase text-shop-secondary mb-1">Valeur Vente</p>
                        <p className="text-sm font-black text-white">{totalValue.toLocaleString()} CFA</p>
                    </div>
                </div>
            )}

            <div className="px-4 pb-2 grid grid-cols-1">
                <div className={`px-4 py-2 rounded-2xl border ${outOfStock > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'}`}>
                    <p className="text-[8px] font-black uppercase text-muted-foreground flex justify-between items-center">
                        <span>Alertes Stock</span>
                        <span className={outOfStock > 0 ? 'text-red-400' : 'text-green-400'}>{outOfStock} Ruptures</span>
                    </p>
                </div>
            </div>

            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="Rechercher..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
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

            {/* MODAL / BOTTOM SHEET */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center backdrop-blur-xl bg-black/40">
                    <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
                    
                    <div className="relative bg-[#0a0a0c] w-full max-h-[92vh] flex flex-col rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 shrink-0" />
                        
                        <div className="flex items-center justify-between px-8 mb-4 shrink-0">
                            <h2 className="text-xl font-black uppercase flex items-center italic">Ajout <span className="text-shop ml-2">Express.</span></h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5"/></button>
                        </div>

                        <form onSubmit={handleCreateQuickProduct} className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 custom-scrollbar">
                            
                            {/* BLOCK 1: IMAGE */}
                            <div onClick={() => fileInputRef.current?.click()} className="relative h-44 bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden active:scale-98 transition-all shrink-0">
                                {newProduct.image ? (
                                    <img src={newProduct.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2"/>
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prendre une photo</p>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                            </div>

                            {/* BLOCK 2: BASIC INFO */}
                            <div className="space-y-4">
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Nom du produit</p>
                                    <input required placeholder="Ex: T-shirt Silk Premium" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-bold outline-none focus:border-shop/50 text-white" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                                </div>

                                <div className="space-y-1.5 px-1">
                                    <div className="flex justify-between items-center ml-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Marque</p>
                                        <div className="flex items-center space-x-2">
                                            <button type="button" onClick={() => setNewBrandMode(!newBrandMode)} className="text-[9px] font-black uppercase text-shop">
                                                {newBrandMode ? 'Choisir' : '+ Nouvelle'}
                                            </button>
                                            <button type="button" onClick={() => setIsBrandModalOpen(true)} className="text-[9px] font-black uppercase text-muted-foreground flex items-center border-l border-white/10 pl-2 ml-2"><Edit2 className="w-3 h-3 mr-1"/> Gérer</button>
                                        </div>
                                    </div>
                                    {newBrandMode ? (
                                        <input placeholder="Nom de la marque..." className="w-full bg-white/5 border border-shop/30 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white animate-in slide-in-from-top-1" value={customBrand} onChange={e => setCustomBrand(e.target.value)} autoFocus />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-x-auto no-scrollbar">
                                            {brands.length > 0 ? brands.map(b => (
                                                <button 
                                                    key={b} 
                                                    type="button" 
                                                    onClick={() => setNewProduct({...newProduct, brand: b})}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${newProduct.brand === b ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-muted-foreground border border-white/10'}`}
                                                >
                                                    {b}
                                                </button>
                                            )) : <p className="text-[8px] text-muted-foreground italic px-2">Aucune marque</p>}
                                        </div>
                                    )}
                                </div>

                                {/* BLOCK 2.5: VARIANTS (MOVED UP FOR VISIBILITY) */}
                                <div className="space-y-4 p-6 bg-white/[0.03] rounded-[32px] border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase text-shop tracking-widest flex items-center"><Sparkles className="w-3 h-3 mr-2"/> Tailles & Couleurs</p>
                                        <div className="flex items-center space-x-2">
                                            <button type="button" onClick={() => setIsColorModalOpen(true)} className="text-[9px] font-black uppercase text-purple-400 flex items-center bg-purple-500/10 px-2 py-1 rounded-lg">Gérer</button>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{variants.length} ajoutées</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {/* Color Selection vs Manual Mode */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground">Couleur</p>
                                                <button type="button" onClick={() => setNewColorMode(!newColorMode)} className="text-[8px] font-black uppercase text-shop">
                                                    {newColorMode ? 'Choisir' : '+ Nouvelle'}
                                                </button>
                                            </div>
                                            
                                            {newColorMode ? (
                                                <input 
                                                    placeholder="Nom de la couleur..." 
                                                    className="w-full bg-white/10 border border-shop/30 rounded-xl py-3 px-3 text-xs outline-none text-white animate-in slide-in-from-top-1" 
                                                    value={newVariant.color} 
                                                    onChange={e => setNewVariant({...newVariant, color: e.target.value})} 
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-y-auto no-scrollbar">
                                                    {colors.length > 0 ? colors.map(c => (
                                                        <button 
                                                            key={c} 
                                                            type="button" 
                                                            onClick={() => setNewVariant({...newVariant, color: c})}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center space-x-2 ${newVariant.color === c ? 'bg-white text-black' : 'bg-white/5 text-muted-foreground border border-white/10'}`}
                                                        >
                                                            <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: c.toLowerCase() }} />
                                                            <span>{c}</span>
                                                        </button>
                                                    )) : <p className="text-[8px] text-muted-foreground italic px-2">Aucune couleur existante</p>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <input placeholder="Taille (ex: XL, 42...)" className="flex-1 bg-white/10 border border-white/10 rounded-xl py-3 px-3 text-xs outline-none focus:border-shop/50 text-white" value={newVariant.size} onChange={e => setNewVariant({...newVariant, size: e.target.value})} />
                                            <button type="button" onClick={addVariant} className="px-6 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all">Ajouter</button>
                                        </div>
                                    </div>

                                    {variants.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {variants.map(v => (
                                                <div key={v.id} className="flex items-center space-x-2 bg-shop/20 border border-shop/30 px-3 py-1.5 rounded-full animate-in zoom-in-50 duration-200">
                                                    <span className="text-[9px] font-black uppercase text-shop">{v.color} {v.size}</span>
                                                    <button type="button" onClick={() => removeVariant(v.id)} className="text-shop/60 hover:text-shop"><X className="w-3 h-3"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5 px-1">
                                    <div className="flex justify-between items-center ml-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Catégorie</p>
                                        <button type="button" onClick={() => setIsCatModalOpen(true)} className="text-[9px] font-black uppercase text-shop flex items-center"><Edit2 className="w-3 h-3 mr-1"/> Gérer</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 py-1 overflow-x-auto no-scrollbar">
                                        {categories.map(cat => (
                                            <button key={cat} type="button" onClick={() => setNewProduct({...newProduct, category: cat})} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${newProduct.category === cat ? 'bg-shop text-white shadow-lg' : 'bg-white/5 text-muted-foreground border border-white/10'}`}>{cat}</button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input placeholder="Ou tapez une nouvelle..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 3: NUMBERS */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Prix Vente</p>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-shop" />
                                        <input required type="number" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-base font-black outline-none focus:border-shop/50 text-white" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Quantité</p>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input required type="number" placeholder="1" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-base font-black outline-none focus:border-shop/50 text-white" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 4: ADDITIONAL */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Prix d'achat</p>
                                    <input type="number" placeholder="Optionnel" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newProduct.cost_price} onChange={e => setNewProduct({...newProduct, cost_price: e.target.value})} />
                                </div>
                                <div className="space-y-1.5 px-1">
                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Péremption</p>
                                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold outline-none focus:border-shop/50 text-white" value={newProduct.expiry_date} onChange={e => setNewProduct({...newProduct, expiry_date: e.target.value})} />
                                </div>
                            </div>
                        </form>

                        {/* Sticky Action Button */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c] to-transparent">
                            <button 
                                onClick={(e) => { e.preventDefault(); handleCreateQuickProduct(e as any); }}
                                disabled={isCreating || !newProduct.name || !newProduct.price} 
                                className="w-full py-5 bg-shop text-white font-black uppercase rounded-3xl shadow-2xl shadow-shop/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:grayscale"
                            >
                                {isCreating ? <Loader2 className="animate-spin"/> : <><Check className="w-5 h-5 mr-2 stroke-[3px]"/> Valider l'ajout</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ManageCategoriesModal 
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                categories={categories}
                shopId={activeShop?.id}
                onRefresh={fetchProducts}
            />

            <ManageBrandsModal 
                isOpen={isBrandModalOpen}
                onClose={() => setIsBrandModalOpen(false)}
                brands={brands}
                shopId={activeShop?.id}
                onRefresh={fetchProducts}
            />

            <ManageColorsModal 
                isOpen={isColorModalOpen}
                onClose={() => setIsColorModalOpen(false)}
                colors={colors}
                shopId={activeShop?.id}
                onRefresh={fetchProducts}
            />
        </div>
    );
}
