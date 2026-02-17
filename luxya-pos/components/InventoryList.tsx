'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Package, Edit2, Search, Filter, Tag, AlertTriangle, CheckCircle2, X, Tags, Trash2, Calendar, ShoppingCart, ExternalLink, Plus, Camera, Loader2, PlusCircle, DollarSign, TrendingUp, Sparkles, FileSpreadsheet, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import EditProductModal from './EditProductModal'
import ExcelImportModal from './ExcelImportModal'
import CustomDropdown from './CustomDropdown'
import ExpiryBadge from './ExpiryBadge'
import ManageCategoriesModal from './ManageCategoriesModal'
import ManageBrandsModal from './ManageBrandsModal'
import ImageLightbox from './ImageLightbox'
import { SITE_URL, API_URL } from '@/utils/api'
import { createClient } from '@/utils/supabase/client'
import { useShop } from '@/context/ShopContext'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/context/ToastContext'

interface InventoryListProps {
    products: any[]
    allCategories?: string[]
    allBrands?: string[]
}

export default function InventoryList({ products, allCategories = [], allBrands = [] }: InventoryListProps) {
    const { activeShop } = useShop()
    const { profile } = useUser()
    const { showToast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCatModalOpen, setIsCatModalOpen] = useState(false)
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)

    // Quick Creation State
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        cost_price: '',
        stock: '1',
        category: 'Général',
        brand: '',
        expiry_date: '',
        image: ''
    })

    // NEW: Variants State for Quick Add
    const [variants, setVariants] = useState<any[]>([])
    const [newColorMode, setNewColorMode] = useState(false)
    const [newVariant, setNewVariant] = useState({ color: '', size: '', stock: '' })

    // NEW: Brand Selection State
    const [newBrandMode, setNewBrandMode] = useState(false)
    const [customBrand, setCustomBrand] = useState('')

    // NEW: Image Error Handling
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

    // NEW: Lightbox State
    const [lightbox, setLightbox] = useState<{ isOpen: boolean, src: string }>({ isOpen: false, src: '' })

    const addVariant = () => {
        if (!newVariant.color && !newVariant.size) return
        setVariants([...variants, { ...newVariant, id: Date.now() }])
        setNewVariant({ color: '', size: '', stock: '' })
        setNewColorMode(false)
    }

    const removeVariant = (id: number) => {
        setVariants(variants.filter(v => v.id !== id))
    }

    const fileInputRef = useRef<HTMLInputElement>(null)

    const brands = useMemo(() => {
        return allBrands.length > 0 ? allBrands : (Array.from(new Set(products.map(p => p.brand).filter(Boolean))).sort() as string[])
    }, [allBrands, products])

    const colors = useMemo(() => {
        const c = new Set(products.flatMap(p => p.variants?.map((v: any) => v.color)).filter(Boolean))
        return Array.from(c).sort() as string[]
    }, [products])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsCreating(true);
            const fileName = `${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(`products/${fileName}`, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(`products/${fileName}`);
            setNewProduct({ ...newProduct, image: publicUrl });
            showToast("Photo chargée", "success");
        } catch (err) { showToast("Erreur photo", "error"); } finally { setIsCreating(false); }
    };

    const handleCreateQuick = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    cost_price: newProduct.cost_price ? parseFloat(newProduct.cost_price) : undefined,
                    stock: variants.length > 0
                        ? variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0)
                        : parseInt(newProduct.stock),
                    category: newProduct.category,
                    brand: newBrandMode ? customBrand : newProduct.brand,
                    expiry_date: newProduct.expiry_date || undefined,
                    image: newProduct.image,
                    variants: variants,
                    shop_id: activeShop?.id || 1,
                    created_by: profile?.id,
                    show_on_pos: true,
                    show_on_website: true
                })
            });
            if (res.ok) {
                showToast("Produit ajouté !", "success");
                setIsQuickModalOpen(false);
                setNewProduct({ name: '', price: '', cost_price: '', stock: '1', category: 'Général', brand: '', expiry_date: '', image: '' });
                setVariants([]);
                window.location.reload();
            }
        } catch (err) { showToast("Erreur de création", "error"); } finally { setIsCreating(false); }
    };

    const siteUrl = SITE_URL; // Base URL for lollyshop

    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'Toutes')
    const [stockStatus, setStockStatus] = useState(searchParams.get('status') || 'all')

    // Debounce search and filters URL update
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (searchQuery) params.set('q', searchQuery);
            else params.delete('q');

            if (selectedCategory !== 'Toutes') params.set('category', selectedCategory);
            else params.delete('category');

            if (stockStatus !== 'all') params.set('status', stockStatus);
            else params.delete('status');

            params.set('page', '1'); // Reset to page 1 on new filter

            // Only push if something actually changed to avoid infinite loops
            const newSearch = `?${params.toString()}`;
            const currentSearch = window.location.search;
            if (newSearch !== currentSearch) {
                router.push(`/inventory${newSearch}`);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, stockStatus, router, searchParams]);

    const categories = useMemo(() => {
        if (allCategories.length > 0) return ['Toutes', ...allCategories]
        const cats = new Set(products.map(p => p.category || 'Général'))
        return ['Toutes', ...Array.from(cats)]
    }, [allCategories, products])

    const categoryOptions = categories.map(cat => ({
        label: cat,
        value: cat,
        icon: <Tags className="w-3.5 h-3.5" />
    }))

    const statusOptions = [
        { label: 'Tous les stocks', value: 'all', icon: <Package className="w-3.5 h-3.5" /> },
        { label: 'En stock', value: 'in_stock', icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> },
        { label: 'Stock faible', value: 'low_stock', icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" /> },
        { label: 'Rupture', value: 'out_of_stock', icon: <X className="w-3.5 h-3.5 text-red-400" /> },
        { label: 'Expire bientôt', value: 'expiring', icon: <Calendar className="w-3.5 h-3.5 text-orange-400" /> },
    ]

    const filteredProducts = useMemo(() => {
        // We still filter client-side for immediate response, 
        // but the server will provide the authoritative full list soon after.
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory = selectedCategory === 'Toutes' || p.category === selectedCategory

            let matchesStatus = true
            if (p.type === 'service') {
                matchesStatus = stockStatus === 'all'
            } else {
                const limit = p.min_stock || 2
                if (stockStatus === 'out_of_stock') matchesStatus = p.stock <= 0
                else if (stockStatus === 'low_stock') matchesStatus = p.stock > 0 && p.stock <= limit
                else if (stockStatus === 'in_stock') matchesStatus = p.stock > limit
            }

            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [products, searchQuery, selectedCategory, stockStatus])

    const handleEdit = (product: any) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (!confirm("Supprimer définitivement ce produit ?")) return

        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                window.location.reload()
            }
        } catch (err) {
            console.error("Failed to delete product", err)
        }
    }

    const handleExport = () => {
        if (filteredProducts.length === 0) {
            showToast("Aucun produit à exporter", "warning")
            return
        }

        const exportData = filteredProducts.map(p => ({
            ID: p.id,
            Nom: p.name,
            Marque: p.brand || '',
            Catégorie: p.category || 'Général',
            Type: p.type === 'service' ? 'Service' : 'Produit',
            Prix: p.price,
            "Prix Promo": p.promo_price || '',
            "Prix d'achat": p.cost_price || 0,
            Stock: p.stock,
            "Stock Min": p.min_stock || 2,
            "Date d'expiration": p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '',
            Description: p.description || '',
            Variantes: p.variants?.map((v: any) => `${v.color}:${v.size}:${v.stock || 0}:${v.image || ''}`).join(';') || ''
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Inventaire')
        XLSX.writeFile(wb, `Lolly_Export_Inventaire_${new Date().toISOString().split('T')[0]}.xlsx`)
        showToast("Exportation réussie", "success")
    }

    return (
        <div className="space-y-8">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center px-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Recherche Globale</p>
                        <button
                            onClick={() => setStockStatus(stockStatus === 'out_of_stock' ? 'all' : 'out_of_stock')}
                            className={`flex items-center px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${stockStatus === 'out_of_stock'
                                ? 'bg-red-500 text-white shadow-lg'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                }`}
                        >
                            <X className="w-3 h-3 mr-1" /> Voir Ruptures
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-shop transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher dans tout l'inventaire..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                        />
                    </div>
                </div>

                <CustomDropdown
                    label="Catégorie"
                    options={categoryOptions}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                />

                <CustomDropdown
                    label="État du Stock"
                    options={statusOptions}
                    value={stockStatus}
                    onChange={setStockStatus}
                />

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => setIsQuickModalOpen(true)}
                        className="flex items-center justify-center px-6 py-3.5 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-shop/20"
                    >
                        <PlusCircle className="w-4 h-4 mr-2" /> Ajout Rapide
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setIsBrandModalOpen(true)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
                        >
                            <TrendingUp className="w-3.5 h-3.5 mr-2 text-shop" />
                            Marques
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center"
                        >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Export
                        </button>
                    </div>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2 bg-shop/10 text-shop border border-shop/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-shop/20 transition-all flex items-center justify-center"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />
                        Import Excel
                    </button>
                </div>
            </div>

            {/* Product List */}
            {filteredProducts.length === 0 ? (
                <div className="glass-panel p-12 sm:p-20 rounded-[32px] sm:rounded-[40px] text-center border-dashed border-white/5 bg-white/[0.01]">
                    <Package className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-4 text-muted-foreground opacity-20" />
                    <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-muted-foreground">Aucun produit ne correspond</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:gap-6">
                    {filteredProducts.map((product: any) => (
                        <div
                            key={product.id}
                            onClick={() => handleEdit(product)}
                            className="glass-card group p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] hover:border-shop/30 flex flex-col lg:flex-row lg:items-center justify-between transition-all active:scale-[0.98] cursor-pointer gap-4 sm:gap-6"
                        >
                            <div className="flex items-center space-x-4 sm:space-x-8">
                                <div
                                    className="h-20 w-20 sm:h-24 sm:w-24 glass-panel rounded-2xl sm:rounded-3xl flex items-center justify-center relative overflow-hidden bg-white/5 shrink-0 group/img-preview"
                                    onClick={(e) => {
                                        if (product.image) {
                                            e.stopPropagation();
                                            setLightbox({ isOpen: true, src: product.image });
                                        }
                                    }}
                                >
                                    {product.image && !imageErrors[product.id] ? (
                                        <>
                                            <Image
                                                className="h-full w-full object-cover transition-all duration-500 lg:group-hover:scale-110 lg:group-hover:blur-[2px]"
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                sizes="96px"
                                                onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img-preview:opacity-100 transition-opacity flex items-center justify-center">
                                                <Search className="w-6 h-6 text-white scale-75 group-hover/img-preview:scale-100 transition-transform" />
                                            </div>
                                        </>
                                    ) : (
                                        <Package className="h-8 w-8 sm:h-10 sm:w-10 text-white/10" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base sm:text-xl font-black truncate group-hover:text-shop transition-colors text-white uppercase tracking-tight">
                                        {product.brand && <span className="text-shop/60 text-[10px] sm:text-xs mr-2 px-2 py-0.5 bg-shop/5 rounded-lg border border-shop/10">{product.brand}</span>}
                                        {product.name}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-shop/70">
                                            {product.category || 'Général'}
                                        </span>
                                        {product.type === 'service' && <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/20 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Service</span>}

                                        {/* Variant Image Previews */}
                                        {product.variants && product.variants.length > 0 && (
                                            <div className="flex -space-x-2 ml-2">
                                                {product.variants.filter((v: any) => v.image).slice(0, 5).map((v: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-black/20 ring-1 ring-white/10 hover:z-10 hover:scale-110 transition-transform cursor-zoom-in"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLightbox({ isOpen: true, src: v.image });
                                                        }}
                                                    >
                                                        <img src={v.image} className="w-full h-full object-cover" title={`${v.color || ''} ${v.size || ''}`} />
                                                    </div>
                                                ))}
                                                {product.variants.filter((v: any) => v.image).length > 5 && (
                                                    <div className="w-7 h-7 rounded-full border-2 border-background bg-white/5 text-[8px] font-black flex items-center justify-center text-muted-foreground ring-1 ring-white/10">
                                                        +{product.variants.filter((v: any) => v.image).length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2 sm:ml-4 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${product.show_on_pos !== false ? 'bg-green-400 shadow-green-400/50' : 'bg-red-400 shadow-red-400/50'}`} title="Caisse" />
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${product.show_on_website !== false ? 'bg-blue-400 shadow-blue-400/50' : 'bg-red-400/30'}`} title="Site" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        {product.variants?.map((v: any, i: number) => (
                                            <div key={i} className={`flex items-center space-x-2 px-3 py-1 rounded-xl border text-[9px] font-black uppercase transition-all shadow-sm ${parseInt(v.stock || 0) <= 0 ? 'bg-black/20 border-white/5 text-white/20 grayscale opacity-40' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-shop/50 hover:bg-shop/5'}`}>
                                                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: v.color?.toLowerCase() || '#888', filter: parseInt(v.stock || 0) <= 0 ? 'grayscale(1)' : 'none' }} />
                                                <span>{v.color || v.size}</span>
                                                {v.stock !== undefined && <span className="opacity-60 ml-1 font-bold">[{v.stock}]</span>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3">
                                        <ExpiryBadge expiryDate={product.expiry_date} className="text-[9px] sm:text-[10px]" showIcon={true} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end lg:space-x-16 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                                <div className="text-left lg:text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 opacity-60">Prix Public</p>
                                    {product.promo_price && product.promo_price > 0 && product.promo_price < product.price ? (
                                        <div className="flex flex-col items-start lg:items-end">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground/50 line-through font-black italic">{product.price.toLocaleString()}</span>
                                            <p className="text-xl sm:text-3xl font-black text-[#0055ff] tracking-tighter drop-shadow-sm">{product.promo_price.toLocaleString()} <span className="text-[10px] sm:text-xs uppercase ml-1">CFA</span></p>
                                        </div>
                                    ) : (
                                        <p className="text-xl sm:text-3xl font-black text-shop tracking-tighter drop-shadow-sm">{product.price.toLocaleString()} <span className="text-[10px] sm:text-xs uppercase ml-1">CFA</span></p>
                                    )}
                                </div>

                                <div className="text-right lg:min-w-[140px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 opacity-60">Stock / État</p>
                                    <div className={`px-4 sm:px-5 py-2 rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest inline-block border shadow-sm transition-transform group-hover:scale-105 ${product.type === 'service'
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        : product.stock > (product.min_stock || 2)
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-green-500/5'
                                            : product.stock > 0
                                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-orange-500/5'
                                                : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/5'
                                        }`}>
                                        {product.type === 'service' ? 'Prestation' : product.stock > 0 ? `${product.stock} Unités` : 'Rupture'}
                                    </div>
                                </div>

                                <div className="hidden lg:flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <Link href={`/sales?shopId=${product.shop_id}&q=${encodeURIComponent(product.name)}`} onClick={(e) => e.stopPropagation()} className="p-3.5 glass-panel rounded-2xl hover:bg-shop/20 hover:text-shop transition-all border border-white/5 hover:border-shop/30 shadow-xl" title="Voir en Caisse"><ShoppingCart className="w-5 h-5" /></Link>
                                    {(product.shop_id === 1 || product.shop_id === 2) && (<a href={`${SITE_URL}/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-3.5 glass-panel rounded-2xl hover:bg-blue-500/20 hover:text-blue-400 transition-all border border-white/5 hover:border-blue-500/30 shadow-xl" title="Voir sur le Site"><ExternalLink className="w-5 h-5" /></a>)}
                                    <div className="p-3.5 glass-panel rounded-2xl hover:bg-shop/20 hover:text-shop transition-all border border-white/5 hover:border-shop/30 shadow-xl"><Edit2 className="w-5 h-5" /></div>
                                    <div onClick={(e) => handleDelete(e, product.id)} className="p-3.5 glass-panel rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30 shadow-xl"><Trash2 className="w-5 h-5" /></div>
                                </div>
                            </div>

                            {/* Mobile Action Buttons (visible only on small screens) */}
                            <div className="flex lg:hidden items-center justify-between gap-2 border-t border-white/5 pt-4">
                                <div className="flex gap-2">
                                    <Link href={`/sales?shopId=${product.shop_id}&q=${encodeURIComponent(product.name)}`} onClick={(e) => e.stopPropagation()} className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted-foreground"><ShoppingCart className="w-4 h-4" /></Link>
                                    {(product.shop_id === 1 || product.shop_id === 2) && (<a href={`${SITE_URL}/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted-foreground"><ExternalLink className="w-4 h-4" /></a>)}
                                </div>
                                <div className="flex gap-2">
                                    <div className="p-3 bg-shop/10 border border-shop/20 rounded-xl text-shop" onClick={(e) => { e.stopPropagation(); handleEdit(product); }}><Edit2 className="w-4 h-4" /></div>
                                    <div onClick={(e) => { e.stopPropagation(); handleDelete(e, product.id); }} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"><Trash2 className="w-4 h-4" /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedProduct && (
                <EditProductModal
                    key={selectedProduct.id}
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false)
                        setSelectedProduct(null)
                    }}
                />
            )}

            {/* Modal de Création Rapide */}
            {isQuickModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
                    <div className="relative glass-card w-full max-w-md p-8 sm:p-10 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsQuickModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full"><X /></button>
                        <h2 className="text-2xl font-black uppercase mb-8 flex items-center tracking-tighter italic">Ajout <span className="text-shop ml-2">Express.</span></h2>
                        <form onSubmit={handleCreateQuick} className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="h-40 bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden active:bg-white/10 cursor-pointer transition-all"
                            >
                                {newProduct.image ? <img src={newProduct.image} className="w-full h-full object-cover" /> : <><Camera className="text-muted-foreground mb-2 w-8 h-8" /><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prendre / Charger Photo</p></>}
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>

                            <div className="space-y-4">
                                <input required placeholder="Nom du produit" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Marque</p>
                                        <div className="flex items-center space-x-2">
                                            <button type="button" onClick={() => setNewBrandMode(!newBrandMode)} className="text-[10px] font-black uppercase text-shop hover:underline">
                                                {newBrandMode ? 'Choisir' : '+ Nouvelle'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsBrandModalOpen(true)}
                                                className="text-[10px] font-black uppercase text-muted-foreground hover:text-white flex items-center border-l border-white/10 pl-2 ml-2"
                                            >
                                                <Edit2 className="w-3 h-3 mr-1" /> Gérer
                                            </button>
                                        </div>
                                    </div>
                                    {newBrandMode ? (
                                        <input placeholder="Nom de la marque..." className="w-full bg-white/5 border border-shop/30 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 text-white animate-in slide-in-from-top-1" value={customBrand} onChange={e => setCustomBrand(e.target.value)} autoFocus />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-y-auto no-scrollbar">
                                            {brands.length > 0 ? brands.map(b => (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => setNewProduct({ ...newProduct, brand: b })}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${newProduct.brand === b ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-muted-foreground border border-white/10'}`}
                                                >
                                                    {b}
                                                </button>
                                            )) : <p className="text-[8px] text-muted-foreground italic px-2">Aucune marque enregistrée</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Catégorie</p>
                                        <button
                                            type="button"
                                            onClick={() => setIsCatModalOpen(true)}
                                            className="text-[10px] font-black uppercase text-shop hover:underline flex items-center"
                                        >
                                            <Edit2 className="w-3 h-3 mr-1" /> Gérer
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto p-1 bg-white/[0.02] rounded-xl border border-white/5">
                                        {categories.filter(c => c !== 'Toutes').map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${newProduct.category === cat
                                                    ? 'bg-shop text-white shadow-lg shadow-shop/20'
                                                    : 'bg-white/5 text-muted-foreground border border-white/10 hover:border-shop/30'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input placeholder="Nouvelle ou existante..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input required type="number" placeholder="Stock" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input required type="number" placeholder="Prix Vente" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input type="number" placeholder="Prix Revient" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.cost_price} onChange={e => setNewProduct({ ...newProduct, cost_price: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-shop/50" value={newProduct.expiry_date} onChange={e => setNewProduct({ ...newProduct, expiry_date: e.target.value })} />
                                    </div>
                                </div>

                                {/* VARIANTS SECTION (Quick Add) */}
                                <div className="space-y-4 p-6 bg-white/[0.03] rounded-[32px] border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase text-shop tracking-widest flex items-center"><Sparkles className="w-3 h-3 mr-2" /> Tailles & Couleurs</p>
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase">{variants.length} ajoutées</span>
                                    </div>

                                    <div className="space-y-3">
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
                                                    onChange={e => setNewVariant({ ...newVariant, color: e.target.value })}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2 py-1 max-h-24 overflow-y-auto no-scrollbar">
                                                    {colors.length > 0 ? colors.map(c => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => setNewVariant({ ...newVariant, color: c })}
                                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center space-x-2 ${newVariant.color === c ? 'bg-white text-black' : 'bg-white/5 text-muted-foreground border border-white/10'}`}
                                                        >
                                                            <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: c.toLowerCase() }} />
                                                            <span>{c}</span>
                                                        </button>
                                                    )) : <p className="text-[8px] text-muted-foreground italic px-2">Aucune couleur</p>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <input placeholder="Taille" className="bg-white/10 border border-white/10 rounded-xl py-3 px-3 text-xs outline-none focus:border-shop/50 text-white" value={newVariant.size} onChange={e => setNewVariant({ ...newVariant, size: e.target.value })} />
                                            <input type="number" placeholder="Stock" className="bg-white/10 border border-white/10 rounded-xl py-3 px-3 text-xs outline-none focus:border-shop/50 text-white" value={newVariant.stock} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} />
                                            <button type="button" onClick={addVariant} className="bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all">OK</button>
                                        </div>
                                    </div>

                                    {variants.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {variants.map(v => (
                                                <div key={v.id} className="flex items-center space-x-2 bg-shop/20 border border-shop/30 px-3 py-1.5 rounded-full animate-in zoom-in-50 duration-200">
                                                    <span className="text-[9px] font-black uppercase text-shop">{v.color} {v.size} {v.stock && `(${v.stock})`}</span>
                                                    <button type="button" onClick={() => removeVariant(v.id)} className="text-shop/60 hover:text-shop"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isCreating} className="w-full py-5 bg-white text-black hover:bg-shop hover:text-white font-black uppercase rounded-[24px] shadow-xl transition-all active:scale-95">
                                {isCreating ? <Loader2 className="animate-spin mx-auto" /> : "Valider l'ajout"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ExcelImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    router.refresh()
                }}
            />

            <ManageCategoriesModal
                isOpen={isCatModalOpen}
                onClose={() => setIsCatModalOpen(false)}
                categories={categories}
                shopId={activeShop?.id}
                onRefresh={() => window.location.reload()}
            />
            <ManageBrandsModal
                isOpen={isBrandModalOpen}
                onClose={() => setIsBrandModalOpen(false)}
                brands={brands}
                shopId={activeShop?.id}
                onRefresh={() => window.location.reload()}
            />
        </div>
    )
}
