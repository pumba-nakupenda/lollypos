'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleCategoryGroupProps {
    title: string;
    categories: string[];
    shopFilter: string;
    catFilter: string;
    brandFilter: string;
    priceFilter: string;
    onlyInStock: string;
    sort: string;
}

export default function CollapsibleCategoryGroup({
    title,
    categories,
    shopFilter,
    catFilter,
    brandFilter,
    priceFilter,
    onlyInStock,
    sort
}: CollapsibleCategoryGroupProps) {
    // Expand by default if any category inside is selected
    const isAnySelected = categories.includes(catFilter);
    const [isOpen, setIsOpen] = useState(isAnySelected);

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between group cursor-pointer"
            >
                <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isOpen || isAnySelected ? 'text-gray-900' : 'text-gray-400'} group-hover:text-black`}>
                    {title}
                </h4>
                {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-black transition-colors" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-black transition-colors" />
                )}
            </button>

            {isOpen && (
                <div className="flex lg:flex-col gap-2 pl-2 border-l-2 border-gray-100 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {categories.map(cat => (
                        <Link
                            key={cat}
                            href={`/?cat=${cat}&shop=${shopFilter}&brand=${brandFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`}
                            className={`block text-[11px] font-bold whitespace-nowrap transition-colors ${catFilter === cat ? 'text-[#0055ff] lg:translate-x-1' : 'text-gray-500 hover:text-black'}`}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
