
'use client'

import React from 'react'
import { X, ChevronRight, User, ShoppingBag, Sparkles, Laptop, Zap, Info } from 'lucide-react'
import Link from 'next/link'

interface MegaMenuProps {
    isOpen: boolean
    onClose: () => void
    categories: string[]
}

export default function MegaMenu({ isOpen, onClose, categories }: MegaMenuProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[300] flex animate-in fade-in duration-300">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            {/* Menu Panel */}
            <div className="relative w-[300px] md:w-[380px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                
                {/* Header (Amazon Style Profile) */}
                <div className="bg-[#232f3e] p-6 flex items-center justify-between text-white">
                    <div className="flex items-center space-x-4">
                        <img src="/logo_white.png" alt="Logo" className="h-6 w-auto" />
                        <h2 className="text-sm font-bold">Bonjour, Invité</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    
                    {/* Univers Sections */}
                    <div className="px-6 py-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Par Univers</h3>
                        <div className="space-y-4">
                            <MenuLink 
                                href="/?shop=1" 
                                icon={<div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center mr-3"><Sparkles className="w-4 h-4 text-pink-500" /></div>}
                                label="Luxya Beauté" 
                                onClick={onClose}
                            />
                            <MenuLink 
                                href="/?shop=2" 
                                icon={<div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mr-3"><Laptop className="w-4 h-4 text-blue-500" /></div>}
                                label="Homtek Tech" 
                                onClick={onClose}
                            />
                        </div>
                    </div>

                    <div className="h-1 bg-gray-100 my-2" />

                    {/* All Categories Section */}
                    <div className="px-6 py-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Catégories</h3>
                        <div className="space-y-4">
                            {categories.map((cat) => (
                                <MenuLink 
                                    key={cat}
                                    href={`/?cat=${cat}`}
                                    label={cat}
                                    onClick={onClose}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="h-1 bg-gray-100 my-2" />

                    {/* Settings & Info */}
                    <div className="px-6 py-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">Aide & Paramètres</h3>
                        <div className="space-y-4">
                            <MenuLink 
                                href="/?sort=promo" 
                                icon={<Zap className="w-4 h-4 text-[#febd69] mr-3" />}
                                label="Promotions du moment" 
                                onClick={onClose}
                            />
                            <MenuLink 
                                href="/conditions" 
                                icon={<Info className="w-4 h-4 text-gray-400 mr-3" />}
                                label="Conditions de Vente" 
                                onClick={onClose}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center italic">
                    Lolly Shop Senegal &copy; 2026
                </div>
            </div>
        </div>
    )
}

function MenuLink({ href, label, icon, onClick }: any) {
    return (
        <Link 
            href={href} 
            onClick={onClick}
            className="flex items-center justify-between group hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-all"
        >
            <div className="flex items-center">
                {icon}
                <span className="text-sm font-medium text-gray-700 group-hover:text-lolly">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
        </Link>
    )
}
