'use client'

import React, { useState, useEffect } from 'react';
import { 
    Search, ShoppingCart, Plus, Minus, Trash2, Check, RefreshCw, 
    LayoutDashboard, User, Calendar, Banknote, Wallet, FileText, 
    MessageSquare, Trash, Pencil, ArrowRight, Truck, PlusCircle, Sparkles, X, Clock, Receipt, LogOut 
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useShop } from '@/context/ShopContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import ShopSelector from '@/components/ShopSelector';
import ReceiptModal from '@/components/ReceiptModal';
import ExpiryBadge from '@/components/ExpiryBadge';
import { API_URL } from '@/utils/api';

export default function SalesTerminal() {
    const { activeShop } = useShop();
    const { profile } = useUser();
    const { showToast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Wave' | 'OM'>('Cash');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [categories, setCategories] = useState<string[]>(['Toutes']);
    const [selectedCategory, setSelectedCategory] = useState('Toutes');
    const [isAgency, setIsAgency] = useState(false);
    
    // Agency state
    const [agencyLines, setAgencyLines] = useState<any[]>([]);
    const [docType, setDocType] = useState<'quote' | 'invoice' | 'delivery_note'>('quote');
    const [withTva, setWithTva] = useState(false);
    const [paidAmount, setPaidAmount] = useState('0');
    const [productSearch, setProductSearch] = useState('');
    const [agencyHistory, setAgencyHistory] = useState<any[]>([]);
    const [editingDocId, setEditingDocId] = useState<number | null>(null);
    const [linkedDocNumber, setLinkedDocNumber] = useState<string | null>(null);

    const [lastSale, setLastSale] = useState<any>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');

    useEffect(() => {
        if (activeShop) {
            fetchProducts();
            fetchHistory();
            fetchCustomers();
            setIsAgency(activeShop.id === 3);
        }
    }, [activeShop]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/products?shopId=${activeShop?.id}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
                const cats = new Set(data.map((p: any) => p.category).filter(Boolean));
                setCategories(['Toutes', ...Array.from(cats) as string[]]);
            }
        } catch (e) {
            showToast("Erreur de chargement des produits", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            // L'endpoint est simplement 'sales', le filtrage se fait par shopId
            const res = await fetch(`${API_URL}/sales?shopId=${activeShop?.id}`);
            if (res.ok) {
                setAgencyHistory(await res.json());
            }
        } catch (e) {}
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`${API_URL}/customers`);
            if (res.ok) setAllCustomers(await res.json());
        } catch (e) {}
    };

    const addToCart = (product: any) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        if (!isCartOpen && window.innerWidth >= 1024) setIsCartOpen(true);
    };

    const updateCartItemPrice = (id: number, newPrice: number) => {
        setCart(cart.map(item => item.id === id ? { ...item, price: newPrice } : item));
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Toutes' || p.category === selectedCategory;
        return matchesSearch && matchesCategory && p.show_on_pos !== false;
    });

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = isAgency 
        ? agencyLines.reduce((sum, l) => sum + (l.price * l.quantity), 0)
        : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const subTotalHT = totalAmount / 1.18;
    const change = receivedAmount ? parseFloat(receivedAmount) - totalAmount : 0;

    const isGlobalView = activeShop?.id === 0;

    const handleCheckout = async () => {
        if (isGlobalView) {
            showToast("Action impossible en vue globale. Sélectionnez une boutique.", "error");
            return;
        }
        setIsCheckingOut(true);
        const payload = isAgency ? {
            type: docType,
            customer_name: customerName,
            total_amount: totalAmount,
            paid_amount: parseFloat(paidAmount),
            shop_id: activeShop?.id,
            items: agencyLines,
            with_tva: withTva,
            status: parseFloat(paidAmount) >= totalAmount ? 'paid' : (parseFloat(paidAmount) > 0 ? 'partial' : 'pending'),
            linked_doc_number: linkedDocNumber
        } : {
            customer_name: customerName || 'Client Comptant',
            total_amount: totalAmount,
            payment_method: paymentMethod,
            shop_id: activeShop?.id,
            created_at: new Date(saleDate).toISOString(),
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }))
        };

        try {
            const endpoint = editingDocId ? `sales/${editingDocId}` : 'sales';
            const method = editingDocId ? 'PATCH' : 'POST';
            
            const res = await fetch(`${API_URL}/${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                showToast(isAgency ? "Document enregistré" : "Vente réussie !", "success");
                if (!isAgency) {
                    setLastSale(result);
                    setIsReceiptOpen(true);
                    setCart([]);
                    setReceivedAmount('');
                } else {
                    setAgencyLines([]);
                    setEditingDocId(null);
                    setLinkedDocNumber(null);
                }
                setCustomerName('');
                fetchHistory();
                fetchProducts();
            }
        } catch (e) {
            showToast("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleViewReceipt = (sale: any) => {
        setLastSale(sale);
        setIsReceiptOpen(true);
    };

    const addAgencyLine = () => {
        setAgencyLines([...agencyLines, { id: Date.now(), name: '', quantity: 1, price: 0 }]);
    };

    const updateAgencyLine = (id: number, field: string, value: any) => {
        setAgencyLines(agencyLines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const addProductToAgency = (p: any) => {
        setAgencyLines([...agencyLines, { id: Date.now(), name: p.name, quantity: 1, price: p.price, product_id: p.id }]);
    };

    return (
        <div className="flex h-screen bg-background relative overflow-hidden">
            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${isCartOpen ? 'lg:mr-[400px]' : ''}`}>
                {/* Top Header */}
                <header className="h-20 sm:h-24 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-10 z-30 sticky top-0">
                    <div className="flex items-center space-x-4 sm:space-x-8 overflow-hidden">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white font-museo">
                                LOLLY<span className="text-shop">POS</span>
                            </h1>
                            <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">Système de Vente Premium</p>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                        <ShopSelector />
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {profile?.role === 'cashier' && (
                            <form action="/auth/signout" method="post">
                                <button type="submit" className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-muted-foreground hover:text-red-400 transition-all">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </form>
                        )}
                        <button onClick={() => window.location.reload()} className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                {/* Mobile Tabs Controller */}
                <div className="lg:hidden flex p-2 bg-black/20 backdrop-blur-md border-b border-white/5 sticky top-20 sm:top-24 z-20">
                    <button 
                        onClick={() => setActiveTab('shop')}
                        className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'shop' ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground'}`}
                    >
                        <ShoppingCart className="w-3.5 h-3.5 mr-2" /> Catalogue
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground'}`}
                    >
                        <Clock className="w-3.5 h-3.5 mr-2" /> Historique
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar">
                    {/* Catalog Content (Shop Tab) */}
                    {(activeTab === 'shop' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                        <div className={activeTab === 'history' ? 'hidden lg:block' : ''}>
                            {!isAgency ? (
                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                                        <div className="flex-1 relative group">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-shop transition-colors" />
                                            <input 
                                                type="text" 
                                                placeholder="Rechercher un produit..."
                                                className="w-full h-16 sm:h-20 bg-white/5 border border-white/10 rounded-[24px] sm:rounded-3xl pl-16 pr-6 text-sm font-bold focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar md:w-auto">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`px-6 sm:px-8 h-16 sm:h-20 rounded-[24px] sm:rounded-3xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                                        selectedCategory === cat 
                                                        ? 'bg-shop border-shop text-white shadow-xl shadow-shop/20 scale-95' 
                                                        : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-8">
                                            {[...Array(10)].map((_, i) => (
                                                <div key={i} className="aspect-square bg-white/5 rounded-[32px] sm:rounded-[40px] animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-8 pb-32">
                                            {filteredProducts.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => addToCart(p)}
                                                    className="group relative bg-white/[0.03] border border-white/5 rounded-[32px] sm:rounded-[40px] p-4 sm:p-6 text-left hover:bg-white/[0.08] hover:border-shop/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 overflow-hidden shadow-lg"
                                                >
                                                    <div className="relative aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden mb-4 sm:mb-6 bg-black/20">
                                                        {p.image ? (
                                                            <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <LayoutDashboard className="w-8 h-8 text-white/10" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-3 right-3">
                                                            <ExpiryBadge expiryDate={p.expiry_date} />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 sm:space-y-2">
                                                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-shop transition-colors">{p.category}</p>
                                                        <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{p.name}</h3>
                                                        <div className="flex items-center justify-between pt-2 sm:pt-4">
                                                            <p className="text-sm sm:text-lg font-black text-white">{Number(p.price).toLocaleString()} <span className="text-[10px] text-muted-foreground ml-1">CFA</span></p>
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-shop group-hover:text-white transition-all">
                                                                <Plus className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="absolute top-4 left-4">
                                                        <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${
                                                            p.stock <= 5 ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'
                                                        }`}>
                                                            Stock: {p.stock}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Agency Document UI (Simplified for tabs) */}
                                    <div className="glass-panel p-6 sm:p-10 rounded-[40px] border-white/5 bg-white/[0.01] space-y-8">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-shop" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white font-museo">Édition Document</h2>
                                                    <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gestion des devis et factures</p>
                                                </div>
                                            </div>
                                            <div className="flex bg-white/5 p-1.5 rounded-[20px] border border-white/10 w-full md:w-auto">
                                                {(['quote', 'invoice', 'delivery_note'] as const).map(t => (
                                                    <button key={t} onClick={() => setDocType(t)} className={`flex-1 md:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${docType === t ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}>
                                                        {t === 'quote' ? 'Devis' : t === 'invoice' ? 'Facture' : 'Bon Livr.'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Simplified agency form context */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Destinataire (Nom / Entreprise)</label>
                                                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ex: Client ABC..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Recherche Produit Rapide</label>
                                                <div className="relative group">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-shop transition-colors" />
                                                    <input 
                                                        list="agency-product-list"
                                                        value={productSearch}
                                                        onChange={e => setProductSearch(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                const found = products.find(p => p.name.toLowerCase() === productSearch.toLowerCase());
                                                                if (found) {
                                                                    addProductToAgency(found);
                                                                    setProductSearch('');
                                                                }
                                                            }
                                                        }}
                                                        placeholder="Chercher..." 
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white" 
                                                    />
                                                    <datalist id="agency-product-list">
                                                        {products.map(p => <option key={p.id} value={p.name}>{p.price.toLocaleString()} FCFA</option>)}
                                                    </datalist>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {agencyLines.map(l => (
                                                <div key={l.id} className="flex items-center space-x-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                                                    <input value={l.name} onChange={e => updateAgencyLine(l.id, 'name', e.target.value)} placeholder="Désignation..." className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-white" />
                                                    <div className="flex items-center space-x-2 bg-black/20 rounded-xl px-2 py-1">
                                                        <input type="number" value={l.quantity} onChange={e => updateAgencyLine(l.id, 'quantity', parseInt(e.target.value))} className="w-10 bg-transparent text-center text-xs font-black text-white outline-none" />
                                                        <span className="text-[8px] font-black opacity-30">QTÉ</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-black/20 rounded-xl px-3 py-1">
                                                        <input type="number" value={l.price || ''} onChange={e => updateAgencyLine(l.id, 'price', parseFloat(e.target.value))} className="w-24 bg-transparent text-right text-xs font-black text-white outline-none" />
                                                        <span className="text-[8px] font-black opacity-30">CFA</span>
                                                    </div>
                                                    <button onClick={() => setAgencyLines(agencyLines.filter(x => x.id !== l.id))} className="text-muted-foreground hover:text-red-400"><X className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            <button onClick={addAgencyLine} className="text-[10px] font-black uppercase text-shop flex items-center"><PlusCircle className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne</button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t border-white/5">
                                            <div className="w-full sm:w-auto">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Acompte reçu</p>
                                                <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-black text-white outline-none focus:border-shop/50" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total TTC</p>
                                                <h2 className="text-3xl sm:text-5xl font-black text-shop">{totalAmount.toLocaleString()} <span className="text-lg">CFA</span></h2>
                                            </div>
                                        </div>
                                        <button disabled={totalAmount <= 0 || !customerName || isCheckingOut} onClick={handleCheckout} className="w-full py-5 bg-white text-black rounded-[28px] font-black text-lg uppercase tracking-[0.2em] shadow-2xl hover:bg-shop hover:text-white transition-all flex items-center justify-center space-x-3">
                                            {isCheckingOut ? <RefreshCw className="animate-spin" /> : <><Check /> <span>Confirmer</span></>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {(activeTab === 'history' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                        <div className={`space-y-8 ${activeTab === 'shop' ? 'hidden lg:block mt-20 border-t border-white/5 pt-20' : ''}`}>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-shop" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white font-museo">Ventes Récentes</h2>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Suivi en temps réel</p>
                                </div>
                            </div>

                            <div className="glass-panel rounded-[32px] sm:rounded-[40px] overflow-hidden border-white/5 bg-white/[0.01]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 border-b border-white/5">
                                            <tr>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Client</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mode</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Total</th>
                                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Ticket</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {agencyHistory.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                                            <span className="font-bold text-white uppercase text-xs">{sale.customer_name || 'Client Comptant'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase">{new Date(sale.created_at).toLocaleString()}</td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase text-white/60">
                                                            {sale.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-black text-shop text-sm">{Number(sale.total_amount).toLocaleString()}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button onClick={() => handleViewReceipt(sale)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-shop transition-all group-hover:scale-110">
                                                            <Receipt className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Cart */}
            {!isAgency && (
                <aside className={`fixed inset-y-0 right-0 z-[150] w-full sm:w-[420px] bg-[#0a0a0c] transition-transform duration-500 transform lg:relative lg:translate-x-0 lg:m-4 lg:rounded-[40px] lg:shadow-2xl ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                    <div className="flex flex-col h-full overflow-hidden lg:rounded-[40px] glass-panel border-none">
                        <div className="p-6 sm:p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">Panier</h2>
                                <p className="text-[10px] text-muted-foreground uppercase font-black">{cart.length} Articles</p>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 bg-white/5 rounded-xl text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
                            {cart.map(item => (
                                <div key={item.id} className="glass-card p-3 sm:p-4 rounded-3xl flex items-center space-x-4 border-transparent hover:border-shop/20 transition-all group">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center font-black text-shop flex-shrink-0 text-base sm:text-lg uppercase">{item.name.charAt(0)}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[10px] sm:text-xs truncate text-white">{item.name}</h4>
                                        <div className="flex items-center">
                                            <input type="number" value={item.price} onChange={(e) => updateCartItemPrice(item.id, parseFloat(e.target.value))} className="w-16 sm:w-20 bg-black/20 border border-white/5 rounded-lg px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-shop outline-none" />
                                            <span className="text-[7px] sm:text-[8px] font-black text-muted-foreground uppercase ml-1">CFA</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-white/5 rounded-xl border border-white/5 p-1">
                                        <button onClick={() => setCart(cart.map(i => i.id === item.id && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i))} className="p-1 hover:text-shop transition-colors"><Minus className="w-3 h-3 text-white" /></button>
                                        <span className="w-6 sm:w-8 text-center text-[10px] sm:text-xs font-black text-white">{item.quantity}</span>
                                        <button onClick={() => { const p = products.find(p => p.id === item.id); if (p) addToCart(p); }} className="p-1 hover:text-shop transition-colors"><Plus className="w-3 h-3 text-white" /></button>
                                    </div>
                                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-muted-foreground hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 sm:p-8 bg-white/[0.02] border-t border-white/5 space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {(['Cash', 'Wave', 'OM'] as const).map(m => (
                                    <button key={m} onClick={() => setPaymentMethod(m)} className={`flex flex-col items-center py-2.5 rounded-2xl border transition-all ${paymentMethod === m ? 'bg-shop text-white border-shop' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                                        {m === 'Cash' ? <Banknote className="w-3.5 h-3.5" /> : <Wallet className="w-3.5 h-3.5" />}
                                        <span className="text-[7px] sm:text-[8px] font-black uppercase mt-1">{m}</span>
                                    </button>
                                ))}
                            </div>
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
            )}

            {/* Mobile Footer Cart Bar */}
            {!isAgency && cart.length > 0 && !isCartOpen && (
                <div onClick={() => setIsCartOpen(true)} className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] bg-shop text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border-2 border-white/20 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">{cartCount}</div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[8px] font-black uppercase opacity-60">Panier</span>
                            <span className="text-lg font-black">{totalAmount.toLocaleString()} CFA</span>
                        </div>
                    </div>
                    <div className="bg-white text-shop px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">Payer</div>
                </div>
            )}

            {lastSale && <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} saleData={lastSale} shop={activeShop} />}
        </div>
    );
}
