import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { Product, Variant } from '@/types/models';

export interface CartItem extends Product {
    cartItemId: string | number
    quantity: number
    variantInfo?: Variant
}

export function usePos() {
    const { showToast } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

    const addToCart = (product: Product, variant?: Variant) => {
        if (product.stock <= 0 && product.type !== 'service') {
            showToast("Produit épuisé !", "warning");
            return;
        }

        if (variant && variant.stock !== undefined && parseInt(variant.stock) <= 0 && product.type !== 'service') {
            showToast("Cette variante est épuisée !", "warning");
            return;
        }

        const currentPrice = variant ? (variant.price || product.price) : ((product.promo_price ?? 0) > 0 ? product.promo_price! : product.price);
        const costPrice = product.cost_price || 0;

        if (costPrice > 0 && product.type !== 'service') {
            const margin = currentPrice - costPrice;
            const marginPercent = currentPrice > 0 ? (margin / currentPrice) * 100 : 0;
            if (marginPercent < 28) {
                showToast(`Marge insuffisante (${marginPercent.toFixed(1)}%). Min 28% requis.`, "error");
                return;
            }
        }

        if (product.variants && product.variants.length > 0 && !variant) {
            setSelectedProductForVariant(product);
            return;
        }

        const cartItemId = variant ? `${product.id}-${variant.color}-${variant.size}` : product.id;
        const itemName = variant ? `${product.name} (${variant.color}${variant.color && variant.size ? '/' : ''}${variant.size})` : product.name;
        const itemImage = variant?.image || product.image;

        const existing = cart.find(item => item.cartItemId === cartItemId);
        if (existing) {
            setCart(cart.map(item =>
                item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, {
                ...product,
                cartItemId,
                name: itemName,
                image: itemImage,
                price: currentPrice,
                quantity: 1,
                variantInfo: variant
            }]);
        }
    };

    const updateCartItemPrice = (cartItemId: string | number, newPrice: number) => {
        const item = cart.find(i => i.cartItemId === cartItemId);
        if (item && (item.cost_price || 0) > 0 && item.type !== 'service') {
            const margin = newPrice - item.cost_price;
            const marginPercent = newPrice > 0 ? (margin / newPrice) * 100 : 0;
            if (marginPercent < 28) {
                showToast(`Prix trop bas ! Marge: ${marginPercent.toFixed(1)}% (Min: 28%)`, "error");
                return;
            }
        }
        setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, price: newPrice } : item));
    };
    
    const resetCart = () => setCart([]);

    return {
        cart,
        setCart,
        addToCart,
        updateCartItemPrice,
        selectedProductForVariant,
        setSelectedProductForVariant,
        resetCart,
    };
}
