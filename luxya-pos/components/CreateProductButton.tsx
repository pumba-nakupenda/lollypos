'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Package, Ruler, Hash, Image as ImageIcon, Tags, FileText, Upload, Trash2, ChevronDown, AlertTriangle, Store, PlusCircle, Sparkles, Calendar, PlayCircle, Globe, Tag } from 'lucide-react'
import { createProduct } from '@/app/inventory/actions'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import CustomDropdown from './CustomDropdown'
import Portal from './Portal'
import ImageLightbox from './ImageLightbox'
import { API_URL, authFetch } from '@/utils/api'
import { compressImage } from '@/utils/image'
import { useRouter } from 'next/navigation'

export default function CreateProductButton() {
    const { activeShop, shops } = useShop()
    const { showToast } = useToast()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

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

    const [itemType, setItemType] = useState<'product' | 'service'>('product')
    const [variants, setVariants] = useState<any[]>([])
    const [variantFiles, setVariantFiles] = useState<Record<number, File>>({})
    const [newVariant, setNewVariant] = useState({ id: Date.now(), color: '', size: '', stock: '', image: '' })
    const variantFileInputRef = useRef<HTMLInputElement>(null)
    const [activeVariantId, setActiveVariantId] = useState<number | null>(null)

    const [showOnPos, setShowOnPos] = useState<boolean>(true)
    const [showOnWebsite, setShowOnWebsite] = useState<boolean>(true)

    const [selectedShopId, setSelectedShopId] = useState<number>(1)
    const [globalStock, setGlobalStock] = useState<string>('0')
    const [lightbox, setLightbox] = useState<{ isOpen: boolean, src: string }>({ isOpen: false, src: '' })
    const isGlobalView = !activeShop || activeShop.id === 0

    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'stock' | 'visibility'>('info')

    const addVariant = () => {
        if (!newVariant.color && !newVariant.size) return showToast("Entrez couleur ou taille", "warning")
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

    const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && activeVariantId !== null) {
            setVariantFiles({ ...variantFiles, [activeVariantId]: file })
            const url = URL.createObjectURL(file)
            if (newVariant && activeVariantId === newVariant.id) setNewVariant({ ...newVariant, image: url })
            else setVariants(variants.map(v => v.id === activeVariantId ? { ...v, image: url } : v))
            setActiveVariantId(null)
        }
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
                    showToast("Image collée !", "success")
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

    const focusSearch = () => {
        const name = nameRef.current?.value;
        if (!name) return showToast("Entrez un nom", "warning");
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}`, '_blank');
    };

    useEffect(() => {
        if (isOpen) {
            if (activeShop && activeShop.id !== 0) setSelectedShopId(activeShop.id)
            authFetch(`${API_URL}/products`).then(data => {
                const cats = new Set(data.map((p: any) => p.category).filter(Boolean))
                setExistingCategories(Array.from(cats) as string[])
                const bnds = new Set(data.map((p: any) => p.brand).filter(Boolean))
                setExistingBrands(Array.from(bnds).sort() as string[])
            })
        }
    }, [isOpen])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) setPreviewUrl(URL.createObjectURL(file))
    }

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setGalleryPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))])
    }

    const clearImage = () => {
        setPreviewUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const clearGalleryItem = (index: number) => setGalleryPreviews(prev => prev.filter((_, i) => i !== index))

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const isPhysicalShop = selectedShopId === 1 || selectedShopId === 2;
        const costPrice = parseFloat(formData.get('cost_price') as string || '0');
        if (itemType === 'product' && isPhysicalShop && costPrice <= 0) return setError("Le prix de revient est obligatoire.");

        setLoading(true)
        setError(null)
        formData.set('shopId', selectedShopId.toString())
        formData.set('type', itemType)
        formData.set('show_on_pos', showOnPos.toString())
        formData.set('show_on_website', showOnWebsite.toString())
        formData.set('variants', JSON.stringify(variants))
        formData.set('category', newCategoryMode ? customCategory : selectedCategory)
        formData.set('brand', newBrandMode ? customBrand : selectedBrand)

        // Compression en parallèle pour gagner en vitesse
        const compressionPromises: Promise<void>[] = []

        // Image principale
        const originalImage = formData.get('image') as File | null;
        if (originalImage && originalImage.size > 0 && typeof originalImage !== 'string') {
            compressionPromises.push(
                compressImage(originalImage).then(compressed => {
                    formData.set('image', compressed)
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

        // Variantes
        for (const [id, file] of Object.entries(variantFiles)) {
            compressionPromises.push(
                compressImage(file).then(compressed => {
                    formData.set(`variant_image_${id}`, compressed)
                })
            )
        }

        // Attendre que toutes les compressions soient finies
        await Promise.all(compressionPromises)

        const result = await createProduct(formData)
        if (result?.error) setError(result.error)
        else {
            setIsOpen(false)
            setPreviewUrl(null)
            setNewCategoryMode(false)
            setVariants([])
            setVariantFiles({})
            router.refresh()
        }
        setLoading(false)
    }

    const categoryOptions = [{ label: 'Général', value: 'Général', icon: <Tags className="w-3.5 h-3.5" /> }, ...existingCategories.filter(cat => cat !== 'Général').map(cat => ({ label: cat, value: cat, icon: <Tags className="w-3.5 h-3.5" /> }))]

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="group relative px-6 py-3 bg-shop text-white rounded-2xl font-black text-xs uppercase tracking-widest overflow-hidden transition-all hover:scale-[1.05] active:scale-95 shadow-xl flex items-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Plus className="w-4 h-4 mr-2" /> Ajouter un Produit
            </button>

            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md bg-background/40">
                        <div className="glass-panel w-full max-w-xl lg:max-w-3xl rounded-[24px] sm:rounded-[32px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-5 sm:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] flex-shrink-0">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black shop-gradient-text uppercase tracking-tighter leading-none">Nouveau Produit</h3>
                                    <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 truncate">Magasin {activeShop?.name || 'Luxya'}</p>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="p-2.5 glass-card rounded-xl text-muted-foreground hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex p-1 bg-white/5 mx-5 sm:mx-10 mt-4 rounded-2xl border border-white/10 shrink-0 overflow-x-auto custom-scrollbar">
                                {[
                                    { id: 'info', label: 'Informations', icon: <FileText className="w-4 h-4" /> },
                                    { id: 'media', label: 'Galerie Photos', icon: <ImageIcon className="w-4 h-4" /> },
                                    { id: 'stock', label: 'Stock & Prix', icon: <Hash className="w-4 h-4" /> },
                                    { id: 'visibility', label: 'Visibilité', icon: <Globe className="w-4 h-4" /> }
                                ].map(tab => (
                                    <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[9px] sm:text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap px-6 ${activeTab === tab.id ? 'bg-white text-black shadow-xl scale-[1.02]' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                                        <span className="hidden sm:inline mr-2">{tab.icon}</span> {tab.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="px-6 sm:px-10 py-6 space-y-6 overflow-y-auto custom-scrollbar smooth-scroll flex-1 overflow-x-hidden">
                                {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-[10px] sm:text-xs font-bold border border-red-500/20 flex items-center shadow-lg"><AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" /> {error}</div>}

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
                                        {isGlobalView && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Boutique</label>
                                                <CustomDropdown options={shops.filter(s => s.id !== 0).map(s => ({ label: s.name, value: s.id, icon: <Store className="w-3.5 h-3.5" /> }))} value={selectedShopId} onChange={setSelectedShopId} placeholder="Choisir boutique..." />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Désignation du Produit</label>
                                            <button type="button" onClick={focusSearch} className="text-[8px] sm:text-[9px] font-black uppercase text-shop hover:underline flex items-center bg-shop/5 px-3 py-1 rounded-lg border border-shop/10 transition-all hover:bg-shop/10"><Globe className="w-3.5 h-3.5 mr-1.5" /> Google Images</button>
                                        </div>
                                        <input name="name" ref={nameRef} required onPaste={async (e) => {
                                            const item = e.clipboardData.items[0];
                                            if (item?.type.includes('image')) {
                                                const file = item.getAsFile();
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    setPreviewUrl(url);
                                                    // On crée un DataTransfer pour simuler un input file
                                                    const dataTransfer = new DataTransfer();
                                                    dataTransfer.items.add(file);
                                                    if (fileInputRef.current) fileInputRef.current.files = dataTransfer.files;
                                                    showToast("Image principale collée !", "success");
                                                }
                                            }
                                        }} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-bold focus:border-shop/50 outline-none transition-all text-white placeholder:text-muted-foreground/20 shadow-inner" placeholder="Ex: Chemise Silk Premium" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Catégorie</label>
                                                <button type="button" onClick={() => setNewCategoryMode(!newCategoryMode)} className="text-[8px] sm:text-[9px] font-black uppercase text-shop hover:underline">{newCategoryMode ? 'Annuler' : '+ Nouveau'}</button>
                                            </div>
                                            {newCategoryMode ? <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-6 text-sm font-bold outline-none text-white shadow-inner" placeholder="Nom de catégorie..." autoFocus /> : <CustomDropdown options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} />}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Marque</label>
                                                <button type="button" onClick={() => setNewBrandMode(!newBrandMode)} className="text-[8px] sm:text-[9px] font-black uppercase text-shop hover:underline">{newBrandMode ? 'Annuler' : '+ Nouveau'}</button>
                                            </div>
                                            {newBrandMode ? <input value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} className="w-full bg-white/5 border border-shop/30 rounded-2xl py-3.5 px-6 text-sm font-bold outline-none text-white shadow-inner" placeholder="Nom de marque..." autoFocus /> : <CustomDropdown options={[{ label: 'Aucune marque', value: '', icon: <Tag className="w-3.5 h-3.5" /> }, ...existingBrands.map(b => ({ label: b, value: b, icon: <Tag className="w-3.5 h-3.5" /> }))]} value={selectedBrand} onChange={setSelectedBrand} />}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest">Description</label>
                                            <button type="button" onClick={async () => {
                                                const name = nameRef.current?.value;
                                                if (!name) return showToast("Saisissez un nom", "warning");
                                                try {
                                                    const res = await authFetch(`${API_URL}/ai/analyze`, {
                                                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ question: `Rédige une description de vente très courte (2 phrases), persuasive pour "${name}".` })
                                                    });
                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        if (descRef.current) descRef.current.value = data.answer.trim().replace(/^"|"$/g, '');
                                                    }
                                                } catch (e) { }
                                            }} className="flex items-center space-x-2 px-3 py-1.5 bg-shop/10 text-shop rounded-xl border border-shop/20 text-[9px] font-black uppercase hover:bg-shop/20 transition-all shadow-sm"><Sparkles className="w-3.5 h-3.5" /> <span>IA Assist</span></button>
                                        </div>
                                        <textarea name="description" ref={descRef} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-medium focus:border-shop/50 outline-none transition-all text-white resize-none placeholder:text-muted-foreground/20 shadow-inner" placeholder="Détails du produit..." />
                                    </div>
                                </div>

                                {/* MEDIA TAB */}
                                <div className={`space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 ${activeTab !== 'media' ? 'hidden' : ''}`}>
                                    <div className="space-y-3">
                                        <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Image Principale</label>
                                        {!previewUrl ? (
                                            <div onClick={() => fileInputRef.current?.click()} className="h-56 sm:h-72 lg:h-80 glass-panel rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-shop/50 transition-all text-center group bg-white/[0.01]">
                                                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-shop/20 transition-all shadow-xl">
                                                    <Upload className="w-8 h-8 text-muted-foreground group-hover:text-shop" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">Cliquer pour charger ou Coller</p>
                                            </div>
                                        ) : (
                                            <div className="relative group/preview rounded-[32px] overflow-hidden aspect-video bg-black/40 border border-white/10 shadow-2xl">
                                                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-6 backdrop-blur-sm">
                                                    <button type="button" onClick={() => setLightbox({ isOpen: true, src: previewUrl })} className="p-4 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all hover:scale-110"><ImageIcon className="w-6 h-6" /></button>
                                                    <button type="button" onClick={clearImage} className="p-4 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all hover:scale-110"><Trash2 className="w-6 h-6" /></button>
                                                </div>
                                            </div>
                                        )}
                                        <input type="file" name="image" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Galerie Photos</label>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
                                            {galleryPreviews.map((url, index) => (
                                                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 group shadow-lg">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <button type="button" onClick={() => clearGalleryItem(index)} className="p-2 hover:scale-110 transition-transform"><X className="w-5 h-5 text-white" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => galleryInputRef.current?.click()} className="aspect-square border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center hover:border-shop/50 hover:bg-shop/5 transition-all group shadow-sm active:scale-95 bg-white/[0.01]">
                                                <Plus className="w-8 h-8 text-muted-foreground group-hover:text-shop transition-colors" />
                                            </button>
                                        </div>
                                        <input type="file" name="gallery" ref={galleryInputRef} onChange={handleGalleryChange} className="hidden" accept="image/*" multiple />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Vidéo URL (YouTube / MP4)</label>
                                        <input name="video_url" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-shop/50 outline-none transition-all text-white placeholder:text-muted-foreground/20" placeholder="Lien vers la vidéo..." />
                                    </div>
                                </div>

                                {/* STOCK TAB */}
                                <div className={`space-y-6 animate-in fade-in slide-in-from-left-2 duration-300 ${activeTab !== 'stock' ? 'hidden' : ''}`}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-white/[0.02] p-6 rounded-[32px] border border-white/10 shadow-inner">
                                        <div className="space-y-2">
                                            <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Prix Vente</label>
                                            <div className="relative group">
                                                <input name="price" type="number" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-black focus:border-shop/50 outline-none text-white pr-14 shadow-sm" placeholder="0" />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">CFA</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] sm:text-[11px] font-black uppercase text-blue-400 tracking-widest ml-1">Prix Promo</label>
                                            <div className="relative group">
                                                <input name="promo_price" type="number" className="w-full bg-blue-500/5 border border-blue-500/20 rounded-2xl py-4 px-6 text-base font-black focus:border-blue-500 outline-none text-white pr-14 shadow-sm" placeholder="-" />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">CFA</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 col-span-2 sm:col-span-1">
                                            <label className="text-[10px] sm:text-[11px] font-black uppercase text-red-400 tracking-widest ml-1">Prix Revient</label>
                                            <div className="relative group">
                                                <input name="cost_price" type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-black focus:border-shop/50 outline-none text-white pr-14 shadow-sm" placeholder="0" />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-400/50">CFA</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={itemType !== 'product' ? 'hidden' : 'space-y-6'}>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Stock Initial {variants.length > 0 && <span className="text-shop animate-pulse">(Auto)</span>}</label>
                                                <input name="stock" type="number" value={globalStock} onChange={(e) => setGlobalStock(e.target.value)} readOnly={variants.length > 0} required className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-black outline-none transition-all text-white shadow-sm ${variants.length > 0 ? 'opacity-50 bg-shop/5 border-shop/20' : 'focus:border-shop/50'}`} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] sm:text-[11px] font-black uppercase text-orange-400 tracking-widest ml-1">Stock Minimal Alerte</label>
                                                <input name="minStock" type="number" defaultValue={2} required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-base font-black focus:border-shop/50 outline-none text-white shadow-sm" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-widest ml-1">Date de Péremption</label>
                                            <input name="expiry_date" type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-shop/50 outline-none transition-all text-white shadow-sm" />
                                        </div>

                                        <div className="space-y-4 p-6 glass-panel rounded-[32px] border border-white/10 bg-white/[0.01] shadow-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-[11px] font-black uppercase text-shop tracking-widest flex items-center tracking-widest"><Sparkles className="w-4 h-4 mr-2" /> Gestion des Variantes</h4>
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
                                    <div className="grid grid-cols-2 gap-6 p-8 glass-panel rounded-[40px] border border-white/10 bg-white/[0.01] shadow-2xl">
                                        <div className="flex flex-col space-y-4 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 transition-all hover:bg-white/[0.08] group">
                                            <div className="w-12 h-12 rounded-2xl bg-shop/10 flex items-center justify-center text-shop group-hover:scale-110 transition-transform"><Store className="w-6 h-6" /></div>
                                            <div className="text-center">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Vente Boutique</span>
                                                <p className="text-[9px] text-muted-foreground uppercase mt-1">Caisse POS</p>
                                            </div>
                                            <button type="button" onClick={() => setShowOnPos(!showOnPos)} className={`w-14 h-7 rounded-full relative transition-all duration-500 ${showOnPos ? 'bg-shop shadow-[0_0_15px_rgba(var(--shop-primary),0.4)]' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${showOnPos ? 'left-8' : 'left-1'}`} /></button>
                                        </div>
                                        <div className="flex flex-col space-y-4 items-center p-6 rounded-[32px] bg-white/5 border border-white/5 transition-all hover:bg-white/[0.08] group">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Globe className="w-6 h-6" /></div>
                                            <div className="text-center">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Vente en Ligne</span>
                                                <p className="text-[9px] text-muted-foreground uppercase mt-1">Site E-commerce</p>
                                            </div>
                                            <button type="button" onClick={() => setShowOnWebsite(!showOnWebsite)} className={`w-14 h-7 rounded-full relative transition-all duration-500 ${showOnWebsite ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-xl ${showOnWebsite ? 'left-8' : 'left-1'}`} /></button>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-orange-500/[0.03] border border-orange-500/10 flex items-center space-x-5 shadow-sm">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 shadow-lg"><AlertTriangle className="w-6 h-6" /></div>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black leading-relaxed tracking-widest">Dernière vérification avant enregistrement global.</p>
                                    </div>
                                </div>

                                <div className="pt-6 flex items-center justify-between space-x-4 shrink-0 border-t border-white/5 mt-auto bg-black/30 p-6 sm:p-8 -mx-10 -mb-6 rounded-b-[24px] sm:rounded-b-[40px]">
                                    <button type="button" onClick={() => setIsOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all active:scale-95">Fermer</button>
                                    <div className="flex items-center space-x-4">
                                        <div className="hidden sm:flex items-center space-x-2 mr-4 opacity-30">
                                            {['info', 'media', 'stock', 'visibility'].map(t => (<div key={t} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${activeTab === t ? 'w-5 bg-shop shadow-[0_0_10px_rgba(var(--shop-primary),0.8)]' : 'bg-white/20'}`} />))}
                                        </div>
                                        <button type="submit" disabled={loading} className="px-12 py-4 bg-shop text-white rounded-2xl text-[11px] lg:text-xs font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(var(--shop-primary),0.6)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center min-w-[240px]">
                                            {loading ? <Sparkles className="w-5 h-5 mr-3 animate-spin" /> : <PlusCircle className="w-5 h-5 mr-3" />}
                                            {loading ? 'Traitement...' : 'Enregistrer le produit'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </Portal>
            )}
            <ImageLightbox isOpen={lightbox.isOpen} src={lightbox.src} onClose={() => setLightbox({ ...lightbox, isOpen: false })} />
            <input type="file" ref={variantFileInputRef} onChange={handleVariantImageChange} className="hidden" accept="image/*" />
        </>
    )
}
