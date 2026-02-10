
'use client'

import React from 'react'
import { X, ShoppingBag, Trash2, Send, Plus, Minus } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import Image from 'next/image'

interface CartDrawerProps {
    isOpen: boolean
    onClose: () => void
    whatsappNumber?: string
}

export default function CartDrawer({ isOpen, onClose, whatsappNumber }: CartDrawerProps) {
    const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart()

    const handleWhatsAppOrder = () => {
        const phone = whatsappNumber || "221772354747"
        let message = `*NOUVELLE COMMANDE LOLLY SHOP*\n\n`
        
        cart.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*\n`
            message += `   Qté: ${item.quantity} | Prix: ${item.price.toLocaleString()} CFA\n`
        });

        message += `\n*TOTAL COMMANDE: ${cartTotal.toLocaleString()} CFA*`
        message += `\n\n_Veuillez confirmer ma commande s'il vous plaît._`

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
                    
                    {/* Header */}
                    <div className="px-6 py-8 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <ShoppingBag className="w-6 h-6 text-[#0055ff]" />
                            <h2 className="text-xl font-black uppercase tracking-tighter">Mon Panier <span className="text-gray-300 text-sm">({cartCount})</span></h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Votre panier est vide</p>
                                <button onClick={onClose} className="text-[#0055ff] font-black uppercase text-[10px] tracking-[0.2em] hover:underline">Continuer le shopping</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-4 group bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shrink-0 shadow-sm">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag className="w-8 h-8" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xs font-black uppercase truncate text-gray-800">{item.name}</h3>
                                            <p className="text-[#0055ff] font-black italic text-xs mt-1">{item.price.toLocaleString()} CFA</p>
                                            
                                            {/* Quantity Controls */}
                                            <div className="flex items-center space-x-3 mt-3 bg-white w-fit rounded-full px-2 py-1 shadow-sm border border-gray-100">
                                                <button 
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="p-1 hover:bg-gray-50 rounded-full transition-colors"
                                                >
                                                    <Minus className="w-3 h-3 text-gray-400" />
                                                </button>
                                                <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="p-1 hover:bg-gray-50 rounded-full transition-colors"
                                                >
                                                    <Plus className="w-3 h-3 text-[#0055ff]" />
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {cart.length > 0 && (
                        <div className="p-6 bg-white border-t border-gray-100 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total estimé</span>
                                <span className="text-2xl font-black italic">{cartTotal.toLocaleString()} <span className="text-[10px] not-italic font-bold">CFA</span></span>
                            </div>
                            
                            <button 
                                onClick={handleWhatsAppOrder}
                                className="w-full py-5 bg-[#25D366] text-white rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20"
                            >
                                <Send className="w-4 h-4 mr-2 fill-white" /> Commander sur WhatsApp
                            </button>
                            
                            <p className="text-[8px] text-center text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                Les prix incluent la TVA. Livraison calculée au message.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
