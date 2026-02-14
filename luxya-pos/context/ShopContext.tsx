'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import { Shop, shops } from '@/types/shop'
import { useUser } from './UserContext'
import GlobalLoader from '@/components/GlobalLoader'

interface ShopContextType {
    activeShop: Shop | null
    shops: Shop[]
    setActiveShop: (shop: Shop) => void
    loading: boolean
    isRestricted: boolean
}

const ShopContext = createContext<ShopContextType | undefined>(undefined)

const globalShop: Shop = {
    id: 0,
    name: 'Toutes les boutiques',
    slug: 'all',
    phone: '',
    address: '',
    colors: {
        primary: "239 84% 67%",
        secondary: "43 100% 70%",
        accent: "239 84% 67%"
    }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { profile, loading: userLoading } = useUser()
    const [activeShop, setActiveShopState] = useState<Shop | null>(null)
    const [loading, setLoading] = useState(true)

    // Fencing Logic: Determine available shops for this user
    const isAdmin = React.useMemo(() => profile?.role === 'admin', [profile?.role])
    
    const authorizedShops = React.useMemo(() => {
        if (!profile) return []
        const restricted = profile.shop_ids && profile.shop_ids.length > 0 
            ? shops.filter(s => profile.shop_ids?.includes(s.id)) 
            : (profile.shop_id ? shops.filter(s => s.id === profile.shop_id) : [])
        
        // If admin and no specific shops assigned, they see EVERYTHING
        if (profile.role === 'admin' && restricted.length === 0) return shops
        return restricted
    }, [profile])

    // NEW: If user has multiple shops, add a local "Global View" for them
    const availableShops = React.useMemo(() => {
        const list = [...authorizedShops]
        // Show Global View ONLY for admins or if they have more than 2 shops
        if (isAdmin || authorizedShops.length > 2) {
            list.unshift(globalShop)
        }
        return list
    }, [isAdmin, authorizedShops])

    const isRestricted = React.useMemo(() => !isAdmin && authorizedShops.length > 0, [isAdmin, authorizedShops])

    // Inject CSS variables
    useEffect(() => {
        if (activeShop) {
            const root = document.documentElement;
            const colors = activeShop.id === 0 ? globalShop.colors : activeShop.colors;
            
            if (colors) {
                root.style.setProperty('--shop-primary', colors.primary);
                root.style.setProperty('--shop-secondary', colors.secondary);
                root.style.setProperty('--shop-accent', colors.accent);
            }
        }
    }, [activeShop])

    useEffect(() => {
        if (userLoading || !profile) return 

        const shopIdParam = searchParams.get('shopId')
        let currentShop: Shop | undefined

        // Try to match URL param first
        if (shopIdParam !== null) {
            currentShop = availableShops.find(s => s.id.toString() === shopIdParam)
        }

        // If no valid param, try localStorage
        if (!currentShop) {
            const savedShopId = localStorage.getItem('activeShopId')
            if (savedShopId !== null) {
                currentShop = availableShops.find(s => s.id.toString() === savedShopId)
            }
        }

        // Final fallback: Use the first available shop (which is globalShop if allowed, or the first authorized one)
        const finalShop = currentShop || availableShops[0] || globalShop

        // Only update if different to avoid loops/flicker
        if (!activeShop || activeShop.id !== finalShop.id) {
            setActiveShopState(finalShop)
            if (shopIdParam !== finalShop.id.toString()) {
                const params = new URLSearchParams(searchParams.toString())
                params.set('shopId', finalShop.id.toString())
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            }
        }

        setLoading(false)
    }, [searchParams, pathname, router, profile, userLoading, isRestricted, authorizedShops, availableShops, activeShop])

    const setActiveShop = (shop: Shop) => {
        if (activeShop?.id === shop.id) return
        
        // Only allow switching to authorized shops or global if allowed
        const canAccess = availableShops.some(s => s.id === shop.id)
        if (!canAccess) return
        
        setActiveShopState(shop)
        localStorage.setItem('activeShopId', shop.id.toString())
        const params = new URLSearchParams(searchParams.toString())
        params.set('shopId', shop.id.toString())
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    const showLoader = (loading || userLoading) && pathname !== '/login'

    return (
        <ShopContext.Provider value={{ activeShop, shops: availableShops, setActiveShop, loading: loading || userLoading, isRestricted }}>
            {showLoader ? <GlobalLoader /> : children}
        </ShopContext.Provider>
    )
}

export function useShop() {
    const context = useContext(ShopContext)
    if (context === undefined) {
        throw new Error('useShop must be used within a ShopProvider')
    }
    return context
}