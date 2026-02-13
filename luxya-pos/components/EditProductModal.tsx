'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Package, Tag, Coins, Hash, Image as ImageIcon, Save, Trash2, ChevronDown, Tags, Sparkles, PlusCircle, Calendar, Plus, Upload, PlayCircle, Globe } from 'lucide-react'
import { updateProduct } from '@/app/inventory/actions'
import { useToast } from '@/context/ToastContext'
import { useUser } from '@/context/UserContext'
import Portal from './Portal'
import CustomDropdown from './CustomDropdown'
import ManageCategoriesModal from './ManageCategoriesModal'
import { API_URL } from '@/utils/api'

interface EditProductModalProps {
    product: any
    isOpen: boolean
    onClose: () => void
}

export default function EditProductModal({ product, isOpen, onClose }: EditProductModalProps) {
    const { showToast } = useToast()
    const { profile } = useUser()
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(product.image)
    const [gallery, setGallery] = useState<string[]>(product.images || [])
    const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([])
    
    // Refs for direct DOM access (used for AI generation and cleaning)
    const nameRef = useRef<HTMLInputElement>(null)
    const descRef = useRef<HTMLTextAreaElement>(null)
    
    const [itemType, setItemType] = useState<'product' | 'service'>(product.type || 'product')
    const [showOnPos, setShowOnPos] = useState<boolean>(product.show_on_pos !== false)
    const [showOnWebsite, setShowOnWebsite] = useState<boolean>(product.show_on_website !== false)

    // VARIANTS & BRAND
    const [brand, setBrand] = useState(product.brand || '')
    const [newBrandMode, setNewBrandMode] = useState(false)
    const [customBrand, setCustomBrand] = useState('')
    const [selectedBrand, setSelectedBrand] = useState(product.brand || '')
    const [existingBrands, setExistingBrands] = useState<string[]>([])

    const [variants, setVariants] = useState<any[]>(product.variants || [])
    const [newVariant, setNewVariant] = useState({ color: '', size: '' })

    const addVariant = () => {
        if (!newVariant.color && !newVariant.size) return;
        setVariants([...variants, { ...newVariant, id: Date.now() }])
        setNewVariant({ color: '', size: '' })
    }

    const removeVariant = (id: number) => {
        setVariants(variants.filter(v => v.id !== id))
    }

    const focusSearch = () => {
        const name = nameRef.current?.value;
        if (!name) return showToast("Entrez d'abord un nom de produit", "warning");
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}`, '_blank');
    };
    const [isFeatured, setIsFeatured] = useState<boolean>(product.is_featured === true)

    const [newCategoryMode, setNewCategoryMode] = useState(false)
    const [customCategory, setCustomCategory] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(product.category || 'Général')
    const [existingCategories, setExistingCategories] = useState<string[]>([])
    const [isManageCatsOpen, setIsManageCatsOpen] = useState(false)

    const fetchCategories = () => {
        fetch(`${API_URL}/products`)
            .then(res => res.json())
            .then(data => {
                const cats = new Set(data.map((p: any) => p.category).filter(Boolean))
                setExistingCategories(Array.from(cats) as string[])

                const bnds = new Set(data.map((p: any) => p.brand).filter(Boolean))
                setExistingBrands(Array.from(bnds).sort() as string[])
            })
    }

    useEffect(() => {
        if (isOpen) {
            fetchCategories()
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.set('type', itemType)
        formData.set('show_on_pos', showOnPos.toString())
        formData.set('show_on_website', showOnWebsite.toString())
        formData.set('is_featured', isFeatured.toString())
        
        if (newBrandMode && customBrand) {
            formData.set('brand', customBrand)
        } else {
            formData.set('brand', selectedBrand)
        }

        formData.set('variants', JSON.stringify(variants))
        formData.set('existingGallery', JSON.stringify(gallery))
        
        if (newCategoryMode && customCategory) {
            formData.set('category', customCategory)
        } else {
            formData.set('category', selectedCategory)
        }

        const result = await updateProduct(product.id, formData)
        setLoading(false)
        if (result.success) {
            showToast("Produit mis à jour avec succès !", "success")
            onClose()
        } else {
            showToast(result.error || "Erreur lors de la mise à jour", "error")
        }
    }

    return (
        <Portal>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
                <div className="relative glass-card w-full max-w-2xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 overflow-visible max-h-[90vh] flex flex-col">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-shop" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white">Modifier Produit</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {product.id}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto custom-scrollbar overflow-x-visible pr-2">
                        {/* Type Selection */}
                        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-full mb-2">
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

                        {/* Images Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Main Image */}
                            <div className="flex flex-col items-center justify-center space-y-4 p-6 glass-panel rounded-3xl border-dashed border-white/10">
                                <div className="relative w-32 h-32 rounded-2xl overflow-hidden glass-card flex items-center justify-center group">
                                    {preview && preview.trim() !== "" ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-10 h-10 text-white/10" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Changer</span>
                                        <input type="file" name="image" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                                <input type="hidden" name="ai_image_url" value={preview || ''} />
                                <input type="hidden" name="currentImageUrl" value={product.image || ''} />
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Image Principale</p>
                            </div>

                            {/* Gallery */}
                            <div className="p-6 glass-panel rounded-3xl border border-white/5 space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center">
                                    <Sparkles className="w-3 h-3 mr-1.5 text-blue-400" /> Galerie
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {gallery.filter(url => url && url.trim() !== "").map((url, index) => (
                                        <div key={`ex-${index}`} className="relative aspect-square rounded-lg overflow-hidden group">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setGallery(gallery.filter((_, i) => i !== index))} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Trash2 className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    {newGalleryPreviews.map((url, index) => (
                                        <div key={`nw-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-blue-500/30 group">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setNewGalleryPreviews(newGalleryPreviews.filter((_, i) => i !== index))} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square border border-dashed border-white/20 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                                        <Plus className="w-4 h-4 text-muted-foreground" />
                                        <input 
                                            type="file" name="gallery" multiple accept="image/*" className="hidden" 
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || [])
                                                setNewGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
                                            }} 
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Standard Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom du produit</label>
                                    <button 
                                        type="button" 
                                        onClick={focusSearch}
                                        className="text-[8px] font-black uppercase text-muted-foreground hover:text-white transition-colors flex items-center bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                                    >
                                        <Globe className="w-3 h-3 mr-1.5" /> Chercher une photo (Google)
                                    </button>
                                </div>
                                <input
                                    name="name" ref={nameRef} defaultValue={product.name} required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-shop/50 outline-none transition-all text-white"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">
                                        Marque
                                    </label>
                                    <button type="button" onClick={() => setNewBrandMode(!newBrandMode)} className="text-[8px] font-black uppercase text-shop hover:underline">
                                        {newBrandMode ? 'Choisir existante' : '+ Nouvelle'}
                                    </button>
                                </div>
                                {newBrandMode ? (
                                    <input value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-shop/50 outline-none transition-all text-white" placeholder="Nom de la nouvelle marque..." autoFocus />
                                ) : (
                                    <CustomDropdown 
                                        options={[
                                            { label: 'Aucune marque', value: '', icon: <Tag className="w-3.5 h-3.5" /> },
                                            ...existingBrands.map(b => ({ label: b, value: b, icon: <Tag className="w-3.5 h-3.5" /> }))
                                        ]}
                                        value={selectedBrand} onChange={setSelectedBrand}
                                    />
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 flex items-center">
                                    <PlayCircle className="w-3 h-3 mr-1.5 text-red-400" /> Lien Vidéo (YouTube / MP4)
                                </label>
                                <input
                                    name="video_url" defaultValue={product.video_url}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-shop/50 outline-none transition-all text-white"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Prix de vente (FCFA)</label>
                                <div className="relative">
                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input name="price" type="number" defaultValue={product.price} required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all text-white" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#0055ff] ml-2">Prix Promo (Optionnel)</label>
                                <div className="relative">
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0055ff]" />
                                    <input name="promo_price" type="number" defaultValue={product.promo_price} className="w-full bg-[#0055ff]/5 border border-[#0055ff]/20 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-[#0055ff] outline-none transition-all text-white" />
                                </div>
                            </div>

                            {/* SENSIBLE DATA: COST PRICE ONLY FOR SUPER ADMIN */}
                            {profile?.is_super_admin && (
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Prix de Revient (Confidentiel)</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input name="cost_price" type="number" defaultValue={product.cost_price} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all text-white" />
                                    </div>
                                </div>
                            )}

                            {itemType === 'product' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Stock actuel</label>
                                        <div className="relative">
                                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input name="stock" type="number" defaultValue={product.stock} required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-shop/50 outline-none transition-all text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                            <Calendar className="w-3 h-3 mr-1.5 text-purple-400" /> Péremption
                                        </label>
                                        <input name="expiry_date" type="date" defaultValue={product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : ''} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white" />
                                    </div>
                                </>
                            )}

                            {/* VARIANTS SECTION */}
                            <div className="md:col-span-2 space-y-4 p-6 glass-panel rounded-3xl border border-white/5 bg-white/[0.01]">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-shop flex items-center">
                                    <Sparkles className="w-3 h-3 mr-2" /> Variantes (Tailles & Couleurs)
                                </h4>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <input 
                                        value={newVariant.color} 
                                        onChange={e => setNewVariant({...newVariant, color: e.target.value})}
                                        placeholder="Couleur" 
                                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-shop/50 text-white" 
                                    />
                                    <input 
                                        value={newVariant.size} 
                                        onChange={e => setNewVariant({...newVariant, size: e.target.value})}
                                        placeholder="Taille" 
                                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-shop/50 text-white" 
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

                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                        <Tags className="w-3 h-3 mr-1.5" /> Catégorie
                                    </label>
                                    <button type="button" onClick={() => setNewCategoryMode(!newCategoryMode)} className="text-[8px] font-black uppercase text-shop hover:underline">
                                        {newCategoryMode ? 'Choisir existante' : '+ Nouvelle'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsManageCatsOpen(true)}
                                        className="text-[8px] font-black uppercase text-muted-foreground hover:text-white ml-2 pl-2 border-l border-white/10"
                                    >
                                        Gérer la liste
                                    </button>
                                </div>
                                {newCategoryMode ? (
                                    <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-shop/50 outline-none transition-all text-white" placeholder="Nom de la catégorie..." autoFocus />
                                ) : (
                                    <CustomDropdown 
                                        options={[{ label: 'Général', value: 'Général', icon: <Tags className="w-3.5 h-3.5" /> }, ...existingCategories.filter(cat => cat !== 'Général').map(cat => ({ label: cat, value: cat, icon: <Tags className="w-3.5 h-3.5" /> }))]}
                                        value={selectedCategory} onChange={setSelectedCategory}
                                    />
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2 md:col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center ml-2">
                                        <PlusCircle className="w-3 h-3 mr-1.5" /> Description
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={async () => {
                                            const name = nameRef.current?.value;
                                            if (!name) return showToast("Saisissez un nom d'abord", "warning");
                                            showToast("L'IA rédige...", "info");
                                            const res = await fetch(`${API_URL}/ai/analyze`, {
                                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ question: `Rédige une description de vente courte et élégante pour "${name}" (Catégorie: ${selectedCategory}). Pas d'introduction.` })
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                if (descRef.current) descRef.current.value = data.answer.trim().replace(/^"|"$/g, '');
                                                showToast("Généré !", "success");
                                            }
                                        }}
                                        className="flex items-center space-x-1.5 px-3 py-1 bg-shop/10 text-shop rounded-lg text-[8px] font-black uppercase border border-shop/20 shadow-lg"
                                    >
                                        <Sparkles className="w-3 h-3" /> <span>Générer par IA</span>
                                    </button>
                                </div>
                                <textarea name="description" ref={descRef} defaultValue={product.description} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-sm focus:border-shop/50 outline-none transition-all text-white resize-none" placeholder="Description détaillée..." />
                            </div>
                        </div>

                        {/* Visibility & Featured */}
                        <div className="space-y-4 p-6 glass-panel rounded-3xl border border-white/5 bg-white/[0.01]">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center"><Sparkles className="w-3 h-3 mr-2 text-shop" /> Visibilité & Sélection</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex flex-col space-y-2">
                                    <span className="text-[10px] font-bold text-white">Caisse</span>
                                    <button type="button" onClick={() => setShowOnPos(!showOnPos)} className={`w-12 h-6 rounded-full relative transition-all ${showOnPos ? 'bg-shop' : 'bg-white/10'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showOnPos ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <span className="text-[10px] font-bold text-white">Site Web</span>
                                    <button type="button" onClick={() => setShowOnWebsite(!showOnWebsite)} className={`w-12 h-6 rounded-full relative transition-all ${showOnWebsite ? 'bg-blue-500' : 'bg-white/10'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showOnWebsite ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <span className="text-[10px] font-bold text-shop-secondary">Mise en avant</span>
                                    <button type="button" onClick={() => setIsFeatured(!isFeatured)} className={`w-12 h-6 rounded-full relative transition-all ${isFeatured ? 'bg-shop-secondary' : 'bg-white/10'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFeatured ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={loading} className="w-full py-5 bg-shop text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-shop/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ManageCategoriesModal 
                isOpen={isManageCatsOpen}
                onClose={() => setIsManageCatsOpen(false)}
                categories={existingCategories}
                onRefresh={fetchCategories}
            />
        </Portal>
    )
}