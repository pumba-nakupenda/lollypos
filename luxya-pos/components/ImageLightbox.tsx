'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Portal } from '@radix-ui/react-portal'

interface ImageLightboxProps {
    src: string
    isOpen: boolean
    onClose: () => void
    alt?: string
}

export default function ImageLightbox({ src, isOpen, onClose, alt }: ImageLightboxProps) {
    if (!isOpen) return null

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            >
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[1001]"
                >
                    <X className="w-8 h-8" />
                </button>

                <div
                    className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={src}
                        alt={alt || "Aperçu"}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
            </div>
        </Portal>
    )
}
