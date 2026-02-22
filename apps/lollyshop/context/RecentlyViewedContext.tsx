'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

interface RecentlyViewedContextType {
    recentlyViewed: any[];
    addToRecentlyViewed: (product: any) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
    const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('recentlyViewed');
        if (saved) {
            try {
                setRecentlyViewed(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse recently viewed", e);
            }
        }
    }, []);

    const addToRecentlyViewed = (product: any) => {
        setRecentlyViewed(prev => {
            // Remove if already exists to move to top
            const filtered = prev.filter(p => p.id !== product.id);
            const updated = [product, ...filtered].slice(0, 12); // Keep max 12
            localStorage.setItem('recentlyViewed', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <RecentlyViewedContext.Provider value={{ recentlyViewed, addToRecentlyViewed }}>
            {children}
        </RecentlyViewedContext.Provider>
    );
}

export function useRecentlyViewed() {
    const context = useContext(RecentlyViewedContext);
    if (context === undefined) {
        throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
    }
    return context;
}
