'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PriceSliderProps {
    min?: number
    max?: number
    step?: number
    currency?: string
}

export default function PriceSlider({
    min = 0,
    max = 200000,
    step = 1000,
    currency = "CFA"
}: PriceSliderProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse current price from URL: "min-max"
    const currentPriceParam = searchParams.get('price') || ''
    const initialRange = currentPriceParam.includes('-')
        ? currentPriceParam.split('-').map(Number)
        : [min, max]

    const [range, setRange] = useState({
        min: !isNaN(initialRange[0]) ? initialRange[0] : min,
        max: !isNaN(initialRange[1]) ? initialRange[1] : max
    })

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Update local state if URL changes (e.g. on reset) or props change
    useEffect(() => {
        if (!currentPriceParam) {
            setRange({ min, max })
        } else if (currentPriceParam.includes('-')) {
            const [uMin, uMax] = currentPriceParam.split('-').map(Number)
            setRange({ min: uMin, max: uMax })
        }
    }, [currentPriceParam, min, max])

    const updateUrl = useCallback((newMin: number, newMax: number) => {
        const params = new URLSearchParams(searchParams.toString())
        if (newMin === min && newMax === max) {
            params.delete('price')
        } else {
            params.set('price', `${newMin}-${newMax}`)
        }
        router.push(`/?${params.toString()}`, { scroll: false })
    }, [router, searchParams, min, max])

    // Handle slider changes
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(e.target.value), range.max - step)
        setRange(prev => ({ ...prev, min: value }))
    }

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(e.target.value), range.min + step)
        setRange(prev => ({ ...prev, max: value }))
    }

    // Debounce URL update when user stops sliding
    useEffect(() => {
        const timer = setTimeout(() => {
            if (range.min !== initialRange[0] || range.max !== initialRange[1]) {
                updateUrl(range.min, range.max)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [range, updateUrl, initialRange])

    const minPos = ((range.min - min) / (max - min)) * 100
    const maxPos = ((range.max - min) / (max - min)) * 100

    // IMPORTANT: Return placeholder until mounted to avoid hydration mismatch
    // But do it AFTER all hooks are declared to satisfy Rules of Hooks
    if (!isMounted) {
        return <div className="w-full h-24 bg-gray-50/50 animate-pulse rounded-2xl border border-gray-100/50" />
    }

    return (
        <div className="w-full px-2 py-4">
            <div className="flex justify-between items-center mb-6">
                <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-900">
                        {range.min.toLocaleString()} <span className="opacity-40 text-[8px]">{currency}</span>
                    </span>
                </div>
                <div className="h-px bg-gray-100 w-4" />
                <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-900">
                        {range.max.toLocaleString()} <span className="opacity-40 text-[8px]">{currency}</span>
                    </span>
                </div>
            </div>

            <div className="relative h-1.5 bg-gray-100 rounded-full mb-8">
                {/* Highlighted range track */}
                <div
                    className="absolute h-full bg-[#0055ff] rounded-full transition-all duration-150"
                    style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                />

                {/* Min Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={range.min}
                    onChange={handleMinChange}
                    className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer z-10 
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto 
                    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0055ff] 
                    [&::-webkit-slider-thumb]:shadow-lg active:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                />

                {/* Max Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={range.max}
                    onChange={handleMaxChange}
                    className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none cursor-pointer z-20
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto 
                    [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0055ff] 
                    [&::-webkit-slider-thumb]:shadow-lg active:[&::-webkit-slider-thumb]:scale-125 transition-transform"
                />
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {[
                    { label: '-10k', min: 0, max: 10000 },
                    { label: '50k+', min: 50000, max: 200000 }
                ].map(p => (
                    <button
                        key={p.label}
                        onClick={() => { setRange({ min: p.min, max: p.max }); updateUrl(p.min, p.max); }}
                        className="px-2 py-1 rounded-lg bg-gray-50 text-[9px] font-black text-gray-500 hover:bg-gray-100 hover:text-black transition-all"
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
