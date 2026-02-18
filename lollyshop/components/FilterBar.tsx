'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronDown, ArrowUpDown, CheckCircle2, Filter } from 'lucide-react'
import FilterDrawer from './FilterDrawer'


interface FilterBarProps {
    categories: string[]
    resultsCount: number
    brands: string[]
}

export default function FilterBar({ categories, resultsCount, brands }: FilterBarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const [q, setQ] = useState(searchParams.get('q') || '')
    const [shop, setShop] = useState(searchParams.get('shop') || 'all')
    const [cat, setCat] = useState(searchParams.get('cat') || 'all')
    const [brand, setBrand] = useState(searchParams.get('brand') || 'all')
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
    const [inStock, setInStock] = useState(searchParams.get('stock') === 'true')

    useEffect(() => {
        const timer = setTimeout(() => {
            if (q !== (searchParams.get('q') || '')) updateFilters({ q })
        }, 400)
        return () => clearTimeout(timer)
    }, [q])

    const updateFilters = (updates: any) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.keys(updates).forEach(key => {
            if (updates[key] === 'all' || updates[key] === '' || updates[key] === false) {
                params.delete(key)
            } else {
                params.set(key, updates[key])
            }
        })
        startTransition(() => {
            router.push(`/?${params.toString()}`, { scroll: false })
        })
    }

    const removeFilter = (key: string) => {
        if (key === 'q') setQ('')
        if (key === 'shop') setShop('all')
        if (key === 'cat') setCat('all')
        if (key === 'brand') setBrand('all')
        if (key === 'stock') setInStock(false)
        updateFilters({ [key]: 'all' })
    }

    const activeFilters = []
    if (searchParams.get('q')) activeFilters.push({ key: 'q', label: `"${searchParams.get('q')}"` })
    if (shop !== 'all') activeFilters.push({ key: 'shop', label: shop === '1' ? 'Luxya' : 'Homtek' })
    if (cat !== 'all') activeFilters.push({ key: 'cat', label: cat })
    if (brand !== 'all') activeFilters.push({ key: 'brand', label: brand })
    if (inStock) activeFilters.push({ key: 'stock', label: 'En Stock' })

    const priceRange = searchParams.get('price') || ''
    if (priceRange) {
        if (priceRange.includes('-')) {
            activeFilters.push({ key: 'price', label: `${priceRange.replace('-', ' - ')} CFA` })
        } else {
            const labels: any = { low: '< 10k', mid: '10k - 50k', high: '> 50k' }
            activeFilters.push({ key: 'price', label: labels[priceRange] || priceRange })
        }
    }

    return (
        <div className="w-full space-y-4" suppressHydrationWarning>
            {/* Mobile Filter Button */}
            <div className="lg:hidden flex items-center justify-between mb-4">
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                    <Filter className="w-4 h-4" />
                    <span>Filtrer & Trier</span>
                </button>
                <div className="text-[10px] font-bold uppercase text-gray-400">
                    {resultsCount} articles
                </div>
            </div>

            <div className="hidden lg:block bg-white rounded-[32px] shadow-2xl shadow-black/5 border border-gray-100 p-3">
                <div className="flex flex-col lg:flex-row gap-3">

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isPending ? 'text-[#0055ff] animate-pulse' : 'text-gray-300'}`} />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Rechercher..."
                            className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#0055ff]/10 transition-all"
                        />
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap gap-2">
                        {/* Shop */}
                        <div className="relative min-w-[120px]">
                            <select value={shop} onChange={(e) => { setShop(e.target.value); setCat('all'); updateFilters({ shop: e.target.value, cat: 'all' }); }} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                                <option value="all">Boutique</option>
                                <option value="1">Luxya</option>
                                <option value="2">Homtek</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>

                        {/* Category */}
                        <div className="relative min-w-[150px]">
                            <select value={cat} onChange={(e) => { setCat(e.target.value); updateFilters({ cat: e.target.value }); }} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                                <option value="all">Catégorie</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>

                        {/* Brand */}
                        <div className="relative min-w-[150px]">
                            <select value={brand} onChange={(e) => { setBrand(e.target.value); updateFilters({ brand: e.target.value }); }} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                                <option value="all">Marque</option>
                                {brands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>

                        {/* Sort */}
                        <div className="relative min-w-[140px]">
                            <select value={sort} onChange={(e) => { setSort(e.target.value); updateFilters({ sort: e.target.value }); }} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 pr-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                                <option value="newest">Nouveautés</option>
                                <option value="price_asc">Prix croissant</option>
                                <option value="price_desc">Prix décroissant</option>
                            </select>
                            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        </div>

                        {/* Stock Toggle */}
                        <button
                            onClick={() => { const newState = !inStock; setInStock(newState); updateFilters({ stock: newState }); }}
                            className={`flex items-center px-4 rounded-xl transition-all border ${inStock ? 'bg-[#0055ff]/10 border-[#0055ff] text-[#0055ff]' : 'bg-gray-50 border-transparent text-gray-400 hover:text-black'}`}
                        >
                            <CheckCircle2 className={`w-4 h-4 mr-2 ${inStock ? 'fill-[#0055ff] text-white' : ''}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">En Stock</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 mr-2">{resultsCount} résultats pour :</span>
                    {activeFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => removeFilter(f.key)}
                            className="flex items-center bg-black text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-[#0055ff] transition-all group"
                        >
                            {f.label}
                            <X className="w-3 h-3 ml-2 text-gray-500 group-hover:text-white" />
                        </button>
                    ))}
                    <button onClick={() => { setQ(''); setShop('all'); setCat('all'); setBrand('all'); setInStock(false); router.push('/') }} className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline ml-2">
                        Tout effacer
                    </button>
                </div>
            )}

            <FilterDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                categories={categories}
                brands={brands}
                activeFilters={{
                    shop: searchParams.get('shop'),
                    cat: searchParams.get('cat'),
                    brand: searchParams.get('brand'),
                    price: searchParams.get('price')
                }}
            />
        </div>
    )
}