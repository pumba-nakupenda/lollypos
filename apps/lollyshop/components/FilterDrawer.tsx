'use client'

import React, { useState } from 'react'
import { X, Filter, RotateCcw, ChevronRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface FilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    categories: string[]
    brands: string[]
    activeFilters: any
}

export default function FilterDrawer({ isOpen, onClose, categories, brands, activeFilters }: FilterDrawerProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all' || value === 'false') {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        router.push(`/?${params.toString()}`)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] lg:hidden">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            {/* Drawer */}
            <div className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px]">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 rounded-tl-[40px]">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white">
                            <Filter className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter italic">Filtres</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Univers Section */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center">
                            Univers Lolly
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: 'Tout Lolly', val: 'all', color: 'bg-black' },
                                { label: 'Luxya Beauty', val: '1', color: 'bg-red-600' },
                                { label: 'Homtek Tech', val: '2', color: 'bg-blue-600' }
                            ].map((s) => (
                                <button
                                    key={s.val}
                                    onClick={() => updateFilter('shop', s.val)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${(activeFilters.shop || 'all') === s.val
                                        ? 'border-black bg-black text-white shadow-lg'
                                        : 'border-gray-50 bg-gray-50 text-gray-600 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-2 h-2 rounded-full mr-3 ${s.color}`} />
                                        <span className="text-xs font-black uppercase">{s.label}</span>
                                    </div>
                                    {(activeFilters.shop || 'all') === s.val && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Rayons Section */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Rayons</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => updateFilter('cat', 'all')}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${(activeFilters.cat || 'all') === 'all'
                                    ? 'bg-black text-white'
                                    : 'bg-gray-50 text-gray-500'
                                    }`}
                            >
                                Tous
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => updateFilter('cat', cat)}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilters.cat === cat
                                        ? 'bg-black text-white shadow-lg'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Brands Section */}
                    {brands && brands.length > 0 && (
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Marques</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => updateFilter('brand', 'all')}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${(activeFilters.brand || 'all') === 'all'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-50 text-gray-500'
                                        }`}
                                >
                                    Toutes
                                </button>
                                {brands.map((brand) => (
                                    <button
                                        key={brand}
                                        onClick={() => updateFilter('brand', brand)}
                                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeFilters.brand === brand
                                            ? 'bg-black text-white shadow-lg'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Budget Section */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Budget</h3>

                        {activeFilters.price?.includes('-') ? (
                            <div className="bg-black text-white p-6 rounded-3xl space-y-3 shadow-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase opacity-50">Gamme sélectionnée</span>
                                    <button onClick={() => updateFilter('price', 'all')} className="text-[10px] font-black uppercase text-red-400">Effacer</button>
                                </div>
                                <div className="text-lg font-black italic">
                                    {activeFilters.price.split('-').map((p: string) => Number(p).toLocaleString()).join(' - ')} <span className="text-xs not-italic font-bold opacity-50">CFA</span>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { label: 'Moins de 10.000', val: '0-10000' },
                                    { label: '10.000 - 50.000', val: '10000-50000' },
                                    { label: 'Plus de 50.000', val: '50000-200000' }
                                ].map((p) => (
                                    <button
                                        key={p.val}
                                        onClick={() => updateFilter('price', p.val)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${activeFilters.price === p.val
                                            ? 'border-black bg-black text-white shadow-lg'
                                            : 'border-gray-50 bg-gray-50 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <span className="text-xs font-black uppercase">{p.label} <span className="opacity-50 ml-1">CFA</span></span>
                                        {activeFilters.price === p.val && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-[9px] text-gray-400 mt-4 leading-relaxed">
                            Utilisez le curseur sur la version bureau pour une sélection précise.
                        </p>
                    </section>
                </div>

                {/* Footer Buttons */}
                <div className="p-8 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { router.push('/'); onClose(); }}
                        className="flex items-center justify-center space-x-2 py-4 border-2 border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                    >
                        <RotateCcw className="w-3 h-3" />
                        <span>Réinitialiser</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                        Appliquer
                    </button>
                </div>
            </div>
        </div>
    )
}
