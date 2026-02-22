'use client'

import React from 'react'
import { useShop } from '@/context/ShopContext'
import { useUser } from '@/context/UserContext'
import { Store, BarChart3 } from 'lucide-react'
import CustomDropdown from './CustomDropdown'

export default function ShopSelector() {
    const { activeShop, shops, setActiveShop, isRestricted } = useShop()

    if (!activeShop) return null

    const shopOptions = shops.map(shop => ({
        label: shop.name,
        value: shop.id,
        icon: shop.id === 0 ? <BarChart3 className="w-4 h-4" /> : <Store className="w-4 h-4" />
    }))

    const handleSelect = (id: number) => {
        const shop = shops.find(s => s.id === id)
        if (shop) setActiveShop(shop)
    }

    return (
        <CustomDropdown 
            options={shopOptions}
            value={activeShop.id}
            onChange={handleSelect}
            disabled={shops.length <= 1}
            label={isRestricted ? (shops.length > 1 ? "Boutiques Accessibles" : "Boutique Assignée") : "Vue Actuelle"}
            className="min-w-[220px]"
        />
    )
}