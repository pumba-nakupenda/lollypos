'use client'

import React from 'react'
import { X, ShoppingBag, Trash2, Send, Plus, Minus, ShieldCheck, Truck } from 'lucide-react'
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
        let message = `*COMMANDE LOLLY SHOP*\n\n`
        
        cart.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*\n`
            message += `   Qté: ${item.quantity} | Prix: ${item.price.toLocaleString()} CFA\n`
        });

        message += `\n*TOTAL: ${cartTotal.toLocaleString()} CFA*`
        message += `\n\n_Merci de confirmer ma livraison (Dakar/Région)._`

        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Overlay ultra léger sans flou */}
            <div className="absolute inset-0 bg-black/5 pointer-events-auto" onClick={onClose} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex pointer-events-auto">
                <div className="w-screen max-w-md bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 flex flex-col">
                    
                    {/* Amazon-Style Sub-Header */}
                    <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-b border-gray-100">
                        <span className="text-[9px] font-black text-green-600 uppercase flex items-center">
                            <Truck className="w-3 h-3 mr-1" /> Livraison Express 24h Disponible
                        </span>
                        <button onClick={onClose} className="text-gray-400 hover:text-black transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-6 py-6 border-b border-gray-50">
                        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center">
                            Sous-total <span className="text-[#0055ff] ml-2">({cartCount} articles)</span>
                        </h2>
                        <p className="text-2xl font-black mt-1">{cartTotal.toLocaleString()} <span className="text-sm font-bold">CFA</span></p>
                        
                        <button 
                            onClick={handleWhatsAppOrder}
                            disabled={cart.length === 0}
                            className="w-full mt-4 py-4 bg-[#fde700] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#f5d600] transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                            Passer la commande
                        </button>

                        <button 
                            onClick={onClose}
                            className="w-full mt-2 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                        >
                            Continuer mes achats
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <ShoppingBag className="w-16 h-16 text-gray-100" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Votre panier est vide</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex space-x-4 border-b border-gray-50 pb-6 group">
                                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                        {item.image ? (
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200"><ShoppingBag className="w-8 h-8" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-900 uppercase line-clamp-2 leading-tight">{item.name}</h3>
                                            <p className="text-[#0055ff] font-black text-sm mt-1">{item.price.toLocaleString()} CFA</p>
                                            <p className="text-[9px] font-bold text-green-600 uppercase mt-1">En stock</p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4 mt-2">
                                            <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-[#0055ff] transition-colors"><Minus className="w-3 h-3" /></button>
                                                <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-[#0055ff] transition-colors"><Plus className="w-3 h-3" /></button>
                                            </div>
                                            <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-bold text-red-500 uppercase hover:underline">Supprimer</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Reassurance */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center space-x-3 text-gray-500">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <div className="leading-tight">
                                <p className="text-[10px] font-black uppercase text-gray-900 tracking-tighter">Paiement Sécurisé</p>
                                <p className="text-[8px] font-bold uppercase tracking-widest">À la livraison ou via Wave/OM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
