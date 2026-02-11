
'use client'

import React, { useState } from 'react';
import { ShoppingBag, ShoppingCart, Star, Zap, Eye, Flame, CheckCircle2, Heart } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import ProductDetailsModal from './ProductDetailsModal';
import { API_URL } from '@/utils/api';

export default function ProductCard({ product }: { product: any }) {
    const { addToCart, setIsCartOpen } = useCart();
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
            setIsCartOpen(true); // Ouvrir le panier comme sur Amazon pour confirmer
            trackView();
        }
    };
    
    const shopName = product.shop_id === 1 ? "Luxya" : "Homtek";
    const shopColor = product.shop_id === 1 ? "text-pink-500" : "text-blue-600";
    const hasPromo = product.promo_price && product.promo_price > 0 && Number(product.promo_price) < Number(product.price);
    const isFavorite = isInWishlist(product.id);

    const stock = Number(product.stock);
    const isLowStock = stock > 0 && stock <= 5;
    const isOutOfStock = stock <= 0 && product.type !== 'service';

    const discountPercent = hasPromo 
        ? Math.round(((Number(product.price) - Number(product.promo_price)) / Number(product.price)) * 100)
        : 0;
    
    const savingAmount = hasPromo ? Number(product.price) - Number(product.promo_price) : 0;

    return (
        <>
            <div className="group bg-white flex flex-col h-full border border-gray-100 hover:shadow-2xl transition-all duration-500 rounded-[24px] overflow-hidden relative">
                
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer" onClick={handleOpenModal}>
                    {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag className="w-12 h-12" /></div>
                    )}

                    {/* Wishlist Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg z-20 ${isFavorite ? 'bg-pink-500 text-white' : 'bg-white/90 text-gray-400 hover:text-pink-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
                    </button>

                    {/* Promo Badge */}
                    {hasPromo && (
                        <div className="absolute top-4 left-0 z-20 bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase rounded-r-lg shadow-lg">
                            -{discountPercent}%
                        </div>
                    )}

                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <span className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase rounded-full">Épuisé</span>
                        </div>
                    )}
                </div>

                {/* Info Container */}
                <div className="p-5 flex flex-col flex-1 space-y-3">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${shopColor}`}>{shopName}</span>
                            <div className="flex text-yellow-400"><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /></div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#0055ff] transition-colors uppercase tracking-tight">
                            {product.name}
                        </h3>
                    </div>

                    {/* Price Area */}
                    <div className="space-y-1">
                        {hasPromo ? (
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xl font-black text-red-600 tracking-tighter">{Number(product.promo_price).toLocaleString()} <span className="text-xs">CFA</span></span>
                                    <span className="text-xs text-gray-400 line-through font-medium">{Number(product.price).toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] font-bold text-green-600">Économisez {savingAmount.toLocaleString()} CFA</p>
                            </div>
                        ) : (
                            <p className="text-xl font-black text-gray-900 tracking-tighter">
                                {Number(product.price).toLocaleString()} <span className="text-xs">CFA</span>
                            </p>
                        )}
                    </div>

                    {/* Delivery & Stock Info */}
                    <div className="space-y-1 pb-2">
                        <p className="text-[10px] font-medium text-gray-500 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Livraison demain à Dakar
                        </p>
                        {isLowStock && (
                            <p className="text-[10px] font-black text-orange-600 uppercase flex items-center">
                                <Flame className="w-3 h-3 mr-1 animate-pulse" /> Plus que {stock} en stock !
                            </p>
                        )}
                    </div>

                    {/* Amazon-Style Action Button */}
                    <button 
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400' : 'bg-[#fde700] text-black hover:bg-[#f5d600] shadow-md active:scale-95'}`}
                    >
                        Ajouter au panier
                    </button>
                </div>
            </div>

            <ProductDetailsModal product={product} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
