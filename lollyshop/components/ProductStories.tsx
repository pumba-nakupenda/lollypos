'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ProductStoriesProps {
    products: any[];
}

export default function ProductStories({ products }: ProductStoriesProps) {
    // 1. Process products: Identify Promos, Featured vs New Arrivals
    const processedProducts = products.map(p => {
        const hasPromo = p.promo_price && p.promo_price > 0 && p.price > 0;
        const isFeatured = p.is_featured === true;
        const discount = hasPromo ? Math.round((1 - p.promo_price / p.price) * 100) : 0;
        return { ...p, hasPromo, isFeatured, discount };
    });

    // 2. Sort: Promos first, then Featured, then Newest
    const displayProducts = [...processedProducts]
        .sort((a, b) => {
            if (a.hasPromo && !b.hasPromo) return -1;
            if (!a.hasPromo && b.hasPromo) return 1;
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return 0;
        })
        .slice(0, 15);

    if (displayProducts.length === 0) return null;

    return (
        <div className="w-full py-8 bg-white border-b border-gray-100 overflow-hidden">
            <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
                            <Sparkles className="w-5 h-5 text-[#fde700] fill-current" />
                        </div>
                        <h3 className="text-sm sm:text-lg font-black uppercase tracking-tighter italic text-gray-900">À la une <span className="text-lolly">aujourd'hui.</span></h3>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sélection Live</span>
                    </div>
                </div>

                <div className="flex gap-5 sm:gap-8 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {displayProducts.map((product) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            className="flex-shrink-0 flex flex-col items-center group relative"
                        >
                            <motion.div
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3.5px] mb-3 shadow-xl transition-all ${
                                    product.hasPromo 
                                    ? "bg-gradient-to-tr from-[#fde700] via-[#ff5f6d] to-[#ffc371]" 
                                    : product.isFeatured
                                    ? "bg-gradient-to-tr from-blue-400 via-purple-500 to-pink-500"
                                    : "bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-300"
                                }`}
                            >
                                <div className="w-full h-full rounded-full bg-white p-[2px]">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">
                                        {product.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <ShoppingBag className="w-8 h-8 text-gray-200" />
                                        )}
                                    </div>
                                </div>

                                {/* Dynamic Badge */}
                                {product.hasPromo ? (
                                    <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-lg animate-bounce">
                                        -{product.discount}%
                                    </div>
                                ) : product.isFeatured ? (
                                    <div className="absolute -bottom-1 -right-1 bg-lolly text-black text-[8px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-lg">
                                        BEST
                                    </div>
                                ) : (
                                    <div className="absolute -bottom-1 -right-1 bg-[#007185] text-white text-[7px] sm:text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-lg">
                                        NEW
                                    </div>
                                )}
                            </motion.div>
                            <div className="w-20 sm:w-24 text-center space-y-0.5">
                                <span className="block text-[10px] font-black text-gray-900 truncate uppercase tracking-tighter">
                                    {product.name.split(' ')[0]}
                                </span>
                                <span className={`block text-[7px] font-bold uppercase tracking-widest rounded-md py-0.5 ${
                                    product.hasPromo ? "text-red-600 bg-red-50" : product.isFeatured ? "text-lolly bg-yellow-50" : "text-[#007185] bg-cyan-50"
                                }`}>
                                    {product.hasPromo ? "OFFRE FLASH" : product.isFeatured ? "TOP VENTE" : "NOUVEAUTÉ"}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
