'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Slide {
    id?: number
    title: string
    brand: string
    subtitle: string
    image: string
    color: string
}

interface HeroCarouselProps {
    slides: Slide[]
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
    const [current, setCurrent] = useState(0)

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
    }, [slides.length])

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
    }

    useEffect(() => {
        if (!slides || slides.length <= 1) return
        const timer = setInterval(nextSlide, 8000)
        return () => clearInterval(timer)
    }, [nextSlide, slides])

    if (!slides || slides.length === 0) return null

    return (
        <section className="relative h-[400px] md:h-[600px] w-full overflow-hidden bg-[#eaeded]">
            {/* Amazon-Style Bottom Gradient Fade */}
            <div className="absolute inset-x-0 bottom-0 h-40 md:h-80 bg-gradient-to-t from-[#eaeded] to-transparent z-20 pointer-events-none" />

            {slides.map((slide, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <Image 
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        priority={index === 0}
                    />
                </div>
            ))}

            {/* Navigation Arrows */}
            <button 
                onClick={prevSlide} 
                className="absolute left-0 inset-y-0 w-20 flex items-center justify-center z-30 group hover:ring-2 hover:ring-[#007185] focus:ring-2 focus:ring-[#007185] transition-all"
            >
                <div className="p-4 rounded bg-white/0 group-hover:bg-white/10">
                    <ChevronLeft className="w-10 h-10 text-black opacity-60" />
                </div>
            </button>
            <button 
                onClick={nextSlide} 
                className="absolute right-0 inset-y-0 w-20 flex items-center justify-center z-30 group hover:ring-2 hover:ring-[#007185] focus:ring-2 focus:ring-[#007185] transition-all"
            >
                <div className="p-4 rounded bg-white/0 group-hover:bg-white/10">
                    <ChevronRight className="w-10 h-10 text-black opacity-60" />
                </div>
            </button>
        </section>
    )
}
