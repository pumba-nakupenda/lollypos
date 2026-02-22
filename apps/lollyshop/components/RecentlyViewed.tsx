'use client'

import React from 'react';
import { useRecentlyViewed } from '@/context/RecentlyViewedContext';
import Image from 'next/image';
import Link from 'next/link';
import { History } from 'lucide-react';

export default function RecentlyViewed() {
    const { recentlyViewed } = useRecentlyViewed();

    if (recentlyViewed.length === 0) return null;

    return (
        <div className="mt-20 border-t border-gray-100 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-gray-50 rounded-xl">
                    <History className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Vus récemment</h3>
            </div>

            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                {recentlyViewed.map((p: any) => (
                    <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="flex-shrink-0 w-[140px] sm:w-[180px] group"
                    >
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm mb-3 group-hover:shadow-md transition-shadow">
                            <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-contain p-4 group-hover:scale-105 transition-transform"
                            />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-gray-900 truncate mb-1">
                            {p.name}
                        </h4>
                        <p className="text-[11px] font-black text-[#0055ff]">
                            {Number(p.price).toLocaleString()} CFA
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
