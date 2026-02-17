'use client'

import React from 'react';
import { X, ShoppingCart, ShieldCheck, Truck, RotateCcw, Zap, ShoppingBag, MessageCircle, Share2, PlayCircle, Star, Search, ZoomIn, CheckCircle2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import SiteImageLightbox from './SiteImageLightbox';

interface ProductDisplayProps {
    product: any;
    related: any[];
    isPage?: boolean;
    onClose?: () => void;
}

export default function ProductDisplay({ product, related, isPage = false, onClose }: ProductDisplayProps) {
    const { addToCart } = useCart();
    const [activeImage, setActiveImage] = React.useState<string>(product.image);
    const [activeTab, setActiveTab] = React.useState<'details' | 'reviews'>('details');
    const [reviews, setReviews] = React.useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = React.useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

    // VARIANTS STATE
    const [selectedColor, setSelectedColor] = React.useState<string>('');
    const [selectedSize, setSelectedSize] = React.useState<string>('');

    const colors = Array.from(new Set(product.variants?.map((v: any) => v.color).filter(Boolean))) as string[];
    const sizes = Array.from(new Set(product.variants?.map((v: any) => v.size).filter(Boolean))) as string[];

    React.useEffect(() => {
        setActiveImage(product.image);
        setActiveTab('details');

        // Set initial variant selection
        const initialColor = colors[0] || '';
        const initialSize = sizes[0] || '';
        setSelectedColor(initialColor);
        setSelectedSize(initialSize);

        // If the first color variant has an image, use it
        const firstColorWithImage = product.variants?.find((v: any) => v.color === initialColor && v.image);
        if (firstColorWithImage?.image) {
            setActiveImage(firstColorWithImage.image);
        }

        fetchReviews();
    }, [product.id]);

    // Update active image when color changes
    React.useEffect(() => {
        if (selectedColor) {
            const variant = product.variants?.find((v: any) => v.color === selectedColor && v.image);
            if (variant?.image) {
                setActiveImage(variant.image);
            }
        }
    }, [selectedColor, product.variants]);

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

    const handleAddToCartWithVariant = () => {
        const variant = product.variants?.find((v: any) => v.color === selectedColor && v.size === selectedSize);
        const productWithVariant = {
            ...product,
            selectedColor,
            selectedSize,
            name: `${product.name}${selectedColor ? ` - ${selectedColor}` : ''}${selectedSize ? ` (${selectedSize})` : ''}`,
            image: variant?.image || product.image // Ensure variant image goes to cart
        };
        addToCart(productWithVariant);
        if (onClose) onClose();
    };

    const variantImages = product.variants?.map((v: any) => v.image).filter(Boolean) || [];
    const baseGallery = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    const gallery = Array.from(new Set([...baseGallery, ...variantImages]));

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
        } catch (e) { }
    };

    return (
        <div className={`relative w-full ${isPage ? 'min-h-screen bg-white pt-20' : 'max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col md:flex-row'}`}>

            {!isPage && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full text-black hover:bg-black hover:text-white transition-all shadow-xl"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            <div className={`flex flex-col md:flex-row w-full ${isPage ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20' : ''}`}>

                {/* Left: Image & Gallery & Video */}
                <div className={`w-full md:w-1/2 relative flex flex-col ${isPage ? 'md:sticky md:top-28 self-start' : 'bg-gray-50'}`}>
                    <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden rounded-[32px] border border-gray-100 shadow-sm">
                        {/* Live FOMO Badge */}
                        <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
                            <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm flex items-center space-x-2 border border-gray-100">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[7px] font-black uppercase tracking-widest text-black">{viewingCount} vues</span>
                            </div>
                        </div>

                        {activeImage && activeImage !== "" && !activeImage.includes('video') ? (
                            <div
                                className="relative w-full h-full overflow-hidden group/zoom cursor-zoom-in p-8"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                <Image
                                    src={activeImage}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-8 transition-transform duration-700 group-hover/zoom:scale-125"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/zoom:bg-black/5 transition-colors duration-500 flex items-center justify-center">
                                    <div className="bg-white/90 p-3 rounded-full shadow-2xl scale-0 group-hover/zoom:scale-100 transition-all duration-500">
                                        <ZoomIn className="w-5 h-5 text-black" />
                                    </div>
                                </div>
                            </div>
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
                            <div className="relative w-full h-full cursor-zoom-in p-8" onClick={() => setIsLightboxOpen(true)}>
                                <Image src={activeImage} alt={product.name} fill className="object-contain p-8" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <ShoppingBag className="w-24 h-24" />
                            </div>
                        )}

                        {/* Floating Badges */}
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                            <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest shadow-sm bg-gray-50 border border-gray-100 ${shopColor}`}>
                                {shopName} Universe
                            </span>
                            {hasPromo && (
                                <span className="px-3 py-1 bg-[#0055ff] text-white text-[7px] font-black uppercase rounded-full shadow-sm flex items-center w-fit">
                                    <Zap className="w-2.5 h-2.5 mr-1 fill-white" /> Promo
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Gallery Thumbnails (Incl Video) */}
                    {(gallery.length > 1 || product.video_url) && (
                        <div className="mt-6 flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                            {product.video_url && (
                                <button
                                    onClick={() => setActiveImage('video')}
                                    className={`relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 flex items-center justify-center bg-black transition-all ${activeImage === 'video' ? 'border-[#0055ff] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <PlayCircle className="w-8 h-8 text-white" />
                                </button>
                            )}
                            {gallery.filter((img: string) => img && img !== "").map((img: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    className={`relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all p-1 bg-white ${activeImage === img ? 'border-[#0055ff] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <div className="relative w-full h-full">
                                        <Image src={img} alt={`Thumb ${idx}`} fill className="object-contain" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Content */}
                <div className={`w-full md:w-1/2 p-4 md:px-12 md:py-0 flex flex-col bg-white ${isPage ? 'mt-8 md:mt-0' : ''}`}>
                    {/* Breadcrumbs or Back Link if page */}
                    {isPage && (
                        <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                            <a href="/" className="hover:text-black transition-colors">Accueil</a>
                            <ChevronRight className="w-3 h-3" />
                            <a href={`/?shop=${product.shop_id}`} className="hover:text-black transition-colors">{shopName}</a>
                            <ChevronRight className="w-3 h-3" />
                            <span className="text-gray-900">{product.category}</span>
                        </nav>
                    )}

                    {/* Tabs / Menu */}
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
                            Avis ({product.avg_rating?.toFixed(1) || '4.5'}/5)
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
                                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-gray-900 leading-[0.9] mb-8">
                                    {product.name}
                                </h1>

                                <div className="flex items-center gap-6 p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                                    {hasPromo ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-400 line-through font-bold mb-1">
                                                {Number(product.price).toLocaleString()} CFA
                                            </span>
                                            <p className="text-5xl font-black text-[#0055ff] tracking-tighter">
                                                {Number(product.promo_price).toLocaleString()} <span className="text-sm uppercase ml-1">CFA</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-5xl font-black text-[#0055ff] tracking-tighter">
                                            {Number(product.price).toLocaleString()} <span className="text-sm uppercase ml-1">CFA</span>
                                        </p>
                                    )}

                                    <div className="ml-auto text-right">
                                        {Number(product.stock) <= 5 && Number(product.stock) > 0 ? (
                                            <span className="text-[10px] font-black uppercase text-orange-500 animate-pulse">Dernières unités !</span>
                                        ) : Number(product.stock) > 5 ? (
                                            <div className="flex items-center text-green-500 gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase">En Stock</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black uppercase text-gray-400">Sold Out</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* VARIANTS SELECTORS */}
                            <div className="space-y-8 mb-12">
                                {colors.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Couleur : <span className="text-black">{selectedColor}</span></p>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${selectedColor === color ? 'bg-black text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-500 hover:bg-white border border-transparent hover:border-gray-200'}`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sizes.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Taille : <span className="text-black">{selectedSize}</span></p>
                                        <div className="flex flex-wrap gap-2">
                                            {sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[56px] h-14 rounded-2xl text-xs font-black uppercase transition-all border-2 flex items-center justify-center ${selectedSize === size ? 'border-black bg-black text-white shadow-lg scale-105' : 'border-gray-100 bg-white text-gray-500 hover:border-black'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-12">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-6 pb-4 border-b border-gray-100">L'essentiel</h4>
                                <p className="text-gray-600 text-sm leading-relaxed font-medium">
                                    {product.description || "Design élégant et finitions soignées pour répondre à toutes vos exigences de style et de qualité."}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 mb-12">
                            <div className="p-8 bg-yellow-50/50 rounded-3xl border border-yellow-100">
                                <div className="flex items-center space-x-2 mb-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <Star key={i} className={`w-5 h-5 ${i <= Math.round(product.avg_rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                    ))}
                                    <span className="text-lg font-black ml-2">{product.avg_rating?.toFixed(1) || '5.0'} / 5</span>
                                </div>
                                <p className="text-[11px] font-black text-yellow-700 uppercase tracking-widest">Basé sur {reviews.length || soldCount} avis certifiés</p>
                            </div>

                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {reviews.map((rev, i) => (
                                    <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-black uppercase">{rev.profiles?.full_name || 'Client Lolly'}</span>
                                            <div className="flex space-x-1">
                                                {[...Array(5)].map((_, j) => (
                                                    <Star key={j} className={`w-2.5 h-2.5 ${j < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium italic">"{rev.comment}"</p>
                                    </div>
                                ))}
                                {reviews.length === 0 && (
                                    <p className="text-center py-20 text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                                        Soyez le premier à laisser un avis !
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions: Add to Cart & WhatsApp */}
                    <div className="mt-auto space-y-4">
                        <button
                            onClick={handleAddToCartWithVariant}
                            disabled={product.stock <= 0 && product.type !== 'service'}
                            className="w-full py-6 bg-black text-white rounded-[24px] font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center hover:bg-[#0055ff] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50"
                        >
                            <ShoppingCart className="w-5 h-5 mr-4" />
                            {product.stock <= 0 && product.type !== 'service' ? 'Rupture' : 'Ajouter au Panier'}
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleWhatsAppOrder} className="py-5 bg-[#25D366] text-white rounded-[24px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center hover:bg-[#128C7E] transition-all shadow-lg active:scale-95">
                                <MessageCircle className="w-5 h-5 mr-3" /> WhatsApp
                            </button>
                            <button onClick={handleShare} className="py-5 bg-gray-50 text-black rounded-[24px] font-black uppercase text-[11px] tracking-widest flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-200 active:scale-95">
                                <Share2 className="w-5 h-5 mr-3" /> Partager
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Similar Products Section */}
            {related.length > 0 && (
                <div className={`mt-20 ${isPage ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8' : 'p-12 bg-gray-50 border-t'}`}>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-10 italic">Complétez votre look...</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {related.map((p: any) => (
                            <a key={p.id} href={`/product/${p.id}`} className="group block">
                                <div className="relative aspect-square rounded-[32px] overflow-hidden mb-4 bg-white border border-gray-100 shadow-sm transition-all group-hover:shadow-xl">
                                    <div className="absolute inset-0 bg-gray-50 group-hover:bg-white transition-colors duration-500" />
                                    <Image src={p.image} alt={p.name} fill className="object-contain p-6 transition-transform duration-700 group-hover:scale-110" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase truncate text-gray-900 group-hover:text-[#0055ff] transition-colors">{p.name}</h4>
                                <p className="text-sm font-black text-[#0055ff] mt-1">{Number(p.price).toLocaleString()} CFA</p>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <SiteImageLightbox
                isOpen={isLightboxOpen}
                src={activeImage}
                onClose={() => setIsLightboxOpen(false)}
            />
        </div>
    );
}

