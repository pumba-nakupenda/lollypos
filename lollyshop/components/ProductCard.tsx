'use client'

import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Star, Zap, Eye, Flame, CheckCircle2, Heart } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductDetailsModal from './ProductDetailsModal';
import { API_URL } from '@/utils/api';

export default function ProductCard({ product }: { product: any }) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [added, setAdded] = useState(false);
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

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
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            trackView();
        }
    };
    
    const shopName = product.shop_id === 1 ? "Luxya" : "Homtek";
    const shopColor = product.shop_id === 1 ? "text-pink-500" : "text-lolly";
    const hasPromo = product.promo_price && product.promo_price > 0 && Number(product.promo_price) < Number(product.price);
    const isFavorite = isInWishlist(product.id);

    const isNew = mounted && new Date(product.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    const isBestSeller = product.sales_count > 10; // Seuil à ajuster

    const stock = Number(product.stock);
    const isLowStock = stock > 0 && stock <= 5;
    const isOutOfStock = stock <= 0 && product.type !== 'service';

    return (
        <>
            <div className="bg-white flex flex-col h-full hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden border border-gray-200/60 relative group">
                
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-white p-4 cursor-pointer" onClick={handleOpenModal}>
                    {product.image ? (
                        <Image 
                            src={product.image} 
                            alt={product.name} 
                            fill 
                            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-100"><ShoppingBag className="w-16 h-16" /></div>
                    )}

                    {/* Quick Fav */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                        className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 ${isFavorite ? 'bg-pink-500 text-white shadow-lg' : 'bg-white/80 text-gray-300 hover:text-pink-500 hover:shadow-md'}`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                    </button>

                    {/* Badges Area - More compact on mobile */}
                    <div className="absolute top-1 sm:top-2 left-0 z-20 flex flex-col gap-0.5 sm:gap-1">
                        {hasPromo && (
                            <div className="bg-red-600 text-white px-1.5 py-0.5 text-[7px] sm:text-[9px] font-black uppercase rounded-r shadow-md">
                                Promo
                            </div>
                        )}
                        {isBestSeller && (
                            <div className="bg-[#e47911] text-white px-1.5 py-0.5 text-[7px] sm:text-[9px] font-black uppercase rounded-r shadow-md">
                                Top Vente
                            </div>
                        )}
                        {isNew && (
                            <div className="bg-[#007185] text-white px-1.5 py-0.5 text-[7px] sm:text-[9px] font-black uppercase rounded-r shadow-md">
                                Nouveau
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-2 sm:p-4 flex flex-col flex-1">
                    <div className="flex-1 space-y-1 sm:space-y-1.5">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-widest ${shopColor}`}>{shopName}</span>
                            <div className="flex items-center space-x-1">
                                <div className="flex text-[#FF9900] scale-75 sm:scale-100 origin-left">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} 
                                            className={`w-2.5 h-2.5 ${star <= Math.round(product.avg_rating || 4.5) ? 'fill-current' : 'text-gray-200'}`} 
                                        />
                                    ))}
                                </div>
                                <span className="text-[8px] text-[#FF9900] font-black">{product.avg_rating || '4.5'}</span>
                                <span className="text-[8px] text-gray-400 font-bold">({product.review_count || '12'})</span>
                            </div>
                        </div>
                        
                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 leading-tight group-hover:text-lolly transition-colors h-8 sm:h-9">
                            {product.brand && <span className="font-black uppercase text-[8px] sm:text-[10px] text-gray-500 block mb-0.5 tracking-tight">{product.brand}</span>}
                            {product.name}
                        </h3>

                        {/* Price Logic - Adaptive size */}
                        <div className="pt-0.5 sm:pt-1">
                            {hasPromo ? (
                                <div className="space-y-0">
                                    <div className="flex items-baseline space-x-1 sm:space-x-2">
                                        <span className="text-sm sm:text-lg font-black text-red-700 tracking-tight">{Number(product.promo_price).toLocaleString()} <span className="text-[8px] sm:text-[10px]">CFA</span></span>
                                        <span className="text-[10px] sm:text-xs text-gray-400 line-through font-medium">{Number(product.price).toLocaleString()}</span>
                                    </div>
                                    <p className="hidden sm:block text-[9px] font-bold text-gray-500 uppercase tracking-widest">Meilleur prix</p>
                                </div>
                            ) : (
                                <p className="text-sm sm:text-lg font-black text-gray-900 tracking-tight">
                                    {Number(product.price).toLocaleString()} <span className="text-[8px] sm:text-[10px]">CFA</span>
                                </p>
                            )}
                        </div>

                        {/* Social Proof - Hidden on very small screens */}
                        <div className="hidden sm:block space-y-1 pt-1">
                            <p className="text-[10px] font-medium text-green-700 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Livraison Express
                            </p>
                        </div>
                    </div>

                    {/* Primary Button - More touch-friendly on mobile */}
                    <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100">
                        <button 
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`w-full py-2 sm:py-2.5 rounded-md font-black uppercase text-[8px] sm:text-[10px] tracking-widest transition-all ${
                                isOutOfStock ? 'bg-gray-100 text-gray-400' : 
                                added ? 'bg-green-600 text-white shadow-inner' : 'bg-[#fde700] text-black hover:bg-[#f5d600] shadow-sm active:scale-95'
                            }`}
                        >
                            {isOutOfStock ? 'Épuisé' : added ? 'OK !' : 'Au panier'}
                        </button>
                    </div>
                </div>
            </div>

            <ProductDetailsModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
