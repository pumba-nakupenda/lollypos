'use client'

import React, { useState } from 'react'
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import Image from 'next/image'

interface LightboxProps {
    isOpen: boolean
    src: string
    onClose: () => void
}

export default function SiteImageLightbox({ isOpen, src, onClose }: LightboxProps) {
    const [scale, setScale] = useState(1)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-white/95 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Controls */}
            <div className="absolute top-6 right-6 flex items-center space-x-4 z-10">
                <div className="flex bg-gray-100 rounded-full p-1.5 border border-gray-200">
                    <button
                        onClick={() => setScale(Math.max(1, scale - 0.5))}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 disabled:opacity-30"
                        disabled={scale <= 1}
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setScale(Math.min(3, scale + 0.5))}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-600 disabled:opacity-30"
                        disabled={scale >= 3}
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-black text-white rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                <div
                    className="relative w-full h-full max-w-5xl max-h-5xl animate-in zoom-in-95 duration-500 pointer-events-auto"
                    style={{
                        transform: `scale(${scale})`,
                        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    <Image
                        src={src}
                        alt="Full Preview"
                        fill
                        className="object-contain"
                        priority
                        sizes="100vw"
                    />
                </div>
            </div>

            {/* Helper Text */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/5 px-4 py-2 rounded-full border border-black/5 pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Pincement ou molette pour zoomer</p>
            </div>
        </div>
    )
}
