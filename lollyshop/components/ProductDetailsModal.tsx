'use client'

import React from 'react';
import { X, ShoppingCart, ShieldCheck, Truck, RotateCcw, Zap, ShoppingBag, MessageCircle, Share2, PlayCircle, Star } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/context/ProductContext';

interface ProductDetailsModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
    const { addToCart } = useCart();
    const { getRelatedProducts } = useProducts();
    const [activeImage, setActiveImage] = React.useState<string>(product.image);
    const [activeTab, setActiveTab] = React.useState<'details' | 'reviews'>('details');
    const [reviews, setReviews] = React.useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = React.useState(false);

    // VARIANTS STATE
    const [selectedColor, setSelectedColor] = React.useState<string>('');
    const [selectedSize, setSelectedSize] = React.useState<string>('');

    const colors = Array.from(new Set(product.variants?.map((v: any) => v.color).filter(Boolean))) as string[];
    const sizes = Array.from(new Set(product.variants?.map((v: any) => v.size).filter(Boolean))) as string[];

    React.useEffect(() => {
        if (isOpen) {
            setActiveImage(product.image);
            setActiveTab('details');
            setSelectedColor(colors[0] || '');
            setSelectedSize(sizes[0] || '');
            fetchReviews();
        }
    }, [isOpen, product.id]);

    const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
            const res = await fetch(`/api/reviews?product_id=${product.id}`);
            const data = await res.json();
            if (Array.isArray(data)) setReviews(data);
        } catch (e) {
            console.error("Failed to fetch reviews", e);
        } finally {
            setLoadingReviews(false);
        }
    };

    if (!isOpen) return null;

    const handleAddToCartWithVariant = () => {
        const productWithVariant = {
            ...product,
            selectedColor,
            selectedSize,
            name: `${product.name}${selectedColor ? ` - ${selectedColor}` : ''}${selectedSize ? ` (${selectedSize})` : ''}`
        };
        addToCart(productWithVariant);
        onClose();
    };

    const gallery = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    const related = getRelatedProducts(product.id, product.category);
    const shopName = product.shop_id === 1 ? "Luxya" : "Homtek";
    const shopColor = product.shop_id === 1 ? "text-red-500" : "text-blue-600";
    const hasPromo = product.promo_price && product.promo_price > 0 && Number(product.promo_price) < Number(product.price);

    const viewingCount = (product.id % 15) + 3;
    const soldCount = (product.id % 20) + 5;

    const handleWhatsAppOrder = () => {
        const price = hasPromo ? product.promo_price : product.price;
        const message = `Bonjour Lolly ! Je souhaite commander cet article :\n\n*Produit:* ${product.name}\n*Prix:* ${Number(price).toLocaleString()} FCFA\n*Lien:* ${window.location.href}`;
        window.open(`https://wa.me/221772354747?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShare = async () => {
        try {
            const shareUrl = `${window.location.origin}/product/${product.id}`;
            await navigator.share({
                title: `Lolly - ${product.name}`,
                text: `Découvrez cet article chez Lolly !`,
                url: shareUrl
            });
        } catch (e) {}
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative w-full max-w-6xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full text-black hover:bg-black hover:text-white transition-all shadow-xl"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Left: Image & Gallery & Video */}
                    <div className="w-full md:w-1/2 relative bg-gray-50 flex flex-col md:sticky md:top-0">
                        <div className="relative aspect-square md:h-[500px] bg-gray-100 flex items-center justify-center overflow-hidden">
                            {/* Live FOMO Badge */}
                            <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-2">
                                <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center space-x-2 border border-white">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-black">{viewingCount} personnes sur cette page</span>
                                </div>
                                <div className="px-4 py-2 bg-black text-white rounded-2xl shadow-xl flex items-center space-x-2">
                                    <ShoppingBag className="w-3 h-3 text-[#0055ff]" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{soldCount} vendus récemment</span>
                                </div>
                            </div>

                            {activeImage && activeImage !== "" && !activeImage.includes('video') ? (
                                <Image src={activeImage} alt={product.name} fill className="object-cover" />
                            ) : product.video_url && activeImage === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center relative">
                                    <iframe 
                                        src={product.video_url.replace('watch?v=', 'embed/')} 
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    />
                                </div>
                            ) : activeImage && activeImage !== "" ? (
                                <Image src={activeImage} alt={product.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                    <ShoppingBag className="w-24 h-24" />
                                </div>
                            )}
                            
                            {/* Floating Badges */}
                            <div className="absolute top-8 left-8 flex flex-col gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl bg-white ${shopColor}`}>
                                    {shopName} Universe
                                </span>
                                {hasPromo && (
                                    <span className="px-4 py-1.5 bg-[#0055ff] text-white text-[8px] font-black uppercase rounded-full shadow-xl flex items-center w-fit">
                                        <Zap className="w-3 h-3 mr-1 fill-white" /> Offre Spéciale
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Gallery Thumbnails (Incl Video) */}
                        {(gallery.length > 1 || product.video_url) && (
                            <div className="p-6 bg-white border-t border-gray-100 flex gap-3 overflow-x-auto custom-scrollbar">
                                {product.video_url && (
                                    <button 
                                        onClick={() => setActiveImage('video')}
                                        className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 flex items-center justify-center bg-black transition-all ${activeImage === 'video' ? 'border-[#0055ff] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <PlayCircle className="w-8 h-8 text-white" />
                                    </button>
                                )}
                                {gallery.filter((img: string) => img && img !== "").map((img: string, idx: number) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setActiveImage(img)}
                                        className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === img ? 'border-[#0055ff] scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Content */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col bg-white">
                        {/* Tabs */}
                        <div className="flex space-x-8 border-b border-gray-100 mb-8">
                            <button 
                                onClick={() => setActiveTab('details')}
                                className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'text-[#0055ff] border-b-2 border-[#0055ff]' : 'text-gray-300 hover:text-black'}`}
                            >
                                Détails Produit
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')}
                                className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'reviews' ? 'text-[#0055ff] border-b-2 border-[#0055ff]' : 'text-gray-300 hover:text-black'}`}
                            >
                                Avis Clients ({product.avg_rating?.toFixed(1) || '4.5'}/5)
                            </button>
                        </div>

                        {activeTab === 'details' ? (
                            <>
                                <div className="mb-10">
                                    <div className="flex flex-col gap-1 mb-4">
                                        {product.brand && (
                                            <p className="text-shop font-black uppercase text-[12px] tracking-[0.2em]">Marque : {product.brand}</p>
                                        )}
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">{product.category || 'Collection Exclusive'}</p>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900 leading-tight mb-6">
                                        {product.name}
                                    </h2>
                                    
                                    <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                        {hasPromo ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-400 line-through font-bold mb-1">
                                                    {Number(product.price).toLocaleString()} CFA
                                                </span>
                                                <p className="text-4xl font-black text-[#0055ff] tracking-tighter">
                                                    {Number(product.promo_price).toLocaleString()} <span className="text-sm">CFA</span>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-4xl font-black text-[#0055ff] tracking-tighter">
                                                {Number(product.price).toLocaleString()} <span className="text-sm">CFA</span>
                                            </p>
                                        )}
                                        
                                        <div className="ml-auto text-right">
                                            {Number(product.stock) <= 5 && Number(product.stock) > 0 ? (
                                                <span className="text-[10px] font-black uppercase text-orange-500 animate-pulse">Dernières unités !</span>
                                            ) : Number(product.stock) > 5 ? (
                                                <span className="text-[10px] font-black uppercase text-green-500">Disponible</span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase text-gray-400">Sold Out</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* VARIANTS SELECTORS */}
                                <div className="space-y-6 mb-10">
                                    {colors.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Couleur : <span className="text-black">{selectedColor}</span></p>
                                            <div className="flex flex-wrap gap-2">
                                                {colors.map(color => (
                                                    <button 
                                                        key={color}
                                                        onClick={() => setSelectedColor(color)}
                                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedColor === color ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                    >
                                                        {color}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sizes.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Taille : <span className="text-black">{selectedSize}</span></p>
                                            <div className="flex flex-wrap gap-2">
                                                {sizes.map(size => (
                                                    <button 
                                                        key={size}
                                                        onClick={() => setSelectedSize(size)}
                                                        className={`min-w-[48px] h-12 rounded-xl text-xs font-black uppercase transition-all border-2 flex items-center justify-center ${selectedSize === size ? 'border-black bg-black text-white shadow-lg' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
                                                    >
                                                        {size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-12">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-5 pb-3 border-b-2 border-gray-50">L'essentiel</h4>
                                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                        {product.description || "Design élégant et finitions soignées pour répondre à toutes vos exigences de style et de qualité."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-10">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <ShieldCheck className="w-5 h-5 text-green-500" />
                                        <p className="text-[10px] font-black uppercase text-black">Authenticité 100% Garantie</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <Truck className="w-5 h-5 text-[#0055ff]" />
                                        <p className="text-[10px] font-black uppercase text-black">Livraison Dakar en 24h</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-8 mb-10">
                                <div className="p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
                                    <div className="flex items-center space-x-2 mb-2">
                                        {[1,2,3,4,5].map(i => (
                                            <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.avg_rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                        <span className="text-xs font-black">{product.avg_rating?.toFixed(1) || '5.0'} / 5</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Basé sur {reviews.length} avis vérifiés</p>
                                </div>
                                
                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {reviews.map((rev, i) => (
                                        <div key={i} className="border-b border-gray-50 pb-6 last:border-0">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-black uppercase">{rev.profiles?.full_name || 'Client Lolly'}</span>
                                                <div className="flex space-x-1">
                                                    {[...Array(5)].map((_, j) => (
                                                        <Star key={j} className={`w-2.5 h-2.5 ${j < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium italic">"{rev.comment}"</p>
                                            <p className="text-[8px] text-gray-400 mt-2 uppercase">{new Date(rev.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && (
                                        <p className="text-center py-10 text-[10px] text-gray-400 font-black uppercase tracking-widest">Soyez le premier à laisser un avis !</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Add to Cart & WhatsApp */}
                        <div className="flex flex-col gap-3 mt-auto">
                            <button 
                                onClick={handleAddToCartWithVariant}
                                disabled={product.stock <= 0 && product.type !== 'service'}
                                className="w-full py-5 bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center hover:bg-[#0055ff] transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                            >
                                <ShoppingCart className="w-4 h-4 mr-3" />
                                {product.stock <= 0 && product.type !== 'service' ? 'Rupture' : 'Ajouter au Panier'}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleWhatsAppOrder} className="py-4 bg-green-500 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest flex items-center justify-center hover:bg-green-600 transition-all shadow-xl active:scale-95">
                                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                                </button>
                                <button onClick={handleShare} className="py-4 bg-gray-100 text-black rounded-[24px] font-black uppercase text-[10px] tracking-widest flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm active:scale-95">
                                    <Share2 className="w-4 h-4 mr-2" /> Partager
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Similar Products Section */}
                {related.length > 0 && (
                    <div className="p-12 bg-gray-50 border-t border-gray-100">
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 italic">Vous aimerez aussi...</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {related.map((p: any) => (
                                <div key={p.id} onClick={() => { onClose(); }} className="group cursor-pointer">
                                    <div className="relative aspect-square rounded-3xl overflow-hidden mb-3 bg-white">
                                        {p.image && p.image !== "" ? (
                                            <Image src={p.image} alt={p.name} fill className="object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <ShoppingBag className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-[10px] font-black uppercase truncate">{p.name}</h4>
                                    <p className="text-xs font-black text-[#0055ff]">{Number(p.price).toLocaleString()} CFA</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}