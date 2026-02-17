'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Package, Ruler, Hash, Image as ImageIcon, Tags, FileText, Upload, Trash2, ChevronDown, AlertTriangle, Store, PlusCircle, Sparkles, Calendar, PlayCircle, Globe, Tag } from 'lucide-react'
import { createProduct } from '@/app/inventory/actions'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import CustomDropdown from './CustomDropdown'
import Portal from './Portal'
import { API_URL } from '@/utils/api'

export default function CreateProductButton() {
    const { activeShop, shops } = useShop()
    const { showToast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    // Refs for AI generation
    const nameRef = useRef<HTMLInputElement>(null)
    const descRef = useRef<HTMLTextAreaElement>(null)

    const [newCategoryMode, setNewCategoryMode] = useState(false)
    const [customCategory, setCustomCategory] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('Général')

    const [newBrandMode, setNewBrandMode] = useState(false)
    const [customBrand, setCustomBrand] = useState('')
    const [selectedBrand, setSelectedBrand] = useState('')

    const [existingCategories, setExistingCategories] = useState<string[]>([])
    const [existingBrands, setExistingBrands] = useState<string[]>([])

    // NEW: Type selection
    const [itemType, setItemType] = useState<'product' | 'service'>('product')

    // NEW: Variants management
    const [variants, setVariants] = useState<any[]>([])
    const [newVariant, setNewVariant] = useState({ color: '', size: '', stock: '' })

    const addVariant = () => {
        if (!newVariant.color && !newVariant.size) {
            return showToast("Entrez au moins une couleur ou une taille", "warning")
        }
        setVariants([...variants, { ...newVariant, id: Date.now() }])
        setNewVariant({ color: '', size: '', stock: '' })
    }

    const removeVariant = (id: number) => {
        setVariants(variants.filter(v => v.id !== id))
    }

    const focusSearch = () => {
        const name = nameRef.current?.value;
        if (!name) return showToast("Entrez d'abord un nom de produit", "warning");
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}`, '_blank');
    };

    // NEW: Visibility states
    const [showOnPos, setShowOnPos] = useState<boolean>(true)
    const [showOnWebsite, setShowOnWebsite] = useState<boolean>(true)

    const [selectedShopId, setSelectedShopId] = useState<number>(1)
    const isGlobalView = !activeShop || activeShop.id === 0

    useEffect(() => {
        if (isOpen) {
            // Pre-select current shop if not in global view
            if (activeShop && activeShop.id !== 0) {
                setSelectedShopId(activeShop.id)
            }

            fetch(`${API_URL}/products`)
                .then(res => res.json())
                .then(data => {
                    const cats = new Set(data.map((p: any) => p.category).filter(Boolean))
                    setExistingCategories(Array.from(cats) as string[])

                    const bnds = new Set(data.map((p: any) => p.brand).filter(Boolean))
                    setExistingBrands(Array.from(bnds).sort() as string[])
                })
        }
    }, [isOpen])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        const urls = files.map(file => URL.createObjectURL(file))
        setGalleryPreviews(prev => [...prev, ...urls])
    }

    const clearImage = () => {
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const clearGalleryItem = (index: number) => {
        setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
        // Note: Real file input management for multiple files is tricky without a custom state for files
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set('shopId', selectedShopId.toString())
        formData.set('type', itemType)
        formData.set('show_on_pos', showOnPos.toString())
        formData.set('show_on_website', showOnWebsite.toString())
        formData.set('variants', JSON.stringify(variants))

        if (newCategoryMode && customCategory) {
            formData.set('category', customCategory)
        } else {
            formData.set('category', selectedCategory)
        }

        if (newBrandMode && customBrand) {
            formData.set('brand', customBrand)
        } else {
            formData.set('brand', selectedBrand)
        }

        const result = await createProduct(formData)

        if (result?.error) {
            setError(result.error)
        } else {
            setIsOpen(false)
            setPreviewUrl(null)
            setNewCategoryMode(false)
            setCustomCategory('')
            setSelectedCategory('Général')
        }
        setLoading(false)
    }

    const categoryOptions = [
        { label: 'Général', value: 'Général', icon: <Tags className="w-3.5 h-3.5" /> },
        ...existingCategories
            .filter(cat => cat !== 'Général')
            .map(cat => ({
                label: cat,
                value: cat,
                icon: <Tags className="w-3.5 h-3.5" />
            }))
    ]

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="group relative px-6 py-3 bg-shop text-white rounded-2xl font-black text-xs uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.05] active:scale-95 shadow-[0_10px_20px_-10px_rgba(var(--shop-primary),0.5)] flex items-center"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un Produit
            </button>

            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 backdrop-blur-md bg-background/40 animate-in fade-in duration-300">
                        <div className="glass-panel w-full max-w-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-300 max-h-[96vh] sm:max-h-[90vh] flex flex-col overflow-visible">
                            {/* Modal Header */}
                            <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] flex-shrink-0 rounded-t-[32px] sm:rounded-t-[40px]">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Nouveau Produit</h3>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5 truncate max-w-[200px] sm:max-w-none">Inventaire {activeShop?.name || 'Luxya'}</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 glass-card rounded-xl text-muted-foreground hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar overflow-x-visible">
                                {error && (
                                    <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs font-bold border border-red-500/20 flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Type Selection */}
                                    <div className="md:col-span-2 flex p-1 bg-white/5 rounded-2xl border border-white/10 w-full">
                                        <button
                                            type="button"
                                            onClick={() => setItemType('product')}
                                            className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${itemType === 'product' ? 'bg-white text-black shadow-xl' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <Package className="w-3.5 h-3.5 mr-2" /> Produit Physique
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setItemType('service')}
                                            className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${itemType === 'service' ? 'bg-shop text-white shadow-xl' : 'text-muted-foreground hover:text-white'}`}
                                        >
                                            <PlusCircle className="w-3.5 h-3.5 mr-2" /> Prestation / Service
                                        </button>
                                    </div>

                                    {/* Shop Selection (Only in Global View) */}
                                    {isGlobalView && (
                                        <div className="space-y-2 md:col-span-2">
                                            <CustomDropdown
                                                label="Boutique de destination"
                                                options={shops.filter(s => s.id !== 0).map(s => ({ label: s.name, value: s.id, icon: <Store className="w-3.5 h-3.5" /> }))}
                                                value={selectedShopId}
                                                onChange={setSelectedShopId}
                                            />
                                        </div>
                                    )}

                                    {/* Image Upload */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <ImageIcon className="w-3 h-3 mr-1.5" /> Image du Produit
                                        </label>

                                        {!previewUrl ? (
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="group/upload border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-shop/50 hover:bg-shop/5 transition-all text-center"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover/upload:scale-110 group-hover/upload:bg-shop/20 transition-all">
                                                    <Upload className="w-6 h-6 text-muted-foreground group-hover/upload:text-shop" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/upload:text-white transition-colors">
                                                    Cliquez pour uploader une image
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="relative group/preview rounded-3xl overflow-hidden aspect-video bg-black/20 border border-white/10">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <button type="button" onClick={clearImage} className="p-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all transform translate-y-2 group-hover/preview:translate-y-0">
                                                        <Trash2 className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <input type="file" name="image" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                        <input type="hidden" name="ai_image_url" value={previewUrl || ''} />
                                    </div>

                                    {/* Gallery Upload */}
                                    <div className="space-y-4 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <Sparkles className="w-3 h-3 mr-1.5 text-blue-400" /> Galerie Photos (Multiples)
                                        </label>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {galleryPreviews.map((url, index) => (
                                                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group">
                                                    <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => clearGalleryItem(index)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                type="button"
                                                onClick={() => galleryInputRef.current?.click()}
                                                className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:border-shop/50 hover:bg-shop/5 transition-all"
                                            >
                                                <Plus className="w-6 h-6 text-muted-foreground mb-1" />
                                                <span className="text-[8px] font-black uppercase text-muted-foreground">Ajouter</span>
                                            </button>
                                        </div>
                                        <input
                                            type="file"
                                            name="gallery"
                                            ref={galleryInputRef}
                                            onChange={handleGalleryChange}
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                        />
                                    </div>

                                    {/* Product Name */}
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex justify-between items-center ml-2">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center">
                                                <Package className="w-3 h-3 mr-1.5" /> Nom du Produit
                                            </label>
                                            <button
                                                type="button"
                                                onClick={focusSearch}
                                                className="text-[8px] font-black uppercase text-muted-foreground hover:text-white transition-colors flex items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                                            >
                                                <Globe className="w-3 h-3 mr-1.5" /> Chercher une photo (Google)
                                            </button>
                                        </div>
                                        <input
                                            name="name"
                                            ref={nameRef}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30 text-white"
                                            placeholder="Ex: Chemise Silk Premium"
                                        />
                                    </div>

                                    {/* Brand Field with Selection */}
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                                <Tag className="w-3 h-3 mr-1.5" /> Marque
                                            </label>
                                            <button type="button" onClick={() => setNewBrandMode(!newBrandMode)} className="text-[8px] font-black uppercase text-shop hover:underline">
                                                {newBrandMode ? 'Choisir existante' : '+ Nouvelle'}
                                            </button>
                                        </div>

                                        {newBrandMode ? (
                                            <input value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-shop/50 outline-none transition-all placeholder:text-muted-foreground/30 text-white animate-in slide-in-from-top-2" placeholder="Nom de la nouvelle marque..." autoFocus />
                                        ) : (
                                            <CustomDropdown
                                                options={[
                                                    { label: 'Aucune marque', value: '', icon: <Tag className="w-3.5 h-3.5" /> },
                                                    ...existingBrands.map(b => ({ label: b, value: b, icon: <Tag className="w-3.5 h-3.5" /> }))
                                                ]}
                                                value={selectedBrand}
                                                onChange={setSelectedBrand}
                                                placeholder="Sélectionner une marque"
                                            />
                                        )}
                                    </div>

                                    {/* Video URL */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <PlayCircle className="w-3 h-3 mr-1.5 text-red-400" /> Lien Vidéo (YouTube / MP4)
                                        </label>
                                        <input
                                            name="video_url"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                                            placeholder="Ex: https://www.youtube.com/watch?v=..."
                                        />
                                    </div>
                                    {/* Prices */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <Ruler className="w-3 h-3 mr-1.5" /> Prix de Vente
                                        </label>
                                        <div className="relative">
                                            <input name="price" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all" placeholder="0" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">FCFA</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <Sparkles className="w-3 h-3 mr-1.5 text-blue-400" /> Prix Promo
                                        </label>
                                        <div className="relative">
                                            <input name="promo_price" type="number" className="w-full bg-[#0055ff]/5 border border-[#0055ff]/20 rounded-2xl py-3.5 px-4 text-sm focus:border-[#0055ff] outline-none transition-all placeholder:text-[#0055ff]/20" placeholder="Optionnel" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#0055ff]">FCFA</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <Hash className="w-3 h-3 mr-1.5" /> Prix de Revient
                                        </label>
                                        <div className="relative">
                                            <input name="cost_price" type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all" placeholder="0" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">FCFA</span>
                                        </div>
                                    </div>

                                    {/* Stock & Min Stock (ONLY IF PRODUCT) */}
                                    {itemType === 'product' && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                                    <Hash className="w-3 h-3 mr-1.5" /> Stock Initial
                                                </label>
                                                <input name="stock" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all" placeholder="0" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                                    <AlertTriangle className="w-3 h-3 mr-1.5 text-orange-400" /> Stock Minimal
                                                </label>
                                                <input name="minStock" type="number" defaultValue={2} required className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all" placeholder="2" />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                                    <Calendar className="w-3 h-3 mr-1.5 text-purple-400" /> Date de Péremption (Optionnel)
                                                </label>
                                                <input name="expiry_date" type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all text-white" />
                                            </div>

                                            {/* VARIATIONS MANAGEMENT */}
                                            <div className="md:col-span-2 space-y-4 p-6 glass-panel rounded-3xl border border-white/5 bg-white/[0.01]">
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-shop flex items-center">
                                                    <Sparkles className="w-3 h-3 mr-2" /> Variantes (Tailles & Couleurs)
                                                </h4>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <input
                                                        value={newVariant.color}
                                                        onChange={e => setNewVariant({ ...newVariant, color: e.target.value })}
                                                        placeholder="Couleur"
                                                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-shop/50"
                                                    />
                                                    <input
                                                        value={newVariant.size}
                                                        onChange={e => setNewVariant({ ...newVariant, size: e.target.value })}
                                                        placeholder="Taille"
                                                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-shop/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addVariant}
                                                        className="bg-shop text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        Ajouter
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {variants.map(v => (
                                                        <div key={v.id} className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full group">
                                                            <span className="text-[9px] font-bold uppercase text-white">
                                                                {v.color} {v.color && v.size ? '/' : ''} {v.size}
                                                            </span>
                                                            <button type="button" onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-500">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Dynamic Category */}
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                                <Tags className="w-3 h-3 mr-1.5" /> Catégorie
                                            </label>
                                            <button type="button" onClick={() => setNewCategoryMode(!newCategoryMode)} className="text-[8px] font-black uppercase text-shop hover:underline">
                                                {newCategoryMode ? 'Choisir existante' : '+ Nouvelle'}
                                            </button>
                                        </div>

                                        {newCategoryMode ? (
                                            <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-shop/50 outline-none transition-all placeholder:text-muted-foreground/30 animate-in slide-in-from-top-2" placeholder="Nom de la nouvelle catégorie..." autoFocus />
                                        ) : (
                                            <CustomDropdown
                                                options={categoryOptions}
                                                value={selectedCategory}
                                                onChange={setSelectedCategory}
                                                placeholder="Choisir une catégorie"
                                            />
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                                <FileText className="w-3 h-3 mr-1.5" /> Description
                                            </label>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const name = nameRef.current?.value;
                                                    const category = selectedCategory;
                                                    if (!name) {
                                                        setError("Veuillez d'abord saisir un nom de produit");
                                                        return;
                                                    }

                                                    try {
                                                        const res = await fetch(`${API_URL}/ai/analyze`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                question: `Rédige une description de vente très courte (2 phrases maximum), élégante et persuasive pour un produit nommé "${name}" dans la catégorie "${category}". Ne réponds QUE par la description, sans introduction ni guillemets.`
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            if (descRef.current) {
                                                                descRef.current.value = data.answer.trim().replace(/^"|"$/g, '');
                                                            }
                                                        }
                                                    } catch (e) { }
                                                }}
                                                className="flex items-center space-x-1.5 px-3 py-1 bg-shop/10 text-shop rounded-lg hover:bg-shop/20 transition-all text-[8px] font-black uppercase border border-shop/20"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                <span>Générer par IA</span>
                                            </button>
                                        </div>
                                        <textarea
                                            name="description"
                                            ref={descRef}
                                            rows={2}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30 resize-none"
                                            placeholder="Description détaillée du produit..."
                                        />
                                    </div>                                    {/* Visibility Settings */}
                                    <div className="md:col-span-2 space-y-4 p-6 glass-panel rounded-3xl border border-white/5 bg-white/[0.01]">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center">
                                            <Sparkles className="w-3 h-3 mr-2 text-shop" /> Paramètres d'affichage
                                        </h4>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold">Afficher sur la Caisse</p>
                                                <p className="text-[8px] text-muted-foreground uppercase">Rendre visible pour la vente</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowOnPos(!showOnPos)}
                                                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${showOnPos ? 'bg-shop shadow-[0_0_15px_rgba(var(--shop-primary),0.3)]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${showOnPos ? 'left-7 shadow-lg' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div>
                                                <p className="text-xs font-bold">Afficher sur le Site Web</p>
                                                <p className="text-[8px] text-muted-foreground uppercase">Disponible pour les clients en ligne</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowOnWebsite(!showOnWebsite)}
                                                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${showOnWebsite ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${showOnWebsite ? 'left-7 shadow-lg' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end space-x-4 flex-shrink-0">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-3 glass-card rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all active:scale-95">
                                        Annuler
                                    </button>
                                    <button type="submit" disabled={loading} className="px-8 py-3 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 shadow-[0_10px_20px_-10px_rgba(var(--shop-primary),0.5)] transition-all disabled:opacity-50 disabled:grayscale">
                                        {loading ? 'Création en cours...' : 'Créer le Produit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}
        </>
    )
}