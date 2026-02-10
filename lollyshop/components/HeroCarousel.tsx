
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

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
    const [isAutoPlaying, setIsAutoPlaying] = useState(true)

    const nextSlide = useCallback(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
    }, [slides.length])

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
    }

    useEffect(() => {
        if (!isAutoPlaying || !slides || slides.length <= 1) return
        const timer = setInterval(nextSlide, 6000)
        return () => clearInterval(timer)
    }, [isAutoPlaying, nextSlide, slides])

    if (!slides || slides.length === 0) return null

    return (
        <section className="relative h-[80vh] md:h-[92vh] w-full overflow-hidden bg-[#050505]">
            {/* Cinematic Background Grain / Overlay */}
            <div className="absolute inset-0 z-20 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {slides.map((slide, index) => (
                <div 
                    key={index}
                    className={`absolute inset-0 transition-all duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1) ${
                        index === current ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                    }`}
                >
                    <Image 
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className={`object-cover brightness-[0.5] transition-transform duration-[10000ms] ease-linear ${
                            index === current ? 'scale-110' : 'scale-100'
                        }`}
                        priority={index === 0}
                    />
                    
                    {/* Content Container */}
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                        <div className="container mx-auto px-6 md:px-12">
                            <div className="max-w-4xl">
                                {/* Brand Badge */}
                                <div 
                                    className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 mb-8 transition-all duration-1000 delay-300 transform ${
                                        index === current ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                    }`}
                                    style={{ backgroundColor: `${slide.color}20` }}
                                >
                                    <Sparkles className="w-3 h-3" style={{ color: slide.color }} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                                        {slide.brand} EXCLUSIVE
                                    </span>
                                </div>

                                {/* Main Heading */}
                                <h2 className={`text-5xl md:text-[8vw] font-black uppercase tracking-tighter leading-[0.85] text-white mb-8 transition-all duration-1000 delay-500 transform ${
                                    index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                                }`}>
                                    {slide.title.split(' ').map((word, i) => (
                                        <span key={i} className={i % 2 === 1 ? 'shop-gradient-text italic' : ''}>
                                            {word}{' '}
                                        </span>
                                    ))}
                                </h2>

                                {/* Subtitle */}
                                <p className={`text-gray-300 font-medium text-sm md:text-xl max-w-xl mb-12 transition-all duration-1000 delay-700 transform ${
                                    index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                                }`}>
                                    {slide.subtitle}
                                </p>

                                {/* CTA Button */}
                                <div className={`transition-all duration-1000 delay-1000 transform ${
                                    index === current ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                                }`}>
                                    <Link 
                                        href="#shop" 
                                        className="group relative inline-flex items-center justify-center px-10 py-5 overflow-hidden font-black uppercase text-[10px] tracking-[0.2em] transition-all bg-white text-black rounded-full hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                                    >
                                        <span className="relative z-10">Explorer l'Univers</span>
                                        <ArrowRight className="relative z-10 w-4 h-4 ml-3 group-hover:translate-x-2 transition-transform" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-shop to-shop-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation Controls - Desktop */}
            <div className="hidden md:flex absolute inset-y-0 left-8 items-center z-40">
                <button onClick={prevSlide} className="p-4 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all backdrop-blur-sm">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>
            <div className="hidden md:flex absolute inset-y-0 right-8 items-center z-40">
                <button onClick={nextSlide} className="p-4 rounded-full border border-white/10 text-white hover:bg-white hover:text-black transition-all backdrop-blur-sm">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Premium Indicators */}
            <div className="absolute bottom-12 left-0 right-0 z-40 flex justify-center items-end px-6 space-x-4">
                {slides.map((_, i) => (
                    <button 
                        key={i}
                        onClick={() => setCurrent(i)}
                        className="group flex flex-col items-start space-y-2"
                    >
                        <span className={`text-[8px] font-black transition-all ${i === current ? 'text-white translate-y-0' : 'text-white/20 translate-y-2 opacity-0'}`}>
                            0{i + 1}
                        </span>
                        <div className="relative w-12 md:w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            {i === current && (
                                <div className="absolute inset-0 bg-white animate-progress-bar origin-left" />
                            )}
                            <div className={`absolute inset-0 bg-white/40 transition-transform duration-500 ${i === current ? 'scale-x-100' : 'scale-x-0'}`} />
                        </div>
                    </button>
                ))}
            </div>

            <style jsx>{`
                @keyframes progress-bar {
                    0% { transform: scale-x(0); }
                    100% { transform: scale-x(1); }
                }
                .animate-progress-bar {
                    animation: progress-bar 6s linear infinite;
                }
            `}</style>
        </section>
    )
}
