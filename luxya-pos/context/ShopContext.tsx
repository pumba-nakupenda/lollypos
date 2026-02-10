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
    const availableShops = isAdmin 
        ? shops 
        : (profile?.shop_ids && profile.shop_ids.length > 0 
            ? shops.filter(s => profile.shop_ids?.includes(s.id)) 
            : (profile?.shop_id ? shops.filter(s => s.id === profile.shop_id) : []))

    const isRestricted = !isAdmin && availableShops.length > 0

    // Inject CSS variables
    useEffect(() => {
        if (activeShop) {
            const root = document.documentElement;
            root.style.setProperty('--shop-primary', activeShop.colors.primary);
            root.style.setProperty('--shop-secondary', activeShop.colors.secondary);
            root.style.setProperty('--shop-accent', activeShop.colors.accent);
        }
    }, [activeShop])

    useEffect(() => {
        if (userLoading) return 

        const shopIdParam = searchParams.get('shopId')
        let currentShop: Shop | undefined

        // SECURITY: If restricted, force selection into authorized shops only
        if (isRestricted) {
            const isAuthorized = shopIdParam && availableShops.some(s => s.id.toString() === shopIdParam)
            if (!isAuthorized) {
                const defaultShop = availableShops[0]
                const params = new URLSearchParams(searchParams.toString())
                params.set('shopId', defaultShop.id.toString())
                router.replace(`${pathname}?${params.toString()}`)
                return
            }
            currentShop = shops.find(s => s.id === parseInt(shopIdParam!))
        } 
        
        // Non-restricted logic (Admins or Global users)
        if (!currentShop && shopIdParam) {
            if (shopIdParam === '0') currentShop = globalShop
            else currentShop = shops.find(s => s.id === +shopIdParam)
        }

        if (!currentShop) {
            const savedShopId = localStorage.getItem('activeShopId')
            if (savedShopId === '0' && !isRestricted) currentShop = globalShop
            else if (savedShopId) {
                currentShop = availableShops.find(s => s.id === +savedShopId)
            }
        }

        const finalShop = currentShop || (isRestricted ? availableShops[0] : globalShop)
        setActiveShopState(finalShop)

        if (shopIdParam !== finalShop.id.toString()) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('shopId', finalShop.id.toString())
            router.replace(`${pathname}?${params.toString()}`)
        }

        setLoading(false)
    }, [searchParams, pathname, router, profile, userLoading, isRestricted, availableShops])

    const setActiveShop = (shop: Shop) => {
        // Only allow switching to authorized shops
        if (isRestricted && !availableShops.some(s => s.id === shop.id)) return 
        
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