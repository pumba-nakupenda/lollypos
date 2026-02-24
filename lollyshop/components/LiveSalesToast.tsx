'use client'

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

const FAKE_NAMES = ["Fatou", "Aminata", "Moussa", "Aïcha", "Cheikh", "Mariama", "Oumar", "Sokhna", "Ibrahima", "Khady"];
const FAKE_LOCATIONS = ["Dakar", "Saly", "Mbour", "Thiès", "Saint-Louis", "Plateau", "Almadies", "Point E", "Parcelles"];
const FAKE_ACTIONS = ["vient de commander", "a acheté", "s'est offert"];

export default function LiveSalesToast() {
    const [isVisible, setIsVisible] = useState(false);
    const [data, setData] = useState<any>(null);
    const productsRef = useRef<any[]>([]);

    // Fetch real products with images on mount
    useEffect(() => {
        const supabase = createClient();
        supabase
            .from('products')
            .select('id, name, image, price')
            .neq('show_on_website', false)
            .not('image', 'is', null)
            .neq('image', '')
            .gt('stock', 0)
            .limit(50)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    productsRef.current = data;
                }
            });
    }, []);

    useEffect(() => {
        const loop = () => {
            const randomDelay = Math.random() * (20000 - 8000) + 8000;

            const timer = setTimeout(() => {
                const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
                const location = FAKE_LOCATIONS[Math.floor(Math.random() * FAKE_LOCATIONS.length)];
                const action = FAKE_ACTIONS[Math.floor(Math.random() * FAKE_ACTIONS.length)];

                // Use a real product if available
                const products = productsRef.current;
                let product = null;
                if (products.length > 0) {
                    product = products[Math.floor(Math.random() * products.length)];
                }

                setData({ name, location, action, product });
                setIsVisible(true);

                setTimeout(() => setIsVisible(false), 5000);
                loop();
            }, randomDelay);

            return timer;
        };

        const initialTimer = setTimeout(loop, 6000);
        return () => clearTimeout(initialTimer);
    }, []);

    if (!data) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, x: -20 }}
                    className="fixed bottom-4 left-4 z-[9999] max-w-[320px] w-full"
                >
                    <Link
                        href={data.product ? `/product/${data.product.id}` : '#'}
                        className="block bg-white/95 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-2xl flex items-center space-x-4 hover:scale-105 transition-transform cursor-pointer"
                    >
                        {/* Product image */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100 shadow-inner">
                            {data.product?.image ? (
                                <Image
                                    src={data.product.image}
                                    alt={data.product.name}
                                    fill
                                    className="object-contain p-1"
                                    sizes="56px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200 text-2xl">🛍️</div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-0.5">
                                <p className="text-[11px] font-black text-gray-900 truncate">
                                    {data.name} <span className="text-gray-400 font-medium">à</span> {data.location}
                                </p>
                                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                {data.action}{' '}
                                <span className="font-black text-gray-800 truncate block">
                                    {data.product?.name || 'un article'}
                                </span>
                            </p>
                            {data.product?.price && (
                                <p className="text-[10px] font-black text-lolly mt-0.5">
                                    {data.product.price.toLocaleString('fr-FR')} CFA
                                </p>
                            )}
                            <p className="text-[8px] text-gray-400 mt-0.5 flex items-center">
                                <MapPin className="w-2.5 h-2.5 mr-1 flex-shrink-0" /> Vérifié il y a 2 min
                            </p>
                        </div>
                    </Link>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
