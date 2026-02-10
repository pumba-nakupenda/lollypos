'use client'

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ArrowRight, Package } from 'lucide-react';
import Link from 'next/link';
import { getExpiryStatus } from '@/utils/expiryHelpers';
import { API_URL } from '@/utils/api';

interface Product {
    id: number;
    name: string;
    expiry_date?: string | null;
    stock: number;
}

interface ExpiryAlertBannerProps {
    shopId?: number;
}

export default function ExpiryAlertBanner({ shopId }: ExpiryAlertBannerProps) {
    const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
    const [isDismissed, setIsDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpiringProducts();
    }, [shopId]);

    const fetchExpiringProducts = async () => {
        try {
            setLoading(true);
            const shopParam = shopId && shopId !== 0 ? `?shopId=${shopId}` : '';
            const res = await fetch(`${API_URL}/products${shopParam}`);

            if (res.ok) {
                const products: Product[] = await res.json();

                // Filter products that are expired or expiring soon (within 30 days)
                const expiring = products.filter(p => {
                    if (!p.expiry_date) return false;
                    const status = getExpiryStatus(p.expiry_date);
                    return status.isExpired || status.isNearExpiry;
                });

                setExpiringProducts(expiring);
            }
        } catch (error) {
            console.error('Failed to fetch expiring products:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || isDismissed || expiringProducts.length === 0) {
        return null;
    }

    const criticalCount = expiringProducts.filter(p => {
        const status = getExpiryStatus(p.expiry_date);
        return status.severity === 'critical';
    }).length;

    const warningCount = expiringProducts.length - criticalCount;

    return (
        <div className="glass-panel rounded-[32px] border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 mb-6 animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                    </div>

                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tight text-white mb-1">
                                Alerte Péremption Produits
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {criticalCount > 0 && (
                                    <span className="text-red-400 font-bold">
                                        {criticalCount} produit{criticalCount > 1 ? 's' : ''} périmé{criticalCount > 1 ? 's' : ''} ou expirant dans 30 jours
                                    </span>
                                )}
                                {criticalCount > 0 && warningCount > 0 && <span className="text-muted-foreground"> • </span>}
                                {warningCount > 0 && (
                                    <span className="text-orange-400 font-bold">
                                        {warningCount} produit{warningCount > 1 ? 's' : ''} expirant dans 60 jours
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Product List Preview */}
                        <div className="flex flex-wrap gap-2">
                            {expiringProducts.slice(0, 5).map(product => {
                                const status = getExpiryStatus(product.expiry_date);
                                const colorClass = status.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20';

                                return (
                                    <div key={product.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${colorClass}`}>
                                        <Package className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase">{product.name}</span>
                                        <span className="text-[8px] opacity-60">({status.message})</span>
                                    </div>
                                );
                            })}
                            {expiringProducts.length > 5 && (
                                <div className="flex items-center px-3 py-1.5 rounded-xl bg-white/5 text-muted-foreground">
                                    <span className="text-[10px] font-black uppercase">
                                        +{expiringProducts.length - 5} autres
                                    </span>
                                </div>
                            )}
                        </div>

                        <Link
                            href="/inventory?filter=expiring"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                        >
                            Gérer les produits
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white"
                    title="Masquer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
