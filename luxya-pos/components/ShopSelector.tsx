'use client'

import React from 'react'
import { useShop } from '@/context/ShopContext'
import { useUser } from '@/context/UserContext'
import { Store, BarChart3 } from 'lucide-react'
import CustomDropdown from './CustomDropdown'

export default function ShopSelector() {
    const { activeShop, shops, setActiveShop, isRestricted } = useShop()
    const { profile } = useUser()

    if (!activeShop) return null

    // Filter list to show ONLY the assigned shop if restricted
    const availableShops = isRestricted 
        ? shops.filter(s => s.id === profile?.shop_id)
        : shops

    const shopOptions = [
        ...(!isRestricted ? [{
            label: 'Toutes les boutiques',
            value: 0,
            icon: <BarChart3 className="w-4 h-4" />
        }] : []),
        ...availableShops.map(shop => ({
            label: shop.name,
            value: shop.id,
            icon: <Store className="w-4 h-4" />
        }))
    ]

    const handleSelect = (id: number) => {
        if (isRestricted && id !== profile?.shop_id) return
        
        if (id === 0) {
            setActiveShop({ id: 0, name: 'Toutes les boutiques', slug: 'all', colors: { primary: "239 84% 67%", secondary: "43 100% 70%", accent: "239 84% 67%" } } as any)
        } else {
            const shop = shops.find(s => s.id === id)
            if (shop) setActiveShop(shop)
        }
    }

    return (
        <CustomDropdown 
            options={shopOptions}
            value={activeShop.id}
            onChange={handleSelect}
            disabled={isRestricted || availableShops.length <= 1}
            label={isRestricted ? "Boutique Assignée" : "Vue Actuelle"}
            className="min-w-[220px]"
        />
    )
}