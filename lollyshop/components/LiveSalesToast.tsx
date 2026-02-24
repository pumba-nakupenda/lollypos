'use client'

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, CheckCircle2, MapPin } from 'lucide-react';
import Image from 'next/image';

const FAKE_NAMES = ["Fatou", "Aminata", "Moussa", "Aïcha", "Cheikh", "Mariama", "Oumar", "Sokhna", "Ibrahima", "Khady"];
const FAKE_LOCATIONS = ["Dakar", "Saly", "Mbour", "Thiès", "Saint-Louis", "Plateau", "Almadies", "Point E", "Parcelles"];
const FAKE_ACTIONS = ["vient de commander", "a acheté", "s'est offert"];

// Placeholder images in case we don't fetch real ones immediately
const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?q=80&w=200", // iPhone
    "https://images.unsplash.com/photo-1596462502278-27bfdd403348?q=80&w=200", // Makeup
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200", // Watch
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200"  // Shoe
];

export default function LiveSalesToast() {
    const [isVisible, setIsVisible] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // Start loop
        const loop = () => {
            const randomDelay = Math.random() * (20000 - 8000) + 8000; // Random between 8s and 20s
            
            setTimeout(() => {
                const name = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
                const location = FAKE_LOCATIONS[Math.floor(Math.random() * FAKE_LOCATIONS.length)];
                const action = FAKE_ACTIONS[Math.floor(Math.random() * FAKE_ACTIONS.length)];
                const img = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
                
                setData({ name, location, action, img });
                setIsVisible(true);

                // Hide after 5 seconds
                setTimeout(() => setIsVisible(false), 5000);

                // Re-trigger loop
                loop();
            }, randomDelay);
        };

        // Initial start
        const initialTimer = setTimeout(loop, 5000); // Start 5s after load

        return () => clearTimeout(initialTimer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, x: -20 }}
                    className="fixed bottom-4 left-4 z-[9999] max-w-[320px] w-full"
                >
                    <div className="bg-white/90 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center space-x-4 hover:scale-105 transition-transform cursor-pointer">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                            <Image 
                                src={data.img} 
                                alt="Product" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-0.5">
                                <p className="text-[11px] font-black text-gray-900 truncate">
                                    {data.name} <span className="text-gray-400 font-medium">à</span> {data.location}
                                </p>
                                <CheckCircle2 className="w-3 h-3 text-green-500 fill-current/10" />
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                {data.action} <span className="font-bold text-lolly">un article</span>
                            </p>
                            <p className="text-[8px] text-gray-400 mt-1 flex items-center">
                                <MapPin className="w-2.5 h-2.5 mr-1" /> Vérifié il y a 2 min
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
