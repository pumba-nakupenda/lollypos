'use client'

import React from 'react';
import { Search, Tags, Sparkles, LayoutDashboard, Plus } from 'lucide-react';
import Image from 'next/image';
import CustomDropdown from '@/components/CustomDropdown';
import ExpiryBadge from '@/components/ExpiryBadge';

interface ProductGridProps {
    products: any[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    brands: string[];
    selectedBrand: string;
    setSelectedBrand: (val: string) => void;
    addToCart: (p: any) => void;
    imageErrors: Record<number, boolean>;
    setImageErrors: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}

export default function ProductGrid({
    products, loading, searchQuery, setSearchQuery,
    categories, selectedCategory, setSelectedCategory,
    brands, selectedBrand, setSelectedBrand,
    addToCart, imageErrors, setImageErrors
}: ProductGridProps) {

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Toutes' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'Toutes' || p.brand === selectedBrand;
        return matchesSearch && matchesCategory && matchesBrand && p.show_on_pos !== false;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-4">
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-shop transition-colors" />
                    <input
                        type="text"
                        placeholder="Chercher un produit par nom..."
                        className="w-full h-16 sm:h-20 bg-white/5 border border-white/10 rounded-[24px] sm:rounded-3xl pl-16 pr-6 text-sm font-bold focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30 text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomDropdown
                        label="Rayon / Catégorie"
                        options={categories.map(cat => ({
                            label: cat,
                            value: cat,
                            icon: <Tags className="w-3.5 h-3.5" />
                        }))}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="Toutes les catégories"
                    />

                    {brands.length > 1 && (
                        <CustomDropdown
                            label="Marque"
                            options={brands.map(brand => {
                                const count = brand === 'Toutes'
                                    ? products.filter(p => p.show_on_pos !== false).length
                                    : products.filter(p => p.brand === brand && p.show_on_pos !== false).length;
                                return {
                                    label: `${brand} (${count})`,
                                    value: brand,
                                    icon: <Sparkles className="w-3.5 h-3.5" />
                                };
                            })}
                            value={selectedBrand}
                            onChange={setSelectedBrand}
                            placeholder="Toutes les marques"
                        />
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-8">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-white/5 rounded-[32px] sm:rounded-[40px] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-8 pb-32">
                    {filteredProducts.map(p => {
                        const isOutOfStock = p.stock <= 0 && p.type !== 'service';
                        return (
                            <button
                                key={p.id}
                                onClick={() => addToCart(p)}
                                disabled={isOutOfStock}
                                className={`group relative bg-white/[0.03] border border-white/5 rounded-[32px] sm:rounded-[40px] p-4 sm:p-6 text-left hover:bg-white/[0.08] hover:border-shop/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 overflow-hidden shadow-lg ${isOutOfStock ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                            >
                                <div className="relative aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden mb-4 sm:mb-6 bg-black/20">
                                    {p.image && !imageErrors[p.id] ? (
                                        <Image
                                            src={p.image}
                                            alt={p.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            onError={() => setImageErrors(prev => ({ ...prev, [p.id]: true }))}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <LayoutDashboard className="w-8 h-8 text-white/10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <ExpiryBadge expiryDate={p.expiry_date} />
                                    </div>
                                </div>
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center space-x-2">
                                        {p.brand && <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-shop/10 text-shop rounded border border-shop/20">{p.brand}</span>}
                                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">{p.category}</p>
                                    </div>
                                    <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{p.name}</h3>
                                    <div className="flex items-center justify-between pt-2 sm:pt-4">
                                        <p className="text-sm sm:text-lg font-black text-white">{Number(p.price).toLocaleString()} <span className="text-[10px] text-muted-foreground ml-1">CFA</span></p>
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-shop group-hover:text-white transition-all">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${p.stock <= 5 ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'
                                        }`}>
                                        Stock: {p.stock}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
