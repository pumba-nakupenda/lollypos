'use client'

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ProductStoriesProps {
    products: any[];
}

export default function ProductStories({ products }: ProductStoriesProps) {
    // Filter only promo products and take up to 10
    const promoProducts = products
        .filter(p => p.promo_price && p.promo_price > 0)
        .slice(0, 12);

    if (promoProducts.length === 0) return null;

    return (
        <div className="w-full py-6 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Bon Plans du Jour</h3>
                    <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Live</span>
                    </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {promoProducts.map((product, idx) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            className="flex-shrink-0 flex flex-col items-center group"
                        >
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 mb-2"
                            >
                                <div className="w-full h-full rounded-full bg-white p-[2px]">
                                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-50 border border-gray-100">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                </div>

                                {/* Promo Badge */}
                                <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                                    -{Math.round((1 - product.promo_price / product.price) * 100)}%
                                </div>
                            </motion.div>
                            <span className="text-[9px] font-bold text-gray-900 truncate w-16 sm:w-20 text-center uppercase tracking-tighter">
                                {product.name.split(' ')[0]}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
