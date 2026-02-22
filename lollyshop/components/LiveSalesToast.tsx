'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, Sparkles, MapPin } from 'lucide-react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';

const NAMES = ["Habib", "Mariama", "Cheikh", "Awa", "Abdoulaye", "Fatou", "Moussa", "Ndeye", "Ibrahima", "Khady"];
const CITIES = ["Dakar", "Thiès", "Saint-Louis", "Rufisque", "Ziguinchor", "Mbour", "Kaolack", "Touba"];

export default function LiveSalesToast() {
    const [products, setProducts] = useState<any[]>([]);
    const [currentSale, setCurrentSale] = useState<any | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Initialize Supabase browser client
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, image, shop_id')
                .eq('show_on_website', true)
                .limit(20);

            if (data && !error) {
                setProducts(data);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        if (products.length === 0) return;

        const showRandomSale = () => {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
            const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
            const type = randomProduct.shop_id === 1 ? 'luxya' : 'homtek';

            setCurrentSale({
                name: randomName,
                city: randomCity,
                product: randomProduct.name,
                image: randomProduct.image,
                time: "il y a quelques minutes",
                type: type,
                id: randomProduct.id
            });
            setIsVisible(true);

            // Hide after 6 seconds
            setTimeout(() => {
                setIsVisible(false);
            }, 6000);
        };

        // First appearance after 10 seconds
        const initialTimer = setTimeout(showRandomSale, 10000);

        // Then repeat every 45-60 seconds
        const interval = setInterval(() => {
            showRandomSale();
        }, Math.random() * (60000 - 45000) + 45000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [products]);

    return (
        <AnimatePresence>
            {isVisible && currentSale && (
                <motion.div
                    initial={{ opacity: 0, x: -50, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.2 } }}
                    className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[200] max-w-[320px] w-full"
                >
                    <a href={`/product/${currentSale.id}`} className="block">
                        <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-3 flex items-center gap-4 overflow-hidden relative group">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />

                            {/* Product Thumbnail */}
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-gray-50`}>
                                {currentSale.image ? (
                                    <Image src={currentSale.image} alt={currentSale.product} width={56} height={56} className="object-cover" />
                                ) : (
                                    <div className={`${currentSale.type === 'luxya' ? 'text-pink-500' : 'text-blue-500'}`}>
                                        {currentSale.type === 'luxya' ? <Sparkles className="w-7 h-7" /> : <ShoppingBag className="w-7 h-7" />}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-0.5 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" /> {currentSale.city}
                                </p>
                                <p className="text-xs text-gray-900 font-bold leading-snug truncate">
                                    <span className="text-black font-black">{currentSale.name}</span> vient d'acheter <span className={currentSale.type === 'luxya' ? 'text-pink-600' : 'text-blue-600'}>{currentSale.product}</span>
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-[10px] font-medium text-gray-400 italic">{currentSale.time}</span>
                                    <div className="flex items-center">
                                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400 mr-0.5" />
                                        <span className="text-[9px] font-black">5.0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Accent Line */}
                            <div className={`absolute top-0 left-0 right-0 h-1 ${currentSale.type === 'luxya' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                        </div>
                    </a>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
