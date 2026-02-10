'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Globe, Save, Image as ImageIcon, MessageCircle, Type, Layout, RefreshCw, Plus, Trash2, Upload, X, Sparkles } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/context/ToastContext'

export default function WebManagementPage() {
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaveLoading] = useState(false)
    const [uploadingId, setUploadingId] = useState<number | null>(null)
    
    const [generatingBanner, setGeneratingBanner] = useState(false)
    
    const [settings, setSettings] = useState<any>({
        hero_title: "Lolly Shop",
        hero_subtitle: "L'excellence de Luxya & Homtek",
        promo_banner: "BIENVENUE CHEZ LOLLY SHOP : L'EXCELLENCE AU SÉNÉGAL",
        whatsapp_number: "221772354747",
        address: "Fass delorme 13x22",
        slides: [
            { id: 1, title: "L'Univers Beauté", subtitle: "Luxya Exclusive", image: "https://images.unsplash.com/photo-1596462502278-27bfdc4033c8", brand: "LUXYA", color: "#ff4d8d" },
            { id: 2, title: "Le Futur Digital", subtitle: "Homtek Tech", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661", brand: "HOMTEK", color: "#0055ff" }
        ]
    })

    const handleGenerateBanner = async () => {
        try {
            setGeneratingBanner(true)
            const res = await fetch('http://127.0.0.1:3005/ai/generate-banner', { method: 'POST' })
            const data = await res.json()
            if (data.slogan) {
                setSettings({ ...settings, promo_banner: data.slogan })
                showToast("Nouveau slogan généré par l'IA !", "success")
            }
        } catch (err) {
            showToast("Erreur lors de la génération IA", "error")
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
                setSettings(data.content)
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleSave = async () => {
        try {
            setSaveLoading(true)
            const supabase = createClient()
            const { error } = await supabase
                .from('site_settings')
                .update({ content: settings, updated_at: new Date() })
                .eq('name', 'lolly_shop_config')

            if (error) throw error
            showToast("Site mis à jour avec succès !", "success")
        } catch (err: any) {
            showToast(err.message, "error")
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
            color: "#0055ff"
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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, slideId: number) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploadingId(slideId)
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `web/slide-${slideId}-${Date.now()}.${fileExt}`

            const { data, error } = await supabase.storage
                .from('products')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(fileName)

            updateSlide(slideId, 'image', publicUrl)
            showToast("Image uploadée !", "success")
        } catch (err: any) {
            showToast(err.message, "error")
        } finally {
            setUploadingId(null)
        }
    }

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
                        <Globe className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-shop" /> Admin Web
                    </h1>
                    <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 sm:mt-1">Édition de Lolly Shop</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full lg:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-shop text-white rounded-xl sm:rounded-[24px] font-black uppercase text-[10px] sm:text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-shop/30 flex items-center justify-center"
                >
                    {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Publier les modifications
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-8 sm:mb-10 border-b border-white/5 pb-6">
                            <div className="flex items-center space-x-3">
                                <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Carrousel</h3>
                            </div>
                            <button 
                                onClick={addSlide}
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-shop/20 border border-white/10 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Ajouter un slide</span>
                                <span className="sm:hidden">Ajouter</span>
                            </button>
                        </div>

                        <div className="space-y-8 sm:space-y-10">
                            {settings.slides.map((slide: any, index: number) => (
                                <div key={slide.id} className="relative p-5 sm:p-8 bg-black/20 border border-white/5 rounded-[24px] sm:rounded-[32px] hover:border-shop/30 transition-all group">
                                    <div className="absolute -top-3 left-6 sm:left-8 flex items-center space-x-2">
                                        <span className="px-3 sm:px-4 py-1 bg-shop text-white text-[8px] sm:text-[10px] font-black rounded-full uppercase">Slide #{index + 1}</span>
                                        <button 
                                            onClick={() => removeSlide(slide.id)}
                                            className="p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2">Titre du Slide</label>
                                            <input value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-5 text-sm font-bold outline-none focus:border-shop/50 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2">Marque (ex: LUXYA)</label>
                                            <input value={slide.brand} onChange={e => updateSlide(slide.id, 'brand', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-5 text-sm font-bold outline-none focus:border-shop/50 text-white" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2">Image du Slide</label>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="md:col-span-3">
                                                    <div className="relative h-24 sm:h-32 border-2 border-dashed border-white/10 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-shop/50 hover:bg-shop/5 transition-all">
                                                        {uploadingId === slide.id ? (
                                                            <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 text-shop animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mb-2" />
                                                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uploader une photo</p>
                                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, slide.id)} />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="relative h-24 sm:h-32 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
                                                    <img src={slide.image} alt="prev" className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-shop/20 bg-shop/5">
                        <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-shop/10 pb-6">
                            <div className="flex items-center space-x-3">
                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                                <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Bandeau Promo</h3>
                            </div>
                            <button 
                                onClick={handleGenerateBanner}
                                disabled={generatingBanner}
                                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-shop text-white rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                {generatingBanner ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>IA Générer</span>
                            </button>
                        </div>
                        <textarea 
                            value={settings.promo_banner || ""} 
                            onChange={e => setSettings({...settings, promo_banner: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-shop/50 text-white min-h-[80px]"
                            placeholder="MESSAGE DU BANDEAU DÉFILANT..."
                        />
                        <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
                            L'IA génère des slogans basés sur vos ventes et tendances actuelles.
                        </p>
                    </div>

                    <div className="glass-panel p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border-white/5 bg-white/[0.01]">
                        <div className="flex items-center space-x-3 mb-6 sm:mb-8 border-b border-white/5 pb-6">
                            <Type className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                            <h3 className="text-base sm:text-lg font-black uppercase tracking-tighter">Paramètres</h3>
                        </div>

                        <div className="space-y-5 sm:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2 flex items-center">
                                    <MessageCircle className="w-3 h-3 mr-1.5 text-green-500" /> WhatsApp Boutique
                                </label>
                                <input value={settings.whatsapp_number} onChange={e => setSettings({...settings, whatsapp_number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-5 text-sm font-bold outline-none focus:border-shop/50 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] sm:text-[9px] font-black uppercase text-muted-foreground ml-2">Adresse de Siège</label>
                                <textarea rows={2} value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-5 text-sm font-bold outline-none focus:border-shop/50 resize-none text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] border-shop/20 bg-shop/5 text-center relative overflow-hidden">
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-shop mb-3">Statut</p>
                        <div className="flex items-center justify-center space-x-3 text-white">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-ping" />
                            <span className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">SITE LIVE</span>
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-muted-foreground font-bold mt-4 leading-relaxed uppercase tracking-tighter">
                            Modifications en direct
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}