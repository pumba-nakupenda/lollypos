'use client'

import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingQuickBuyProps {
    product: any;
    onAdd: () => void;
    price: number;
}

export default function FloatingQuickBuy({ product, onAdd, price }: FloatingQuickBuyProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 500px or so
            if (window.scrollY > 600) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-[150] md:hidden p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                >
                    <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 truncate max-w-[150px]">
                                {product.name}
                            </span>
                            <span className="text-lg font-black text-[#0055ff]">
                                {price.toLocaleString()} CFA
                            </span>
                        </div>
                        <button
                            onClick={onAdd}
                            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 active:scale-95 transition-transform"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Acheter
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
