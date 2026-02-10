'use client'

import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Star, Zap, Eye, Flame, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductDetailsModal from './ProductDetailsModal';
import { API_URL } from '@/utils/api';

export default function ProductCard({ product }: { product: any }) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const trackView = async () => {
        try {
            await fetch(`${API_URL}/products/${product.id}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shopId: product.shop_id })
            });
        } catch (e) {}
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        trackView();
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOutOfStock) {
            addToCart(product);
            trackView();
        }
    };
    
    const shopName = product.shop_id === 1 ? "Luxya" : "Homtek";
    const shopColor = product.shop_id === 1 ? "bg-red-500" : "bg-blue-600";
    const hasPromo = product.promo_price && product.promo_price > 0 && Number(product.promo_price) < Number(product.price);
    const isFavorite = isInWishlist(product.id);

    // FOMO Logic
    const stock = Number(product.stock);
    const isLowStock = stock > 0 && stock <= 5;
    const isOutOfStock = stock <= 0 && product.type !== 'service';

    // Calculate percentage discount
    const discountPercent = hasPromo 
        ? Math.round(((Number(product.price) - Number(product.promo_price)) / Number(product.price)) * 100)
        : 0;

    // Fake but deterministic live stats for FOMO
    const viewingCount = (product.id % 15) + 3;
    const soldCount = (product.id % 20) + 5;

    return (
        <>
            <div 
                className="w-full flex-shrink-0 snap-start group bg-white rounded-[40px] border border-transparent hover:border-gray-100 transition-all duration-500 overflow-hidden"
            >
                <div className="relative aspect-[3/4] overflow-hidden m-3 rounded-[32px] bg-gray-50 transition-all duration-700">
                    
                    {/* Top Status Area */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
                        <div className="flex flex-col gap-2">
                            <div className={`px-3 py-1 rounded-full text-[6px] font-black uppercase tracking-[0.2em] text-white shadow-lg pointer-events-auto ${shopColor}`}>
                                {shopName}
                            </div>
                            {isLowStock && (
                                <div className="px-2 py-1 bg-orange-500 text-white text-[6px] font-black uppercase rounded-lg shadow-lg flex items-center animate-pulse pointer-events-auto">
                                    <Flame className="w-2 h-2 mr-1" /> Plus que {stock} !
                                </div>
                            )}
                        </div>

                        {hasPromo && (
                            <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
                                <div className="px-3 py-1 bg-[#0055ff] text-white text-[6px] font-black uppercase rounded-full shadow-lg flex items-center">
                                    <Zap className="w-2 h-2 mr-1 fill-white" /> Flash Sale
                                </div>
                                <div className="px-2 py-1 bg-red-500 text-white text-[8px] font-black rounded-lg shadow-xl rotate-3">
                                    -{discountPercent}%
                                </div>
                            </div>
                        )}
                    </div>

                    {product.image ? (
                        <Image onClick={handleOpenModal} src={product.image} alt={product.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                    ) : (
                        <div onClick={handleOpenModal} className="w-full h-full flex items-center justify-center text-gray-100 bg-gray-100">
                            <ShoppingBag className="w-16 h-16" />
                        </div>
                    )}

                    {/* Live Viewing FOMO */}
                    <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[6px] font-black uppercase rounded-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-2 h-2 mr-1 text-[#0055ff]" /> {viewingCount} personnes regardent
                    </div>

                    {/* Central Interaction Overlay - Always visible on mobile, hover on desktop */}
                    <div className="absolute inset-0 bg-black/5 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                        <button 
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all lg:transform lg:translate-y-4 lg:group-hover:translate-y-0 duration-500 delay-75 shadow-2xl ${isFavorite ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-400 hover:text-pink-500 hover:scale-110'}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(); }}
                            className="w-12 h-12 bg-white/90 text-gray-800 rounded-full flex items-center justify-center hover:bg-[#0055ff] hover:text-white hover:scale-110 transition-all lg:transform lg:translate-y-4 lg:group-hover:translate-y-0 duration-500 shadow-2xl"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>

                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase rounded-xl">Sold Out</span>
                        </div>
                    )}
                </div>

                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-1">
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">{product.category || 'Premium'}</span>
                            {stock > 5 && (
                                <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-green-600 flex items-center">
                                    <CheckCircle2 className="w-2 sm:w-2.5 h-2 sm:h-2.5 mr-1" /> En stock
                                </span>
                            )}
                        </div>
                        <h3 className="text-xs sm:text-sm font-extrabold tracking-tight truncate text-gray-900 uppercase group-hover:text-[#0055ff] transition-colors">{product.name}</h3>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center bg-gray-50/50 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-100/50 transition-colors group-hover:bg-white group-hover:border-gray-200">
                        {hasPromo ? (
                            <div className="flex flex-col items-center">
                                <span className="text-[9px] sm:text-[10px] text-gray-400 line-through font-bold mb-0.5">{Number(product.price).toLocaleString()}</span>
                                <p className="text-lg sm:text-xl font-black text-[#0044ee] tracking-tighter leading-none">
                                    {Number(product.promo_price).toLocaleString()} <span className="text-[8px] sm:text-[10px] font-bold ml-0.5 uppercase">CFA</span>
                                </p>
                            </div>
                        ) : (
                            <p className="text-lg sm:text-xl font-black text-gray-900 tracking-tighter leading-none">
                                {Number(product.price).toLocaleString()} <span className="text-[8px] sm:text-[10px] font-bold ml-0.5 uppercase text-gray-400">CFA</span>
                            </p>
                        )}
                    </div>

                    <button 
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-[20px] font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center justify-center transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-[#0055ff] shadow-lg active:scale-95'}`}
                    >
                        <ShoppingCart className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-2" /> 
                        {isOutOfStock ? 'Épuisé' : 'Acheter'}
                    </button>
                </div>
            </div>

            <ProductDetailsModal 
                product={product} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </>
    );
}