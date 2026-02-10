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
    const isAdmin = profile?.role === 'admin'
    const authorizedShops = profile?.shop_ids && profile.shop_ids.length > 0 
            ? shops.filter(s => profile.shop_ids?.includes(s.id)) 
            : (profile?.shop_id ? shops.filter(s => s.id === profile.shop_id) : [])

    // NEW: If user has multiple shops, add a local "Global View" for them
    const availableShops = [...authorizedShops]
    if (isAdmin || authorizedShops.length > 1) {
        availableShops.unshift(globalShop)
    }

    const isRestricted = !isAdmin && authorizedShops.length > 0

    // Inject CSS variables
    useEffect(() => {
        if (activeShop) {
            const root = document.documentElement;
            // Handle theme for "Toutes les boutiques" (ID 0)
            if (activeShop.id === 0) {
                root.style.setProperty('--shop-primary', "239 84% 67%");
                root.style.setProperty('--shop-secondary', "43 100% 70%");
                root.style.setProperty('--shop-accent', "239 84% 67%");
            } else {
                root.style.setProperty('--shop-primary', activeShop.colors.primary);
                root.style.setProperty('--shop-secondary', activeShop.colors.secondary);
                root.style.setProperty('--shop-accent', activeShop.colors.accent);
            }
        }
    }, [activeShop])

    useEffect(() => {
        if (userLoading) return 

        const shopIdParam = searchParams.get('shopId')
        let currentShop: Shop | undefined

        // SECURITY: If restricted, force selection into authorized shops (or their local global view)
        if (isRestricted) {
            const isAuthorized = shopIdParam === '0' 
                ? authorizedShops.length > 1 // Global view authorized if multiple shops
                : authorizedShops.some(s => s.id.toString() === shopIdParam)

            if (!isAuthorized) {
                const defaultShop = authorizedShops.length > 1 ? globalShop : authorizedShops[0]
                const params = new URLSearchParams(searchParams.toString())
                params.set('shopId', defaultShop.id.toString())
                router.replace(`${pathname}?${params.toString()}`)
                return
            }
            currentShop = shopIdParam === '0' ? globalShop : shops.find(s => s.id === parseInt(shopIdParam!))
        } 
        
        // Non-restricted logic (Admins)
        if (!currentShop && shopIdParam) {
            if (shopIdParam === '0') currentShop = globalShop
            else currentShop = shops.find(s => s.id === +shopIdParam)
        }

        if (!currentShop) {
            const savedShopId = localStorage.getItem('activeShopId')
            if (savedShopId === '0' && (isAdmin || authorizedShops.length > 1)) currentShop = globalShop
            else if (savedShopId) {
                currentShop = authorizedShops.find(s => s.id === +savedShopId)
            }
        }

        const defaultFinal = (isRestricted && authorizedShops.length > 1) ? globalShop : (isRestricted ? authorizedShops[0] : globalShop)
        const finalShop = currentShop || defaultFinal
        setActiveShopState(finalShop)

        if (shopIdParam !== finalShop.id.toString()) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('shopId', finalShop.id.toString())
            router.replace(`${pathname}?${params.toString()}`)
        }

        setLoading(false)
    }, [searchParams, pathname, router, profile, userLoading, isRestricted, authorizedShops])

    const setActiveShop = (shop: Shop) => {
        // Only allow switching to authorized shops or global if allowed
        const canAccessGlobal = isAdmin || authorizedShops.length > 1
        if (shop.id === 0 && !canAccessGlobal) return
        if (shop.id !== 0 && isRestricted && !authorizedShops.some(s => s.id === shop.id)) return 
        
        setLoading(true) 
        setActiveShopState(shop)
        localStorage.setItem('activeShopId', shop.id.toString())
        const params = new URLSearchParams(searchParams.toString())
        params.set('shopId', shop.id.toString())
        router.push(`${pathname}?${params.toString()}`)
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