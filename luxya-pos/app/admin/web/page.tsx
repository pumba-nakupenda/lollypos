'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Globe, Save, Image as ImageIcon, MessageCircle, Type, Layout, RefreshCw, Plus, Trash2, Upload, X, Sparkles, ChevronDown, Tags } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'
import { API_URL } from '@/utils/api'

const DEFAULT_GROUPS = [
    {
        title: "Beauté & Maquillage",
        match: [
            "Maquillage", "Fond de teint", "Gloss", "Mascara", "Poudre", "Rouge à Lèvres",
            "Yeux", "Pinceaux", "Accessoires / Pinceaux", "Crayon", "Eye Liner", "Palette",
            "Sains & Beauté", "Soins", "Visage", "Corps", "Cheveux", "Ongles"
        ]
    },
    {
        title: "Bijoux & Montres",
        match: ["Bijoux", "Montres", "Parrure", "Sautoire", "Bracelet", "Boucles", "Bague", "Collier", "Chaine"]
    },
    {
        title: "Maroquinerie & Accessoires",
        match: ["Sacs", "Saccoche", "Portefeuille", "Ceinture", "Lunettes", "Chapeau", "Casquette", "Bonnet"]
    },
    {
        title: "Parfums",
        match: ["Parfum", "Eau de toilette"]
    },
    {
        title: "Maison & Déco",
        match: ["Maison", "Déco", "Cuisine", "Salle de bain", "Chambre", "Salon"]
    },
    {
        title: "High-Tech",
        match: ["Téléphone", "Smartphone", "Tablette", "Ordinateur", "Accessoires Tel", "Audio", "Son", "Image"]
    }
];

