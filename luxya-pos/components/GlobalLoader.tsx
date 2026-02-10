
import React from 'react'

export default function GlobalLoader() {
    return (
        <div className="fixed inset-0 z-[999] bg-[#0a0a0c] flex flex-col items-center justify-center space-y-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-shop/20 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-shop border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
                LUXYA SYSTEM
            </p>
        </div>
    )
}
