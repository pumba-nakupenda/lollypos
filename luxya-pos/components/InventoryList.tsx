'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Package, Edit2, Search, Filter, Tag, AlertTriangle, CheckCircle2, X, Tags, Trash2, Calendar, ShoppingCart, ExternalLink, Plus, Camera, Loader2, PlusCircle, DollarSign, TrendingUp, Sparkles, FileSpreadsheet, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import CustomDropdown from './CustomDropdown'
import ExpiryBadge from './ExpiryBadge'

// Lazy load heavy modals
const EditProductModal = dynamic(() => import('./EditProductModal'), { ssr: false })
const ExcelImportModal = dynamic(() => import('./ExcelImportModal'), { ssr: false })
const ManageCategoriesModal = dynamic(() => import('./ManageCategoriesModal'), { ssr: false })
const ManageBrandsModal = dynamic(() => import('./ManageBrandsModal'), { ssr: false })
const ImageLightbox = dynamic(() => import('./ImageLightbox'), { ssr: false })

import { SITE_URL, API_URL, authFetch } from '@/utils/api'
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
    const [localProducts, setLocalProducts] = useState<any[]>(products)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCatModalOpen, setIsCatModalOpen] = useState(false)
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isResettingStock, setIsResettingStock] = useState(false)
    const [updatingStockId, setUpdatingStockId] = useState<number | null>(null)

    // Sync local products when props change
    useEffect(() => {
        setLocalProducts(products)
    }, [products])

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
        uploadFile(file);
    };

    const handlePaste = async (e: any) => {
        // If it's a regular paste into an input, don't hijack if it's text
        const target = e.target as HTMLElement;
        const items = e.clipboardData?.items;
        if (!items) return;

        let hasImage = false;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    uploadFile(file);
                    hasImage = true;
                    break;
                }
            }
        }

        // If we processed an image and NOT pasting into a text field, prevent default
        if (hasImage && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }

        // If no image binary, check for image URL in text
        if (!hasImage && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
            const text = e.clipboardData?.getData('text');
            if (text && (text.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || text.startsWith('data:image'))) {
                setNewProduct({ ...newProduct, image: text });
                showToast("Lien image détecté", "success");
                e.preventDefault();
            }
        }
    };

    useEffect(() => {
        const onGlobalPaste = (e: ClipboardEvent) => {
            if (isQuickModalOpen) {
                handlePaste(e);
            }
        };
        window.addEventListener('paste', onGlobalPaste);
        return () => window.removeEventListener('paste', onGlobalPaste);
    }, [isQuickModalOpen]);

    const uploadFile = async (file: File) => {
        try {
            setIsCreating(true);
            const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
            setNewProduct({ ...newProduct, image: publicUrl });
            showToast("Photo chargée", "success");
        } catch (err) {
            console.error('[Upload] Error:', err);
            showToast("Erreur photo", "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateQuick = async (e: React.FormEvent) => {
        e.preventDefault();

        // NEW: Mandatory cost_price validation for Physical Products in Shops 1 & 2
        const shopId = activeShop?.id || 1;
        const isPhysicalShop = shopId === 1 || shopId === 2;
        const costPrice = parseFloat(newProduct.cost_price || '0');

        if (isPhysicalShop && costPrice <= 0) {
            showToast("Le prix de revient est obligatoire pour les produits physiques (Luxya/Homtek).", "error");
            return;
        }

        setIsCreating(true);
        try {
            await authFetch(`${API_URL}/products`, {
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
                    variants: variants,
                    image: newProduct.image || '', // Ensure it's never undefined
                    shop_id: activeShop?.id || 1,
                    created_by: profile?.id,
                    show_on_pos: true,
                    show_on_website: true
                })
            });
            showToast("Produit ajouté !", "success");
            setIsQuickModalOpen(false);
            setNewProduct({ name: '', price: '', cost_price: '', stock: '1', category: 'Général', brand: '', expiry_date: '', image: '' });
            setVariants([]);
            router.refresh();
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
            const currentQ = searchParams.get('q') || '';
            const currentCat = searchParams.get('category') || 'Toutes';
            const currentStatus = searchParams.get('status') || 'all';

            // If the local state exactly matches the URL params, this effect was 
            // triggered by pagination or initial load. Do not reset page=1!
            if (currentQ === searchQuery && currentCat === selectedCategory && currentStatus === stockStatus) {
                return;
            }

            const params = new URLSearchParams(searchParams.toString());

            if (searchQuery) params.set('q', searchQuery);
            else params.delete('q');

            if (selectedCategory !== 'Toutes') params.set('category', selectedCategory);
            else params.delete('category');

            if (stockStatus !== 'all') params.set('status', stockStatus);
            else params.delete('status');

            params.set('page', '1'); // Reset to page 1 only on new filter

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
        return localProducts.filter(p => {
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
    }, [localProducts, searchQuery, selectedCategory, stockStatus])

    const handleUpdateStock = async (e: React.MouseEvent | React.FocusEvent, id: number, newStock: number) => {
        e.stopPropagation()
        if (updatingStockId === id) return

        // UI-First update
        const oldProducts = [...localProducts]
        setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p))
        setUpdatingStockId(id)

        try {
            await authFetch(`${API_URL}/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock: newStock })
            })
            showToast("Stock mis à jour", "success")
        } catch (err) {
            setLocalProducts(oldProducts)
            showToast("Erreur de mise à jour", "error")
        } finally {
            setUpdatingStockId(null)
        }
    }

    const handleUpdateVariantStock = async (e: React.MouseEvent, productId: number, variantId: string, newVariantStock: number) => {
        e.stopPropagation()
        if (updatingStockId === productId) return

        const product = localProducts.find(p => p.id === productId)
        if (!product) return

        // Update variant stock and recalculate total
        const updatedVariants = product.variants.map((v: any) =>
            v.id === variantId ? { ...v, stock: Math.max(0, newVariantStock) } : v
        )
        const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0)

        const oldProducts = [...localProducts]
        setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, variants: updatedVariants, stock: newTotalStock } : p))
        setUpdatingStockId(productId)

        try {
            await authFetch(`${API_URL}/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variants: updatedVariants,
                    stock: newTotalStock
                })
            })
            showToast("Variante mise à jour", "success")
        } catch (err) {
            setLocalProducts(oldProducts)
            showToast("Erreur de mise à jour", "error")
        } finally {
            setUpdatingStockId(null)
        }
    }

    const handleEdit = (product: any) => {
        setSelectedProduct(product)
        setIsModalOpen(true)
    }

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (!confirm("Supprimer définitivement ce produit ?")) return

        // UI-First update
        const oldProducts = [...localProducts]
        setLocalProducts(prev => prev.filter(p => p.id !== id))

        try {
            await authFetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            })
            showToast("Produit supprimé", "success")
        } catch (err) {
            setLocalProducts(oldProducts)
            showToast("Erreur de suppression", "error")
        }
    }

    const handleExport = async () => {
        if (!activeShop) return;

        setIsResettingStock(true); // Re-use this loading state or another one
        try {
            // Fetch ALL products for this shop, not just the current page
            let query = supabase
                .from('products')
                .select('*')
            // If shop is not "Tous les magasins" (ID 0), filter by shop_id
            if (activeShop.id !== 0) {
                query = query.eq('shop_id', activeShop.id);
            }
            query = query.order('name', { ascending: true });

            const { data: allProducts, error } = await query;
            if (error) {
                console.error('[Export] Supabase error:', error);
                throw error;
            }

            if (!allProducts || allProducts.length === 0) {
                showToast("Aucun produit à exporter pour ce magasin", "warning");
                return;
            }

            const exportData = allProducts.map(p => {
                let formattedDate = '';
                if (p.expiry_date) {
                    try {
                        const d = new Date(p.expiry_date);
                        if (!isNaN(d.getTime())) {
                            formattedDate = d.toLocaleDateString();
                        }
                    } catch (e) {
                        console.warn(`[Export] Invalid date for product ${p.name}:`, p.expiry_date);
                    }
                }

                return {
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
                    "Date d'expiration": formattedDate,
                    Description: p.description || '',
                    Image: p.image || '',
                    "En POS": p.show_on_pos !== false ? 'Oui' : 'Non',
                    "Vedette": p.is_featured ? 'Oui' : 'Non',
                    Variantes: Array.isArray(p.variants)
                        ? p.variants.map((v: any) => `${v.color || ''}:${v.size || ''}:${v.stock || 0}:${v.image || ''}:${v.id || ''}`).join(';')
                        : ''
                };
            })

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Inventaire')
            XLSX.writeFile(wb, `Lolly_Export_Inventaire_${new Date().toISOString().split('T')[0]}.xlsx`)
            showToast("Exportation réussie", "success")
        } catch (err: any) {
            console.error('Export failed:', err);
            showToast(`L'exportation a échoué: ${err.message || 'Erreur inconnue'}`, "error");
        } finally {
            setIsResettingStock(false);
        }
    }


    return (
        <div className="space-y-4 sm:space-y-8">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="sm:col-span-2 space-y-2">
                    <div className="flex justify-between items-center px-1 sm:px-2">
                        <div className="flex items-center space-x-2">
                            <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Recherche Globale</p>
                        </div>
                        <button
                            onClick={() => setStockStatus(stockStatus === 'out_of_stock' ? 'all' : 'out_of_stock')}
                            className={`flex items-center px-2 sm:px-3 py-1 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all ${stockStatus === 'out_of_stock'
                                ? 'bg-red-500 text-white shadow-lg'
                                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                }`}
                        >
                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> Ruptures
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-focus-within:text-shop transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-xs sm:text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:contents">
                    <CustomDropdown
                        label="Catégorie"
                        options={categoryOptions}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                    />

                    <CustomDropdown
                        label="État Stock"
                        options={statusOptions}
                        value={stockStatus}
                        onChange={setStockStatus}
                    />
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex gap-2 flex-1">
                        <button
                            onClick={() => setIsQuickModalOpen(true)}
                            className="flex-1 lg:flex-none flex items-center justify-center px-4 sm:px-6 py-3 sm:py-3.5 bg-shop text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-shop/20"
                        >
                            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" /> Ajout Rapide
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex-1 lg:flex-none px-4 py-3 sm:py-3.5 bg-shop/10 text-shop border border-shop/20 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-shop/20 transition-all flex items-center justify-center"
                        >
                            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                            Import
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsBrandModalOpen(true)}
                            className="flex-1 lg:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center whitespace-nowrap"
                        >
                            <TrendingUp className="w-3.5 h-3.5 mr-2 text-shop" />
                            Marques
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex-1 lg:flex-none px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center whitespace-nowrap"
                        >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Export
                        </button>
                    </div>
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
                            className="glass-card group p-3 sm:p-5 rounded-[20px] sm:rounded-[28px] hover:border-shop/30 flex flex-col lg:flex-row lg:items-center justify-between transition-all active:scale-[0.99] cursor-pointer gap-3 sm:gap-6 overflow-hidden"
                        >
                            <div className="flex items-center space-x-3 sm:space-x-8 min-w-0 flex-1">
                                <div
                                    className="h-16 w-16 sm:h-24 sm:w-24 glass-panel rounded-xl sm:rounded-3xl flex items-center justify-center relative overflow-hidden bg-white/5 shrink-0 group/img-preview"
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
                                        {product.variants?.map((v: any, i: number) => {
                                            const vStock = parseInt(v.stock || 0);
                                            return (
                                                <div key={i} className={`flex items-center space-x-2 px-2 py-1 rounded-xl border text-[9px] font-black uppercase transition-all shadow-sm ${vStock <= 0 ? 'bg-black/20 border-white/5 text-white/20 grayscale opacity-40' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-shop/50 hover:bg-shop/5'}`}>
                                                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: v.color?.toLowerCase() || '#888', filter: vStock <= 0 ? 'grayscale(1)' : 'none' }} />
                                                    <span className="max-w-[60px] truncate">{v.color || v.size}</span>

                                                    <div className="flex items-center bg-white/10 rounded-lg overflow-hidden ml-1" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleUpdateVariantStock(e, product.id, v.id, vStock - 1)}
                                                            className="w-5 h-5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                            disabled={updatingStockId === product.id}
                                                        >-</button>
                                                        <span className={`px-1.5 min-w-[20px] text-center ${vStock <= 0 ? 'text-red-400' : 'text-shop'}`}>{vStock}</span>
                                                        <button
                                                            onClick={(e) => handleUpdateVariantStock(e, product.id, v.id, vStock + 1)}
                                                            className="w-5 h-5 flex items-center justify-center hover:bg-green-500/20 hover:text-green-400 transition-colors"
                                                            disabled={updatingStockId === product.id}
                                                        >+</button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="mt-3">
                                        <ExpiryBadge expiryDate={product.expiry_date} className="text-[9px] sm:text-[10px]" showIcon={true} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end lg:space-x-8 xl:space-x-12 border-t lg:border-t-0 border-white/5 pt-3 sm:pt-4 lg:pt-0 shrink-0">
                                <div className="text-left lg:text-right">
                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 opacity-60">Prix Public</p>
                                    {product.promo_price && product.promo_price > 0 && product.promo_price < product.price ? (
                                        <div className="flex flex-col items-start lg:items-end">
                                            <span className="text-[10px] sm:text-xs text-muted-foreground/50 line-through font-black italic">{product.price.toLocaleString()}</span>
                                            <p className="text-lg sm:text-3xl font-black text-[#0055ff] tracking-tighter drop-shadow-sm">{product.promo_price.toLocaleString()} <span className="text-[9px] sm:text-xs uppercase ml-0.5 sm:ml-1">CFA</span></p>
                                        </div>
                                    ) : (
                                        <p className="text-lg sm:text-3xl font-black text-shop tracking-tighter drop-shadow-sm">{product.price.toLocaleString()} <span className="text-[9px] sm:text-xs uppercase ml-0.5 sm:ml-1">CFA</span></p>
                                    )}

                                    {/* Margin Display (Restricted) */}
                                    {product.type !== 'service' && (profile?.is_super_admin || profile?.role === 'inventory') && (
                                        <div className="flex flex-col items-end mt-1">
                                            {(() => {
                                                const sellingPrice = product.promo_price && product.promo_price > 0 ? product.promo_price : product.price

                                                const margin = sellingPrice - (product.cost_price || 0)
                                                const marginPercent = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0

                                                const isGood = marginPercent >= 28

                                                return (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Marge</span>
                                                        <span className={`text-[10px] font-black ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                                                            {margin.toLocaleString()} ({marginPercent.toFixed(0)}%)
                                                        </span>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="text-right lg:min-w-[130px] xl:min-w-[140px] flex flex-col items-end">
                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 opacity-60">Stock</p>

                                    {product.type !== 'service' ? (
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            className={`flex items-center space-x-1 sm:space-x-2 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 group/stock ${(product.variants && product.variants.length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <button
                                                onClick={(e) => handleUpdateStock(e, product.id, Math.max(0, product.stock - 1))}
                                                disabled={updatingStockId === product.id || (product.variants && product.variants.length > 0)}
                                                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 text-xs sm:text-sm"
                                            >
                                                -
                                            </button>

                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={product.stock}
                                                    disabled={(product.variants && product.variants.length > 0)}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0
                                                        setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: val } : p))
                                                    }}
                                                    onBlur={(e) => handleUpdateStock(e, product.id, parseInt(e.target.value) || 0)}
                                                    className={`w-8 sm:w-12 bg-transparent text-center text-xs sm:text-sm font-black outline-none focus:text-shop transition-colors ${product.stock > (product.min_stock || 2) ? 'text-green-400' :
                                                        product.stock > 0 ? 'text-orange-400' : 'text-red-400'
                                                        } ${(product.variants && product.variants.length > 0) ? 'cursor-not-allowed' : ''}`}
                                                />
                                                {updatingStockId === product.id && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                                                        <Loader2 className="w-3 h-3 animate-spin text-shop" />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => handleUpdateStock(e, product.id, product.stock + 1)}
                                                disabled={updatingStockId === product.id || (product.variants && product.variants.length > 0)}
                                                className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all disabled:opacity-50 text-xs sm:text-sm"
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-[8px] sm:text-[11px] font-black uppercase tracking-widest inline-block border bg-blue-500/10 border-blue-500/20 text-blue-400">
                                            Prestation
                                        </div>
                                    )}

                                    {product.type !== 'service' && (
                                        <div className="text-right mt-1 sm:mt-1.5 flex flex-col items-end">
                                            {(() => {
                                                const hasVariants = product.variants && product.variants.length > 0;
                                                const outOfStockVariants = hasVariants ? product.variants.filter((v: any) => parseInt(v.stock || 0) <= 0) : [];
                                                const allOut = hasVariants && outOfStockVariants.length === product.variants.length;
                                                const partiallyOut = hasVariants && outOfStockVariants.length > 0 && outOfStockVariants.length < product.variants.length;

                                                if (allOut || product.stock <= 0) {
                                                    return <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20">Rupture Totale</span>;
                                                }
                                                if (partiallyOut) {
                                                    return <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full border border-orange-400/20">Rupture Partielle ({outOfStockVariants.length})</span>;
                                                }
                                                if (product.stock <= (product.min_stock || 2)) {
                                                    return <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-orange-400">Stock Critique</span>;
                                                }
                                                return <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-green-400 opacity-60">Optimal</span>;
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div className="hidden lg:flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <Link href={`/sales?shopId=${product.shop_id}&q=${encodeURIComponent(product.name)}`} onClick={(e) => e.stopPropagation()} className="p-3.5 glass-panel rounded-2xl hover:bg-shop/20 hover:text-shop transition-all border border-white/5 hover:border-shop/30 shadow-xl" title="Voir en Caisse"><ShoppingCart className="w-5 h-5" /></Link>
                                    {(product.shop_id === 1 || product.shop_id === 2) && (<a href={`${SITE_URL}/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-3.5 glass-panel rounded-2xl hover:bg-blue-500/20 hover:text-blue-400 transition-all border border-white/5 hover:border-blue-500/30 shadow-xl" title="Voir sur le Site"><ExternalLink className="w-5 h-5" /></a>)}
                                    <div className="p-3.5 glass-panel rounded-2xl hover:bg-shop/20 hover:text-shop transition-all border border-white/5 hover:border-shop/30 shadow-xl" onClick={(e) => { e.stopPropagation(); handleEdit(product); }}><Edit2 className="w-5 h-5" /></div>
                                    <div onClick={(e) => handleDelete(e, product.id)} className="p-3.5 glass-panel rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/30 shadow-xl"><Trash2 className="w-5 h-5" /></div>
                                </div>
                            </div>

                            {/* Mobile Action Buttons */}
                            <div className="flex lg:hidden items-center justify-between gap-2 border-t border-white/5 pt-3 mt-1">
                                <div className="flex flex-wrap gap-1.5">
                                    <Link href={`/sales?shopId=${product.shop_id}&q=${encodeURIComponent(product.name)}`} onClick={(e) => e.stopPropagation()} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground active:bg-white/10"><ShoppingCart className="w-3.5 h-3.5" /></Link>
                                    {(product.shop_id === 1 || product.shop_id === 2) && (<a href={`${SITE_URL}/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-muted-foreground active:bg-white/10"><ExternalLink className="w-3.5 h-3.5" /></a>)}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    <div className="p-2.5 bg-shop/10 border border-shop/20 rounded-xl text-shop active:bg-shop/20" onClick={(e) => { e.stopPropagation(); handleEdit(product); }}><Edit2 className="w-3.5 h-3.5" /></div>
                                    <div onClick={(e) => { e.stopPropagation(); handleDelete(e, product.id); }} className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 active:bg-red-500/20"><Trash2 className="w-3.5 h-3.5" /></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {
                selectedProduct && (
                    <EditProductModal
                        key={selectedProduct.id}
                        product={selectedProduct}
                        isOpen={isModalOpen}
                        onClose={() => {
                            setIsModalOpen(false)
                            setSelectedProduct(null)
                        }}
                    />
                )
            }

            {/* Modal de Création Rapide */}
            {
                isQuickModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40">
                        <div className="relative glass-card w-full max-w-md p-8 sm:p-10 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                            <button onClick={() => setIsQuickModalOpen(false)} className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full"><X /></button>
                            <h2 className="text-2xl font-black uppercase mb-8 flex items-center tracking-tighter italic">Ajout <span className="text-shop ml-2">Express.</span></h2>
                            <form onSubmit={handleCreateQuick} className="space-y-6">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    tabIndex={0}
                                    className="h-40 bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden active:bg-white/10 cursor-pointer transition-all hover:border-shop/50 group focus:border-shop outline-none"
                                >
                                    {newProduct.image ? (
                                        <img src={newProduct.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <Camera className="text-muted-foreground mb-2 w-8 h-8 group-hover:text-shop transition-colors" />
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest group-hover:text-shop transition-colors">
                                                Prendre / Charger / Coller
                                            </p>
                                        </>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    <input type="hidden" name="image_url_hidden" value={newProduct.image || ''} />
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
                )
            }

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
                onRefresh={() => router.refresh()}
            />
            <ManageBrandsModal
                isOpen={isBrandModalOpen}
                onClose={() => setIsBrandModalOpen(false)}
                brands={brands}
                shopId={activeShop?.id}
                onRefresh={() => window.location.reload()}
            />
        </div >
    )
}