export default function WebManagementPage() {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaveLoading] = useState(false)
    const [uploadingId, setUploadingId] = useState<number | null>(null)

    const [generatingBanner, setGeneratingBanner] = useState(false)
    const [categories, setCategories] = useState<string[]>([]) // Available categories from DB
    const [collapsedGroups, setCollapsedGroups] = useState<number[]>([]);

    const toggleGroupCollapse = (index: number) => {
        setCollapsedGroups(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const [settings, setSettings] = useState<any>({
        hero_title: "Lolly Shop",
        hero_subtitle: "L'excellence de Luxya & Homtek",
        promo_banner: "BIENVENUE CHEZ LOLLY SHOP : L'EXCELLENCE AU SÉNÉGAL",
        whatsapp_number: "221772354747",
        address: "Fass delorme 13x22",
        event: {
            title: "Livraison Offerte",
            description: "Gratuite sur tout Dakar ce week-end !",
            image: "https://images.unsplash.com/photo-1590874102752-ce229799d529?q=80&w=1000",
            mini_image: "",
            link: "/?sort=best"
        },
        slides: [
            { id: 2, title: "Le Futur Digital", subtitle: "Homtek Tech", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661", brand: "HOMTEK", color: "#0055ff" }
        ],
        category_groups: [] // New: Category Groups Config
    })

    const handleGenerateBanner = async () => {
        try {
            setGeneratingBanner(true)
            const res = await fetch(`${API_URL}/ai/generate-banner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            if (!res.ok) throw new Error(`Erreur Serveur (${res.status})`);
            const data = await res.json()
            if (data.slogan) {
                setSettings({ ...settings, promo_banner: data.slogan })
                showToast("Nouveau slogan généré !", "success")
            }
        } catch (err: any) {
            showToast(`Erreur : ${err.message || "Indisponible"}`, "error")
        } finally {
            setGeneratingBanner(false)
        }
    }

    const fetchSettings = async () => {
        try {
            setLoading(true)
            const supabase = createClient()
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('name', 'lolly_shop_config')
                .maybeSingle()

            if (data) {
                const fetchedContent = data.content;
                if (!fetchedContent.event) {
                    fetchedContent.event = { title: "", description: "", image: "", mini_image: "", link: "" };
                }
                setSettings(fetchedContent);
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const supabase = createClient()
            // Filter by products shown on website to be shop-aware
            const { data } = await supabase.from('products').select('category').eq('show_on_website', true)
            if (data) {
                // Extract unique categories
                const unique = Array.from(new Set(data.map((p: any) => p.category))).filter(Boolean).sort() as string[]
                setCategories(unique)
            }
        } catch (e) {
            console.error("Error fetching categories", e)
        }
    }

    useEffect(() => {
        fetchSettings()
        fetchCategories()
    }, [])

    const handleSave = async () => {
        try {
            setSaveLoading(true)
            const supabase = createClient()
            const finalSettings = { ...settings, updated_at: new Date().toISOString() }
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    name: 'lolly_shop_config',
                    content: finalSettings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'name' })

            if (error) throw new Error(`Erreur Supabase: ${error.message}`);
            showToast("Site mis à jour avec succès !", "success")
            fetchSettings()
        } catch (err: any) {
            showToast(err.message || "Erreur de sauvegarde", "error")
        } finally {
            setSaveLoading(false)
        }
    }

    const addSlide = () => {
        const newId = Date.now()
        const newSlide = {
            id: newId,
            title: "Nouveau Slide",
            subtitle: "Description courte",
            brand: "LUXYA",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
            color: "#ef4444"
        }
        setSettings({ ...settings, slides: [...settings.slides, newSlide] })
    }

    const removeSlide = (id: number) => {
        if (settings.slides.length <= 1) {
            showToast("Vous devez garder au moins un slide.", "error")
            return
        }
        const newSlides = settings.slides.filter((s: any) => s.id !== id)
        setSettings({ ...settings, slides: newSlides })
    }

    const updateSlide = (id: number, field: string, value: string) => {
        const newSlides = settings.slides.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
        setSettings({ ...settings, slides: newSlides })
    }

    const handleUploadImage = async (file: File, slideId: number | 'event' | 'mini') => {
        try {
            setUploadingId(slideId === 'event' ? 999 : (slideId === 'mini' ? 888 : slideId))
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `web/${slideId}-${Date.now()}.${fileExt}`

            const { data, error } = await supabase.storage
                .from('products')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName)

            if (slideId === 'event') {
                setSettings({ ...settings, event: { ...settings.event, image: publicUrl } })
            } else if (slideId === 'mini') {
                setSettings({ ...settings, event: { ...settings.event, mini_image: publicUrl } })
            } else {
                updateSlide(slideId as number, 'image', publicUrl)
            }
            showToast("Image mise à jour !", "success")
        } catch (err: any) {
            showToast(err.message, "error")
        } finally {
            setUploadingId(null)
        }
    }

    // --- Category Groups Management ---
    const addGroup = () => {
        const newGroup = {
            title: "Nouvel Univers",
            match: ["mot-clé"]
        };
        const currentGroups = settings.category_groups || [];
        setSettings({ ...settings, category_groups: [...currentGroups, newGroup] });
    };

    const loadDefaultGroups = () => {
        if (confirm("Attention: Cela va remplacer la configuration actuelle des univers. Continuer ?")) {
            setSettings({ ...settings, category_groups: DEFAULT_GROUPS });
        }
    };

    const removeGroup = (index: number) => {
        const newGroups = [...(settings.category_groups || [])];
        newGroups.splice(index, 1);
        setSettings({ ...settings, category_groups: newGroups });
    };

    const updateGroupTitle = (index: number, title: string) => {
        const newGroups = [...(settings.category_groups || [])];
        newGroups[index].title = title;
        setSettings({ ...settings, category_groups: newGroups });
    };

    const updateGroupMatch = (index: number, matchString: string) => {
        const newGroups = [...(settings.category_groups || [])];
        const matchArray = matchString.split(',').map(s => s.trim()).filter(Boolean);
        newGroups[index].match = matchArray;
        setSettings({ ...settings, category_groups: newGroups });
    };

    const addCategoryToGroup = (index: number, category: string) => {
        const newGroups = [...(settings.category_groups || [])];
        const currentMatches = newGroups[index].match || [];
        if (!currentMatches.includes(category)) {
            newGroups[index].match = [...currentMatches, category];
            setSettings({ ...settings, category_groups: newGroups });
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <RefreshCw className="w-10 h-10 text-shop animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen p-4 sm:p-10 space-y-6 sm:space-y-10 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="pl-14 lg:pl-0">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter shop-gradient-text flex items-center leading-none">
                        <Globe className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-shop" /> Gestion Web
                    </h1>
                    <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 sm:mt-1">Édition de Lolly Shop</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full lg:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-shop text-white rounded-xl sm:rounded-[24px] font-black uppercase text-[10px] sm:text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-shop/30 flex items-center justify-center"
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Publier sur le site
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    {/* CARROUSEL SECTION */}
                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-8 sm:mb-10 border-b border-white/5 pb-6">
                            <div className="flex items-center space-x-3">
                                <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Bannières d'accueil</h3>
                            </div>
                            <button onClick={addSlide} className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-shop/20 border border-white/10 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all">
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ajouter un slide</span>
                            </button>
                        </div>

                        <div className="space-y-8 sm:space-y-10">
                            {settings.slides.map((slide: any, index: number) => (
                                <div key={slide.id} className={`relative p-5 sm:p-8 bg-black/20 border ${slide.brand === 'LUXYA' ? 'border-red-500/30' : 'border-blue-500/30'} rounded-[24px] sm:rounded-[32px] hover:border-shop transition-all group`}>
                                    <div className="absolute -top-3 left-6 sm:left-8 flex items-center space-x-2">
                                        <span className={`px-3 sm:px-4 py-1 ${slide.brand === 'LUXYA' ? 'bg-red-600' : 'bg-blue-600'} text-white text-[8px] sm:text-[10px] font-black rounded-full uppercase shadow-lg`}>Slide {slide.brand}</span>
                                        <button onClick={() => removeSlide(slide.id)} className="p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100"><X className="w-3 h-3" /></button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2">Titre</label>
                                            <input value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2">Marque</label>
                                            <select value={slide.brand} onChange={e => updateSlide(slide.id, 'brand', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50">
                                                <option value="LUXYA">LUXYA (ROUGE)</option>
                                                <option value="HOMTEK">HOMTEK (BLEU)</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <div className="flex justify-between items-center ml-2">
                                                <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground">Image</label>
                                                <span className="text-[7px] font-black text-shop uppercase tracking-widest">Recommandé : 3000 x 1200 px</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-4">
                                                <div className="col-span-3">
                                                    <div className="relative h-24 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-shop/50 hover:bg-shop/5 transition-all">
                                                        {uploadingId === slide.id ? <RefreshCw className="w-6 h-6 text-shop animate-spin" /> : <>
                                                            <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Uploader</p>
                                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], slide.id)} />
                                                        </>}
                                                    </div>
                                                </div>
                                                <div className="relative h-24 rounded-xl bg-white/5 border border-white/10 overflow-hidden"><img src={slide.image} className="w-full h-full object-cover" /></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    {/* EVENT SECTION */}
                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-white/5 pb-6">
                            <div className="flex items-center space-x-3">
                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Événement Spécial</h3>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-2">Titre Annonce</label>
                                <input value={settings.event?.title || ""} onChange={e => setSettings({ ...settings, event: { ...settings.event, title: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-2">Description</label>
                                <textarea rows={2} value={settings.event?.description || ""} onChange={e => setSettings({ ...settings, event: { ...settings.event, description: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50 resize-none" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[8px] font-black uppercase text-muted-foreground">Grande Image (Accueil)</label>
                                    <span className="text-[7px] font-black text-shop uppercase tracking-widest">1500 x 600 px</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <div className="relative h-20 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-shop/50 hover:bg-shop/5 transition-all">
                                            {uploadingId === 999 ? <RefreshCw className="w-5 h-5 text-shop animate-spin" /> : <>
                                                <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'event')} />
                                            </>}
                                        </div>
                                    </div>
                                    <div className="relative h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-xl"><img src={settings.event?.image} className="w-full h-full object-cover" /></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[8px] font-black uppercase text-muted-foreground">Mini Image (Barre Amazon)</label>
                                    <span className="text-[7px] font-black text-shop uppercase tracking-widest">600 x 60 px</span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <div className="relative h-20 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-shop/50 hover:bg-shop/5 transition-all">
                                            {uploadingId === 888 ? <RefreshCw className="w-5 h-5 text-shop animate-spin" /> : <>
                                                <Upload className="w-4 h-4 text-muted-foreground mb-1" />
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'mini')} />
                                            </>}
                                        </div>
                                    </div>
                                    <div className="relative h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
                                        {settings.event?.mini_image ? <img src={settings.event?.mini_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/5 font-black text-[8px]">VIDE</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SETTINGS SECTION */}
                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center space-x-3 mb-6 sm:mb-8 border-b border-white/5 pb-6">
                            <Type className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Paramètres Généraux</h3>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-2 flex items-center"><MessageCircle className="w-3 h-3 mr-1 text-green-500" /> WhatsApp</label>
                                <input value={settings.whatsapp_number} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-muted-foreground ml-2">Adresse</label>
                                <textarea rows={2} value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50 resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* CATEGORY GROUPS SECTION (Univers) */}
                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-white/5 pb-6">
                            <div className="flex items-center space-x-3">
                                <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Configuration des Univers</h3>
                            </div>
                            <button onClick={addGroup} className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-shop/20 border border-white/10 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all">
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ajouter un Univers</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <p className="text-[10px] text-muted-foreground bg-white/5 p-4 rounded-xl border border-white/5">
                                Définissez ici les groupes de catégories qui apparaîtront dans la barre latérale du site.
                                Les catégories contenant les <b>mots-clés</b> spécifiés seront automatiquement classées dans l'univers correspondant.
                            </p>

                            {(settings.category_groups || []).map((group: any, index: number) => {
                                const isCollapsed = collapsedGroups.includes(index);
                                return (
                                    <div key={index} className="bg-white/5 border border-white/10 rounded-[20px] overflow-hidden hover:border-shop/30 transition-all group relative">
                                        <div
                                            className="p-6 flex items-center justify-between cursor-pointer"
                                            onClick={() => toggleGroupCollapse(index)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-lg bg-shop/10 flex items-center justify-center">
                                                    <Tags className="w-4 h-4 text-shop" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white">
                                                        {group.title || "Nouvel Univers"}
                                                    </h4>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                        {group.match?.length || 0} catégories associées
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={(e) => { e.stopPropagation(); removeGroup(index); }} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className={`p-1.5 rounded-lg bg-white/5 text-muted-foreground group-hover:text-white transition-all transform ${isCollapsed ? '' : 'rotate-180'}`}>
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        {!isCollapsed && (
                                            <div className="p-6 pt-0 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="h-px bg-white/5 w-full" />
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 space-y-2 mr-4">
                                                        <label className="text-[8px] font-black uppercase text-muted-foreground ml-2">Titre de l'Univers</label>
                                                        <input
                                                            value={group.title}
                                                            onChange={(e) => updateGroupTitle(index, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-shop/50"
                                                            placeholder="Ex: Beauté & Maquillage"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[8px] font-black uppercase text-muted-foreground ml-2">Mots-clés / Catégories (Modifiable)</label>
                                                        <textarea
                                                            value={group.match.join(', ')}
                                                            onChange={(e) => updateGroupMatch(index, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-shop/50 h-32 resize-none"
                                                            placeholder="Ex: rouge à lèvres, mascara, fond de teint..."
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-56 space-y-2">
                                                        <label className="text-[8px] font-black uppercase text-muted-foreground ml-2">Ajouter existante</label>
                                                        <div className="relative">
                                                            <select
                                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold focus:border-shop/50 outline-none text-white appearance-none cursor-pointer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    if (e.target.value) {
                                                                        addCategoryToGroup(index, e.target.value);
                                                                        e.target.value = ""; // Reset select
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">Sélectionner...</option>
                                                                {(() => {
                                                                    const allUsed = (settings.category_groups || []).flatMap((g: any) => g.match || []);
                                                                    return categories.filter(cat => !allUsed.includes(cat)).map((cat, i) => (
                                                                        <option key={i} value={cat} className="text-black">{cat}</option>
                                                                    ));
                                                                })()}
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </div>
                                                        </div>
                                                        <p className="text-[8px] text-muted-foreground leading-tight p-1">
                                                            Ajoutez une catégorie sans doublon.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(settings.category_groups || []).length === 0 && (
                                <div className="text-center py-8 opacity-30 text-xs font-black uppercase">Aucun univers configuré. Cliquez sur "Ajouter" pour commencer.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
