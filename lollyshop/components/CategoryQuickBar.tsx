'use client'

import React from 'react';
import Link from 'next/link';
import { Sparkles, Heart, Smartphone, Watch, Gift, Shirt, ShoppingBag, Zap } from 'lucide-react';

interface CategoryQuickBarProps {
    categories: string[];
}

export default function CategoryQuickBar({ categories }: CategoryQuickBarProps) {
    // Map icons to categories (simplified logic)
    const getIcon = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('maquillage') || c.includes('beauté')) return <Heart className="w-5 h-5 text-pink-500" />;
        if (c.includes('téléphone') || c.includes('tech')) return <Smartphone className="w-5 h-5 text-blue-500" />;
        if (c.includes('montre') || c.includes('bijoux')) return <Watch className="w-5 h-5 text-amber-500" />;
        if (c.includes('sac') || c.includes('accessoires')) return <ShoppingBag className="w-5 h-5 text-purple-500" />;
        if (c.includes('parfum')) return <Sparkles className="w-5 h-5 text-indigo-500" />;
        return <Gift className="w-5 h-5 text-green-500" />;
    };

    // Take top 8 categories
    const displayCats = categories.slice(0, 10);

    return (
        <div className="w-full bg-white border-b border-gray-100 py-4 overflow-hidden">
            <div className="max-w-[1500px] mx-auto px-4 overflow-x-auto no-scrollbar">
                <div className="flex space-x-6 sm:space-x-10 min-w-max items-center">
                    <Link href="/?sort=promo" className="flex flex-col items-center space-y-2 group shrink-0">
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <Zap className="w-6 h-6 text-red-600 fill-current" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">PROMOS</span>
                    </Link>

                    {displayCats.map((cat) => (
                        <Link 
                            key={cat} 
                            href={`/?cat=${cat}`}
                            className="flex flex-col items-center space-y-2 group shrink-0"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-gray-100">
                                {getIcon(cat)}
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 group-hover:text-black uppercase tracking-tighter truncate max-w-[80px]">
                                {cat}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
