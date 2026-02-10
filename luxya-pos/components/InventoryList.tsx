'use client'

import React, { useState, useMemo } from 'react'
import { Package, Edit2, Search, Filter, Tag, AlertTriangle, CheckCircle2, X, Tags, Trash2, Calendar, ShoppingCart, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import EditProductModal from './EditProductModal'
import CustomDropdown from './CustomDropdown'
import ExpiryBadge from './ExpiryBadge'
import { SITE_URL, API_URL } from '@/utils/api'

interface InventoryListProps {
    products: any[]
}

export default function InventoryList({ products }: InventoryListProps) {
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const siteUrl = SITE_URL; // Base URL for lollyshop

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('Toutes')
    const [stockStatus, setStockStatus] = useState('all')

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'Général'))
        return ['Toutes', ...Array.from(cats)]
    }, [products])

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
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())

            const matchesCategory = selectedCategory === 'Toutes' || p.category === selectedCategory

            let matchesStatus = true
            if (p.type === 'service') {
                // Services are always "in stock" conceptually, but we hide them if filtering specifically for stock alerts
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

    return (
        <div className="space-y-8">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center px-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Recherche</p>
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
                            placeholder="Nom, référence ou catégorie..."
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
            </div>

            {/* Product List */}
            <div className="grid gap-4 sm:gap-6">
                {filteredProducts.length === 0 ? (
                    <div className="glass-panel p-12 sm:p-20 rounded-[32px] sm:rounded-[40px] text-center border-dashed border-white/5 bg-white/[0.01]">
                        <Package className="mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-4 text-muted-foreground opacity-20" />
                        <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-muted-foreground">Aucun produit ne correspond</p>
                    </div>
                ) : (
                    filteredProducts.map((product: any) => (
                        <div
                            key={product.id}
                            onClick={() => handleEdit(product)}
                            className="glass-card group p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] hover:border-shop/30 flex flex-col lg:flex-row lg:items-center justify-between transition-all active:scale-[0.98] cursor-pointer gap-4 sm:gap-6"
                        >
                            <div className="flex items-center space-x-4 sm:space-x-6">
                                <div className="h-14 w-14 sm:h-16 sm:w-16 glass-panel rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden bg-white/5 shrink-0">
                                    {product.image ? (
                                        <Image
                                            className="h-full w-full object-cover transition-transform lg:group-hover:scale-110"
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            sizes="64px"
                                        />
                                    ) : (
                                        <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white/10" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-base sm:text-lg font-bold truncate group-hover:text-shop transition-colors text-white uppercase">{product.name}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-shop/70">
                                            {product.category || 'Général'}
                                        </span>
                                        {product.type === 'service' && <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Service</span>}
                                        
                                        <div className="flex items-center space-x-1.5 sm:ml-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${product.show_on_pos !== false ? 'bg-green-400' : 'bg-red-400'}`} title="Caisse" />
                                            <div className={`w-1.5 h-1.5 rounded-full ${product.show_on_website !== false ? 'bg-blue-400' : 'bg-red-400/30'}`} title="Site" />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <ExpiryBadge expiryDate={product.expiry_date} className="text-[8px] sm:text-[9px]" showIcon={true} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end lg:space-x-12 border-t lg:border-t-0 border-white/5 pt-4 lg:pt-0">
                                <div className="text-left lg:text-right">
                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Prix Public</p>
                                    {product.promo_price && product.promo_price > 0 && product.promo_price < product.price ? (
                                        <div className="flex flex-col items-start lg:items-end">
                                            <span className="text-[8px] sm:text-[10px] text-muted-foreground line-through font-bold">{product.price.toLocaleString()}</span>
                                            <p className="text-lg sm:text-xl font-black text-[#0055ff] tracking-tighter">{product.promo_price.toLocaleString()} <span className="text-[8px] sm:text-[10px] uppercase">CFA</span></p>
                                        </div>
                                    ) : (
                                        <p className="text-lg sm:text-xl font-black text-shop tracking-tighter">{product.price.toLocaleString()} <span className="text-[8px] sm:text-[10px] uppercase">CFA</span></p>
                                    )}
                                </div>

                                <div className="text-right lg:min-w-[120px]">
                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Stock / État</p>
                                    <div className={`px-3 sm:px-4 py-1.5 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest inline-block border ${product.type === 'service'
                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        : product.stock > (product.min_stock || 2)
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : product.stock > 0
                                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                        {product.type === 'service' ? 'Prestation' : product.stock > 0 ? `${product.stock} Unités` : 'Rupture'}
                                    </div>
                                </div>

                                <div className="hidden lg:flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <Link href={`/sales?shopId=${product.shop_id}&q=${encodeURIComponent(product.name)}`} onClick={(e) => e.stopPropagation()} className="p-3 glass-panel rounded-xl hover:bg-shop/10 hover:text-shop transition-all" title="Voir en Caisse"><ShoppingCart className="w-4 h-4" /></Link>
                                    {(product.shop_id === 1 || product.shop_id === 2) && (<a href={`${siteUrl}/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-3 glass-panel rounded-xl hover:bg-blue-500/10 hover:text-blue-400 transition-all" title="Voir sur le Site"><ExternalLink className="w-4 h-4" /></a>)}
                                    <div className="p-3 glass-panel rounded-xl hover:bg-shop/10 hover:text-shop transition-all"><Edit2 className="w-4 h-4" /></div>
                                    <div onClick={(e) => handleDelete(e, product.id)} className="p-3 glass-panel rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></div>
                                </div>
                            </div>

                            {/* Mobile Action Buttons (visible only on small screens) */}
                            <div className="flex lg:hidden items-center justify-between gap-2 border-t border-white/5 pt-4">
                                <div className="flex gap-2">
                                    <Link href={`/sales?shopId=${product.shop_id}&q=${encodeURIComponent(product.name)}`} onClick={(e) => e.stopPropagation()} className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted-foreground"><ShoppingCart className="w-4 h-4" /></Link>
                                    {(product.shop_id === 1 || product.shop_id === 2) && (<a href={`${siteUrl}/?q=${encodeURIComponent(product.name)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-3 bg-white/5 border border-white/10 rounded-xl text-muted-foreground"><ExternalLink className="w-4 h-4" /></a>)}
                                </div>
                                <div className="flex gap-2">
                                    <div className="p-3 bg-shop/10 border border-shop/20 rounded-xl text-shop"><Edit2 className="w-4 h-4" /></div>
                                    <div onClick={(e) => handleDelete(e, product.id)} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"><Trash2 className="w-4 h-4" /></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedProduct && (
                <EditProductModal
                    product={selectedProduct}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}