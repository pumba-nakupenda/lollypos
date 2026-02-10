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

    const isRestricted = !!profile?.shop_id

    // Inject CSS variables for the active shop's theme
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

        if (profile?.shop_id) {
            currentShop = shops.find(s => s.id === profile.shop_id)
            if (shopIdParam && shopIdParam !== profile.shop_id.toString()) {
                const params = new URLSearchParams(searchParams.toString())
                params.set('shopId', profile.shop_id.toString())
                router.replace(`${pathname}?${params.toString()}`)
                return
            }
        } 
        
        if (!currentShop && shopIdParam) {
            if (shopIdParam === '0') currentShop = globalShop
            else currentShop = shops.find(s => s.id === +shopIdParam)
        }

        if (!currentShop) {
            const savedShopId = localStorage.getItem('activeShopId')
            if (savedShopId === '0') currentShop = globalShop
            else if (savedShopId) {
                currentShop = shops.find(s => s.id === +savedShopId)
            }
        }

        const finalShop = currentShop || (isRestricted ? shops[0] : globalShop)
        setActiveShopState(finalShop)

        if (shopIdParam !== finalShop.id.toString()) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('shopId', finalShop.id.toString())
            router.replace(`${pathname}?${params.toString()}`)
        }

        setLoading(false)
    }, [searchParams, pathname, router, profile, userLoading, isRestricted])

    const setActiveShop = (shop: Shop) => {
        if (isRestricted) return 
        
        setLoading(true) 
        setActiveShopState(shop)
        localStorage.setItem('activeShopId', shop.id.toString())
        const params = new URLSearchParams(searchParams.toString())
        params.set('shopId', shop.id.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    const showLoader = (loading || userLoading) && pathname !== '/login'

    return (
        <ShopContext.Provider value={{ activeShop, shops, setActiveShop, loading: loading || userLoading, isRestricted }}>
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