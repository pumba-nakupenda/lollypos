'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Package, Tag, Coins, Hash, Image as ImageIcon, Save, Trash2, ChevronDown, Tags, Sparkles, PlusCircle, Calendar, Plus, Upload, PlayCircle, Globe, Search, AlertTriangle, FileText, Store } from 'lucide-react'
import { updateProduct } from '@/app/inventory/actions'
import { useToast } from '@/context/ToastContext'
import { useUser } from '@/context/UserContext'
import Portal from './Portal'
import CustomDropdown from './CustomDropdown'
import ManageCategoriesModal from './ManageCategoriesModal'
import ImageLightbox from './ImageLightbox'
import { API_URL, authFetch } from '@/utils/api'
import { compressImage } from '@/utils/image'
import { useRouter } from 'next/navigation'

interface EditProductModalProps {
    product: any
    isOpen: boolean
    onClose: () => void
}

export default function EditProductModal({ product, isOpen, onClose }: EditProductModalProps) {
    const { showToast } = useToast()
    const { profile } = useUser()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(product.image)
    const [isImageDeleted, setIsImageDeleted] = useState(false)
    const [gallery, setGallery] = useState<string[]>(product.images || [])
    const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([])
    const [pastedMainFile, setPastedMainFile] = useState<File | null>(null)

    const nameRef = useRef<HTMLInputElement>(null)
    const descRef = useRef<HTMLTextAreaElement>(null)

    const [itemType, setItemType] = useState<'product' | 'service'>(product.type || 'product')
    const [showOnPos, setShowOnPos] = useState<boolean>(product.show_on_pos !== false)
    const [showOnWebsite, setShowOnWebsite] = useState<boolean>(product.show_on_website !== false)
    const [isFeatured, setIsFeatured] = useState<boolean>(product.is_featured === true)

    const [newBrandMode, setNewBrandMode] = useState(false)
    const [customBrand, setCustomBrand] = useState('')
    const [selectedBrand, setSelectedBrand] = useState(product.brand || '')
    const [existingBrands, setExistingBrands] = useState<string[]>([])

    const [globalStock, setGlobalStock] = useState<string>(product.stock?.toString() || '0')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [variants, setVariants] = useState<any[]>(product.variants || [])
    const [variantFiles, setVariantFiles] = useState<Record<number, File>>({})
    const [newVariant, setNewVariant] = useState({ id: Date.now(), color: '', size: '', stock: '', image: '' })
    const variantFileInputRef = useRef<HTMLInputElement>(null)
    const [activeVariantId, setActiveVariantId] = useState<number | null>(null)
    const [lightbox, setLightbox] = useState<{ isOpen: boolean, src: string }>({ isOpen: false, src: '' })

    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'stock' | 'visibility'>('info')

    const addVariant = () => {
        if (!newVariant.color && !newVariant.size) return;
        setVariants([...variants, { ...newVariant }])
        setNewVariant({ id: Date.now(), color: '', size: '', stock: '', image: '' })
    }

    const removeVariant = (id: number) => {
        setVariants(variants.filter(v => v.id !== id))
        const newFiles = { ...variantFiles }
        delete newFiles[id]
        setVariantFiles(newFiles)
    }

    const updateVariantStock = (id: number, stock: string) => {
        setVariants(variants.map(v => v.id === id ? { ...v, stock } : v))
    }

    const handleVariantPaste = async (e: React.ClipboardEvent, variantId: number) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setVariantFiles({ ...variantFiles, [variantId]: file })
                    const url = URL.createObjectURL(file)
                    if (newVariant && variantId === newVariant.id) setNewVariant({ ...newVariant, image: url })
                    else setVariants(variants.map(v => v.id === variantId ? { ...v, image: url } : v))
                    showToast("Image de variante collée !", "success")
                }
            }
        }
    }

    useEffect(() => {
        if (variants.length > 0) {
            const total = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)
            setGlobalStock(total.toString())
        }
    }, [variants])

    const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && activeVariantId !== null) {
            setVariantFiles({ ...variantFiles, [activeVariantId]: file })
            const url = URL.createObjectURL(file)
            if (activeVariantId === newVariant.id) setNewVariant({ ...newVariant, image: url })
            else setVariants(variants.map(v => v.id === activeVariantId ? { ...v, image: url } : v))
            setActiveVariantId(null)
        }
    }

    const focusSearch = () => {
        const name = nameRef.current?.value;
        if (!name) return showToast("Entrez un nom", "warning");
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}`, '_blank');
    };

    const [newCategoryMode, setNewCategoryMode] = useState(false)
    const [customCategory, setCustomCategory] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(product.category || 'Général')
    const [existingCategories, setExistingCategories] = useState<string[]>([])
    const [isManageCatsOpen, setIsManageCatsOpen] = useState(false)

    const fetchCategories = () => {
        authFetch(`${API_URL}/products`).then(data => {
            const cats = new Set(data.map((p: any) => p.category).filter(Boolean))
            setExistingCategories(Array.from(cats) as string[])
            const bnds = new Set(data.map((p: any) => p.brand).filter(Boolean))
            setExistingBrands(Array.from(bnds).sort() as string[])
        })
    }

    useEffect(() => { if (isOpen) fetchCategories() }, [isOpen])

    if (!isOpen) return null

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) { setIsImageDeleted(false); setPastedMainFile(null); const reader = new FileReader(); reader.onloadend = () => setPreview(reader.result as string); reader.readAsDataURL(file); }
    }

    const removeMainImage = (e: React.MouseEvent) => { e.stopPropagation(); setPreview(null); setIsImageDeleted(true); if (fileInputRef.current) fileInputRef.current.value = '' }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const isPhysicalShop = product.shop_id === 1 || product.shop_id === 2;
        const costPrice = parseFloat(formData.get('cost_price') as string || '0');
        if (itemType === 'product' && isPhysicalShop && costPrice <= 0) return showToast("Prix de revient obligatoire", "error");

        setLoading(true)
        formData.set('type', itemType)
        formData.set('show_on_pos', showOnPos.toString())
        formData.set('show_on_website', showOnWebsite.toString())
        formData.set('is_featured', isFeatured.toString())
        formData.set('isImageDeleted', isImageDeleted.toString())

        const compressionPromises: Promise<void>[] = []

        if (pastedMainFile) {
            compressionPromises.push(
                compressImage(pastedMainFile).then(compressed => {
                    formData.set('image', compressed)
                })
            )
        } else if (preview && preview.startsWith('http')) {
            formData.set('ai_image_url', preview)
        } else {
            const originalImage = formData.get('image') as File | null;
            if (originalImage && originalImage.size > 0 && typeof originalImage !== 'string') {
                compressionPromises.push(
                    compressImage(originalImage).then(compressed => {
                        formData.set('image', compressed)
                    })
                )
            }
        }

        if (newBrandMode && customBrand) formData.set('brand', customBrand)
        else formData.set('brand', selectedBrand)
        formData.set('variants', JSON.stringify(variants))
        formData.set('existingGallery', JSON.stringify(gallery))
        if (newCategoryMode && customCategory) formData.set('category', customCategory)
        else formData.set('category', selectedCategory)

        // Variantes
        for (const [id, file] of Object.entries(variantFiles)) {
            compressionPromises.push(
                compressImage(file).then(compressed => {
                    formData.set(`variant_image_${id}`, compressed)
                })
            )
        }

        // Galerie
        const galleryFiles = formData.getAll('gallery') as File[];
        formData.delete('gallery');
        if (galleryFiles.length > 0) {
            const galleryCompressed = Promise.all(
                galleryFiles
                    .filter(file => file && file.size > 0 && typeof file !== 'string')
                    .map(file => compressImage(file))
            ).then(compressedFiles => {
                compressedFiles.forEach(file => formData.append('gallery', file))
            })
            compressionPromises.push(galleryCompressed)
        }

        // Attendre que toutes les compressions soient finies
        await Promise.all(compressionPromises)

        const result = await updateProduct(product.id, formData)
        setLoading(false)
        if (result.success) { showToast("Mis à jour !", "success"); onClose(); router.refresh(); }
        else showToast(result.error || "Erreur", "error")
    }

    return (
        <Portal>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md bg-background/40">
                <div className="glass-panel w-full max-w-xl lg:max-w-3xl rounded-[24px] sm:rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
                    <div className="p-5 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] flex-shrink-0">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-none">Modifier Produit</h2>
                            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">ID: {product.id}</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="flex p-1 bg-white/5 mx-5 sm:mx-10 mt-4 rounded-2xl border border-white/10 shrink-0 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'info', label: 'Informations', icon: <FileText className="w-4 h-4" /> },
                            { id: 'media', label: 'Photos & Vidéos', icon: <ImageIcon className="w-4 h-4" /> },
                            { id: 'stock', label: 'Stock & Prix', icon: <Hash className="w-4 h-4" /> },
                            { id: 'visibility', label: 'Visibilité', icon: <Globe className="w-4 h-4" /> }
                        ].map(tab => (
                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-4 ${activeTab === tab.id ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-muted-foreground hover:text-white'}`}>
                                <span className="hidden sm:inline mr-2">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 sm:px-10 py-6 space-y-6 overflow-y-auto sm:overflow-y-visible custom-scrollbar overflow-x-hidden flex-1">
                        {/* INFO TAB */}
                        <div className={`space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 ${activeTab !== 'info' ? 'hidden' : ''}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Type d'article</label>
                                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-full h-[48px]">
                                        <button type="button" onClick={() => setItemType('product')} className={`flex-1 flex items-center justify-center rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${itemType === 'product' ? 'bg-white text-black shadow-md' : 'text-muted-foreground hover:text-white'}`}>Physique</button>
                                        <button type="button" onClick={() => setItemType('service')} className={`flex-1 flex items-center justify-center rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${itemType === 'service' ? 'bg-shop text-white shadow-md' : 'text-muted-foreground hover:text-white'}`}>Service</button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Désignation du Produit</label>
                                    <button type="button" onClick={focusSearch} className="text-[8px] sm:text-[9px] font-black uppercase text-shop hover:underline flex items-center bg-shop/5 px-3 py-1 rounded-lg border border-shop/10 transition-all hover:bg-shop/10"><Globe className="w-3.5 h-3.5 mr-1.5" /> Google Images</button>
                                </div>
                                <input name="name" ref={nameRef} defaultValue={product.name} required onPaste={async (e) => {
                                    const item = e.clipboardData.items[0];
                                    if (item?.type.includes('image')) {
                                        const file = item.getAsFile();
                                        if (file) {
                                            const url = URL.createObjectURL(file);
                                            setPreviewUrl(url);
                                            setIsImageDeleted(false);
                                            setPastedMainFile(file);
                                            showToast("Image principale collée !", "success");
                                        }
                                    }
                                }} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-bold focus:border-shop/50 outline-none transition-all text-white placeholder:text-muted-foreground/20 shadow-inner" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Marque</label>
                                        <button type="button" onClick={() => setNewBrandMode(!newBrandMode)} className="text-[8px] sm:text-[9px] font-black uppercase text-shop">{newBrandMode ? 'Annuler' : '+ Nouveau'}</button>
                                    </div>
                                    {newBrandMode ? <input value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none text-white shadow-inner" placeholder="Nom de marque..." autoFocus /> : <CustomDropdown options={[{ label: 'Aucune', value: '', icon: <Tag className="w-4 h-4" /> }, ...existingBrands.map(b => ({ label: b, value: b, icon: <Tag className="w-4 h-4" /> }))]} value={selectedBrand} onChange={setSelectedBrand} />}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Catégorie</label>
                                        <button type="button" onClick={() => setNewCategoryMode(!newCategoryMode)} className="text-[8px] sm:text-[9px] font-black uppercase text-shop">{newCategoryMode ? 'Annuler' : '+ Nouveau'}</button>
                                    </div>
                                    {newCategoryMode ? <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-4 text-sm font-bold outline-none text-white shadow-inner" placeholder="Nom de catégorie..." autoFocus /> : <CustomDropdown options={[{ label: 'Général', value: 'Général', icon: <Tags className="w-3.5 h-3.5" /> }, ...existingCategories.filter(cat => cat !== 'Général').map(cat => ({ label: cat, value: cat, icon: <Tags className="w-3.5 h-3.5" /> }))]} value={selectedCategory} onChange={setSelectedCategory} />}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Description Commerciale</label>
                                    <button type="button" onClick={async () => {
                                        const name = nameRef.current?.value;
                                        if (!name) return showToast("Saisissez un nom", "warning");
                                        const data = await authFetch(`${API_URL}/ai/analyze`, {
                                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ question: `Description courte (2 phrases) pour "${name}".` })
                                        });
                                        if (descRef.current) descRef.current.value = data.answer.trim().replace(/^"|"$/g, '');
                                    }} className="flex items-center space-x-2 px-3 py-1.5 bg-shop/10 text-shop rounded-xl border border-shop/20 text-[9px] font-black uppercase hover:bg-shop/20 transition-all shadow-sm"><Sparkles className="w-3.5 h-3.5" /> <span>IA Assist</span></button>
                                </div>
                                <textarea name="description" ref={descRef} defaultValue={product.description} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:border-shop/50 outline-none text-white resize-none placeholder:text-muted-foreground/20 shadow-inner" />
                            </div>
                        </div>

                        {/* MEDIA TAB */}
                        <div className={`space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 ${activeTab !== 'media' ? 'hidden' : ''}`}>
                            <div className="flex flex-col space-y-3">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Image de Couverture</label>
                                <div onClick={() => fileInputRef.current?.click()} className="h-64 sm:h-80 glass-panel rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden active:bg-white/10 cursor-pointer relative group shadow-2xl bg-white/[0.01]">
                                    {preview ? <><img src={preview} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 transition-opacity backdrop-blur-sm"><button type="button" onClick={(e) => { e.stopPropagation(); setLightbox({ isOpen: true, src: preview }); }} className="p-4 bg-white/10 rounded-3xl hover:bg-white/20 transition-all hover:scale-110"><Search className="w-6 h-6 text-white" /></button><button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-4 bg-white/10 rounded-3xl hover:bg-white/20 transition-all hover:scale-110"><Upload className="w-6 h-6 text-white" /></button><button type="button" onClick={removeMainImage} className="p-4 bg-red-500/20 text-red-400 rounded-3xl hover:bg-red-500 hover:text-white transition-all hover:scale-110"><Trash2 className="w-6 h-6" /></button></div></> : <div className="flex flex-col items-center text-muted-foreground group-hover:text-shop transition-all"><Upload className="w-12 h-12 mb-3 opacity-20" /><p className="text-[11px] font-black uppercase tracking-widest">Choisir l'image principale</p></div>}
                                    <input type="file" name="image" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                </div>
                            </div>

                            <div className="p-6 glass-panel rounded-[28px] border border-white/10 space-y-2 bg-white/[0.01] shadow-inner">
                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Galerie Multimedia</label>
                                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {gallery.filter(url => url).map((url, index) => (<div key={`ex-${index}`} className="relative aspect-square rounded-2xl overflow-hidden group shadow-lg border border-white/5"><img src={url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm"><button type="button" onClick={() => setGallery(gallery.filter((_, i) => i !== index))} className="p-2 hover:scale-110 transition-transform"><Trash2 className="w-5 h-5 text-white" /></button></div></div>))}
                                    {newGalleryPreviews.map((url, index) => (<div key={`nw-${index}`} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-shop/30 group shadow-lg"><img src={url} className="w-full h-full object-cover" /><button type="button" onClick={() => setNewGalleryPreviews(newGalleryPreviews.filter((_, i) => i !== index))} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm"><X className="w-5 h-5 text-white" /></button></div>))}
                                    <label className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:border-shop/50 transition-all"><Plus className="w-4 h-4 text-muted-foreground" /><input type="file" name="gallery" multiple accept="image/*" className="hidden" onChange={(e) => {
                                        const files = Array.from(e.target.files || [])
                                        setNewGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
                                    }} /></label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Vidéo URL (YouTube)</label>
                                <input name="video_url" defaultValue={product.video_url} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm font-bold focus:border-shop/50 outline-none text-white shadow-sm" placeholder="https://www.youtube.com/watch?v=..." />
                            </div>
                        </div>

                        {/* STOCK TAB */}
                        <div className={`space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 ${activeTab !== 'stock' ? 'hidden' : ''}`}>
                            <div className="grid grid-cols-3 gap-3 bg-white/[0.02] p-5 rounded-[28px] border border-white/10 shadow-inner">
                                <div className="space-y-1"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Vente</label><div className="relative group"><input name="price" type="number" defaultValue={product.price} required className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm font-black focus:border-shop/50 outline-none text-white pr-14 shadow-sm" /><span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">CFA</span></div></div>
                                <div className="space-y-1"><label className="text-[9px] font-black uppercase text-blue-400 ml-1">Promotion</label><div className="relative group"><input name="promo_price" type="number" defaultValue={product.promo_price} className="w-full bg-blue-500/5 border border-blue-500/20 rounded-xl py-2 px-3 text-sm font-black focus:border-blue-500 outline-none text-white pr-14 shadow-sm" /><span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">CFA</span></div></div>
                                {(profile?.is_super_admin || profile?.role === 'inventory') && (
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-red-400 ml-1">Revient</label>
                                        <div className="relative group">
                                            <input name="cost_price" type="number" defaultValue={product.cost_price} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm font-black focus:border-shop/50 outline-none text-white pr-14 shadow-sm" />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-400/50">CFA</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={itemType !== 'product' ? 'hidden' : 'space-y-6'}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Stock Initial {variants.length > 0 && <span className="text-shop animate-pulse">(Auto)</span>}</label><input name="stock" type="number" value={globalStock} onChange={(e) => setGlobalStock(e.target.value)} readOnly={variants.length > 0} required className={`w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm font-black outline-none text-white ${variants.length > 0 ? 'opacity-50' : ''}`} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-orange-400 ml-1">Seuil Alerte</label><input name="minStock" type="number" defaultValue={product.min_stock || 2} required className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm font-black outline-none text-white" /></div>
                                </div>
                                <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Date de Péremption</label><input name="expiry_date" type="date" defaultValue={product.expiry_date ? new Date(product.expiry_date).toISOString().split('T')[0] : ''} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold outline-none text-white shadow-sm focus:border-shop/50" /></div>

                                <div className="space-y-4 p-6 glass-panel rounded-[32px] border border-white/10 bg-white/[0.01] shadow-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-[11px] font-black uppercase text-shop flex items-center tracking-widest"><Sparkles className="w-4 h-4 mr-2" /> Gestion des Variantes</h4>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase bg-white/5 px-3 py-1 rounded-lg">{variants.length} modèles</span>
                                    </div>

                                    <div className="grid grid-cols-[40px_1fr_1fr_80px_40px] gap-3 px-2 border-b border-white/5 pb-2">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Img</span>
                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Couleur</span>
                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Taille</span>
                                        <span className="text-[8px] font-black uppercase text-muted-foreground text-center">Stock</span>
                                        <span className="text-[8px] font-black uppercase text-muted-foreground text-right">Act.</span>
                                    </div>

                                    <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                        {variants.map(v => (
                                            <div key={v.id} className="grid grid-cols-[40px_1fr_1fr_80px_40px] gap-3 px-2 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all items-center group shadow-sm">
                                                <div 
                                                    className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-black/20 shrink-0 shadow-inner cursor-pointer hover:border-shop/50"
                                                    onClick={() => { setActiveVariantId(v.id); variantFileInputRef.current?.click(); }}
                                                >
                                                    {v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon className="w-4 h-4" /></div>}
                                                </div>
                                                <input 
                                                    value={v.color || ''} 
                                                    onChange={(e) => setVariants(variants.map(varItem => varItem.id === v.id ? { ...varItem, color: e.target.value } : varItem))}
                                                    onPaste={(e) => handleVariantPaste(e, v.id)}
                                                    placeholder="Couleur"
                                                    className="bg-transparent border-none text-[10px] font-bold text-white uppercase truncate outline-none focus:ring-1 focus:ring-shop/30 rounded"
                                                />
                                                <input 
                                                    value={v.size || ''} 
                                                    onChange={(e) => setVariants(variants.map(varItem => varItem.id === v.id ? { ...varItem, size: e.target.value } : varItem))}
                                                    onPaste={(e) => handleVariantPaste(e, v.id)}
                                                    placeholder="Taille"
                                                    className="bg-transparent border-none text-[10px] font-bold text-white uppercase truncate outline-none focus:ring-1 focus:ring-shop/30 rounded"
                                                />
                                                <div className="flex items-center bg-black/40 rounded-lg px-2 py-1 border border-white/5 shadow-inner">
                                                    <input
                                                        type="number"
                                                        value={v.stock || 0}
                                                        onPaste={(e) => handleVariantPaste(e, v.id)}
                                                        onChange={(e) => updateVariantStock(v.id, e.target.value)}
                                                        className="w-full bg-transparent border-none text-[10px] font-black text-white text-center outline-none"
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <button type="button" onClick={() => removeVariant(v.id)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-40 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                                </div>
                                            </div>
                                        ))}
                                        {variants.length === 0 && <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl opacity-20"><p className="text-[10px] font-black uppercase">Aucune variante enregistrée</p></div>}
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-white/5">
                                        <div className="grid grid-cols-[44px_1fr_1fr_80px_auto] gap-2 items-center">
                                            <button type="button" onClick={() => { setActiveVariantId(newVariant.id); variantFileInputRef.current?.click() }} className={`w-11 h-11 flex items-center justify-center rounded-xl border-2 border-dashed transition-all ${variantFiles[newVariant.id] ? 'bg-shop text-white border-shop shadow-lg' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-shop/50'}`}><Upload className="w-5 h-5" /></button>
                                            <input value={newVariant.color} onPaste={(e) => handleVariantPaste(e, newVariant.id)} onChange={e => setNewVariant({ ...newVariant, color: e.target.value })} placeholder="Couleur" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:border-shop/50 text-white shadow-sm" />
                                            <input value={newVariant.size} onPaste={(e) => handleVariantPaste(e, newVariant.id)} onChange={e => setNewVariant({ ...newVariant, size: e.target.value })} placeholder="Taille" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm outline-none focus:border-shop/50 text-white shadow-sm" />
                                            <input type="number" value={newVariant.stock} onPaste={(e) => handleVariantPaste(e, newVariant.id)} onChange={e => setNewVariant({ ...newVariant, stock: e.target.value })} placeholder="Qté" className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm font-black outline-none focus:border-shop/50 text-white text-center shadow-sm" />
                                            <button type="button" onClick={addVariant} className="w-11 h-11 bg-white text-black flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"><Plus className="w-6 h-6" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* VISIBILITY TAB */}
                        <div className={`space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 ${activeTab !== 'visibility' ? 'hidden' : ''}`}>
                            <div className="grid grid-cols-3 gap-6 p-8 glass-panel rounded-[40px] border border-white/10 bg-white/[0.01] shadow-2xl">
                                <div className="flex flex-col space-y-4 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all"><div className="w-12 h-12 rounded-2xl bg-shop/10 flex items-center justify-center text-shop group-hover:scale-110 transition-transform"><Store className="w-6 h-6" /></div><span className="text-[11px] font-black uppercase tracking-widest text-white text-center">Magasin Boutique</span><button type="button" onClick={() => setShowOnPos(!showOnPos)} className={`w-14 h-7 rounded-full relative transition-all duration-500 ${showOnPos ? 'bg-shop shadow-[0_0_20px_rgba(var(--shop-primary),0.4)]' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${showOnPos ? 'left-8 scale-110' : 'left-1'}`} /></button></div>
                                <div className="flex flex-col space-y-4 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all border-x border-white/10"><div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Globe className="w-6 h-6" /></div><span className="text-[11px] font-black uppercase tracking-widest text-white text-center">Vente en Ligne</span><button type="button" onClick={() => setShowOnWebsite(!showOnWebsite)} className={`w-14 h-7 rounded-full relative transition-all duration-500 ${showOnWebsite ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${showOnWebsite ? 'left-8' : 'left-1'}`} /></button></div>
                                <div className="flex flex-col space-y-4 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 group hover:bg-white/[0.08] transition-all"><div className="w-12 h-12 rounded-2xl bg-shop-secondary/10 flex items-center justify-center text-shop-secondary group-hover:scale-110 transition-transform"><Sparkles className="w-6 h-6" /></div><span className="text-[11px] font-black uppercase tracking-widest text-shop-secondary text-center">Produit Vedette</span><button type="button" onClick={() => setIsFeatured(!isFeatured)} className={`w-14 h-7 rounded-full relative transition-all duration-500 ${isFeatured ? 'bg-shop-secondary shadow-[0_0_20px_rgba(var(--shop-secondary),0.4)]' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${isFeatured ? 'left-8' : 'left-1'}`} /></button></div>
                            </div>
                            <div className="p-6 rounded-[32px] bg-shop/[0.03] border border-shop/10 flex items-center space-x-5 shadow-sm"><div className="w-12 h-12 rounded-2xl bg-shop/10 flex items-center justify-center text-shop shrink-0 shadow-lg"><Save className="w-6 h-6" /></div><p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.1em] leading-relaxed">Vos modifications seront appliquées instantanément sur l'ensemble de la plateforme Lolly.</p></div>
                        </div>

                        <div className="pt-6 flex items-center justify-between space-x-4 shrink-0 border-t border-white/5 mt-auto bg-black/30 p-6 sm:p-10 -mx-10 -mb-8 rounded-b-[40px]">
                            <button type="button" onClick={onClose} className="px-8 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all active:scale-95">Fermer</button>
                            <div className="flex items-center space-x-4">
                                <div className="hidden sm:flex items-center space-x-2 mr-4 opacity-30">{['info', 'media', 'stock', 'visibility'].map(t => (<div key={t} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeTab === t ? 'w-5 bg-shop shadow-[0_0_10px_rgba(var(--shop-primary),0.8)]' : 'bg-white/20'}`} />))}</div>
                                <button type="submit" disabled={loading} className="px-12 py-4 bg-shop text-white rounded-2xl text-[11px] lg:text-xs font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(var(--shop-primary),0.6)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center min-w-[240px]">{loading ? <Sparkles className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />} {loading ? 'Traitement...' : 'Sauvegarder les modifications'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <ImageLightbox isOpen={lightbox.isOpen} src={lightbox.src} onClose={() => setLightbox({ ...lightbox, isOpen: false })} />
            <ManageCategoriesModal isOpen={isManageCatsOpen} onClose={() => setIsManageCatsOpen(false)} categories={existingCategories} onRefresh={fetchCategories} />
            <input type="file" ref={variantFileInputRef} onChange={handleVariantImageChange} className="hidden" accept="image/*" />
        </Portal>
    )
}
