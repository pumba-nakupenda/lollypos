'use client'

import React from 'react';
import { X, Minus, Plus, Trash2, Banknote, Wallet, RefreshCw, LayoutDashboard } from 'lucide-react';
import CustomDropdown from '@/components/CustomDropdown';

interface CartSidebarProps {
    cart: any[];
    setCart: React.Dispatch<React.SetStateAction<any[]>>;
    addToCart: (p: any, variant?: any) => void;
    updateCartItemPrice: (id: string | number, price: number) => void;
    products: any[];
    isCartOpen: boolean;
    setIsCartOpen: (val: boolean) => void;
    paymentMethod: 'Cash' | 'Wave' | 'OM';
    setPaymentMethod: (val: 'Cash' | 'Wave' | 'OM') => void;
    receivedAmount: string;
    setReceivedAmount: (val: string) => void;
    totalAmount: number;
    isCheckingOut: boolean;
    handleCheckout: () => void;
    projects: any[];
    selectedProjectId: string | null;
    setSelectedProjectId: (val: string | null) => void;
}

export default function CartSidebar({
    cart, setCart, addToCart, updateCartItemPrice, products,
    isCartOpen, setIsCartOpen, paymentMethod, setPaymentMethod,
    receivedAmount, setReceivedAmount, totalAmount, isCheckingOut, handleCheckout,
    projects, selectedProjectId, setSelectedProjectId
}: CartSidebarProps) {
    
    return (
        <aside className={`fixed inset-y-0 right-0 z-[150] w-full sm:w-[420px] bg-[#0a0a0c] transition-transform duration-500 transform lg:static lg:translate-x-0 lg:w-[420px] lg:m-4 lg:rounded-[40px] lg:shadow-2xl ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
            <div className="flex flex-col h-full overflow-hidden lg:rounded-[40px] glass-panel border-none">
                <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">Panier</h2>
                        <div className="flex items-center space-x-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-black">{cart.length} Articles</p>
                            <button onClick={() => setCart([])} className="text-[8px] font-black text-red-400 uppercase hover:underline ml-2">Vider</button>
                        </div>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                    {cart.map(item => (
                        <div key={item.cartItemId} className="glass-card p-3 sm:p-4 rounded-3xl flex items-center space-x-4 border-transparent hover:border-shop/20 transition-all group">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 text-base sm:text-lg uppercase">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-black text-shop">{item.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[10px] sm:text-xs truncate text-white">{item.name}</h4>
                                <div className="flex items-center">
                                    <input type="number" value={item.price} onChange={(e) => updateCartItemPrice(item.id, parseFloat(e.target.value))} className="w-16 sm:w-20 bg-black/20 border border-white/5 rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-shop outline-none" />
                                    <span className="text-[7px] sm:text-[8px] font-black text-muted-foreground uppercase ml-1">CFA</span>
                                </div>
                            </div>
                            <div className="flex items-center bg-white/5 rounded-xl border border-white/5 p-1">
                                <button onClick={() => setCart(cart.map(i => i.cartItemId === item.cartItemId && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))} className="p-1 hover:text-shop transition-colors"><Minus className="w-3 h-3 text-white" /></button>
                                <span className="w-6 sm:w-8 text-center text-[10px] sm:text-xs font-black text-white">{item.quantity}</span>
                                <button onClick={() => { const p = products.find(p => p.id === item.id); if (p) addToCart(p, item.variantInfo); }} className="p-1 hover:text-shop transition-colors"><Plus className="w-3 h-3 text-white" /></button>
                            </div>
                            <button onClick={() => setCart(cart.filter(i => i.cartItemId !== item.cartItemId))} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <div className="p-6 sm:p-8 bg-white/[0.02] border-t border-white/5 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Lier à un Projet (Optionnel)</label>
                        <CustomDropdown
                            options={[
                                { label: 'Ne pas lier', value: '' },
                                ...projects.map(p => ({
                                    label: p.name,
                                    value: p.id,
                                    icon: <LayoutDashboard className="w-4 h-4" />
                                }))
                            ]}
                            value={selectedProjectId || ''}
                            onChange={val => setSelectedProjectId(val || null)}
                            placeholder="Lier à un Projet..."
                            searchable={projects.length > 5}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {(['Cash', 'Wave', 'OM'] as const).map(m => (
                            <button key={m} onClick={() => setPaymentMethod(m)} className={`flex flex-col items-center py-2.5 rounded-2xl border transition-all ${paymentMethod === m ? 'bg-shop text-white border-shop' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                                {m === 'Cash' ? <Banknote className="w-3.5 h-3.5" /> : <Wallet className="w-3.5 h-3.5" />}
                                <span className="text-[7px] sm:text-[8px] font-black uppercase mt-1">{m}</span>
                            </button>
                        ))}
                    </div>
                    {paymentMethod === 'Cash' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Reçu</label>
                                <input
                                    type="number"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    placeholder="Montant reçu..."
                                    className="w-32 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-right text-xs font-black text-white outline-none focus:border-shop/50"
                                />
                            </div>
                            {parseFloat(receivedAmount) > totalAmount && (
                                <div className="flex justify-between items-center px-1 text-green-400">
                                    <span className="text-[10px] font-black uppercase">Monnaie à rendre</span>
                                    <span className="text-sm font-black">{(parseFloat(receivedAmount) - totalAmount).toLocaleString()} CFA</span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-xs font-black text-muted-foreground uppercase">TOTAL</span>
                        <span className="text-2xl sm:text-3xl font-black text-shop">{totalAmount.toLocaleString()} CFA</span>
                    </div>
                    <button disabled={cart.length === 0 || isCheckingOut} onClick={handleCheckout} className="w-full py-4 sm:py-5 bg-shop text-white rounded-[24px] sm:rounded-[28px] font-black text-lg shadow-2xl transition-all active:scale-95 uppercase tracking-widest">
                        {isCheckingOut ? <RefreshCw className="animate-spin mx-auto w-6 h-6" /> : 'ENCAISSER'}
                    </button>
                </div>
            </div>
        </aside>
    );
}
