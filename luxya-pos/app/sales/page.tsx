'use client'

import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Plus, X, Clock, Receipt, LogOut, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import { useShop } from '@/context/ShopContext';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import ShopSelector from '@/components/ShopSelector';
import ReceiptModal from '@/components/ReceiptModal';
import Portal from '@/components/Portal';
import { API_URL, safeFetch } from '@/utils/api';
import { createClient } from '@/utils/supabase/client';

// Hooks
import { useSalesData } from '@/hooks/useSalesData';
import { usePos } from '@/hooks/usePos';
import { useAgency } from '@/hooks/useAgency';

// Components
import ProductGrid from './components/ProductGrid';
import CartSidebar from './components/CartSidebar';
import AgencyForm from './components/AgencyForm';
import SalesHistoryTable from './components/SalesHistoryTable';

export default function SalesTerminal() {
    const supabase = React.useMemo(() => createClient(), []);
    const { activeShop } = useShop();
    const { profile } = useUser();
    const { showToast } = useToast();
    
    // Logic extracted to Hooks
    const {
        products, categories, brands, allCustomers, agencyHistory, projects,
        loading, isAgency, fetchProducts, fetchHistory, fetchCustomers,
    } = useSalesData();

    const {
        cart, setCart, addToCart, updateCartItemPrice,
        selectedProductForVariant, setSelectedProductForVariant, resetCart,
    } = usePos(isAgency, products);

    const {
        agencyLines, setAgencyLines, docType, setDocType, productSearch, setProductSearch,
        editingDocId, setEditingDocId, linkedDocNumber, setLinkedDocNumber, linkedDocId, setLinkedDocId,
        addAgencyLine, updateAgencyLine, addProductToAgency, handleTransformDocument, resetAgency,
    } = useAgency(products);

    // Local UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Wave' | 'OM'>('Cash');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCategory, setSelectedCategory] = useState('Toutes');
    const [selectedBrand, setSelectedBrand] = useState('Toutes');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [withTva, setWithTva] = useState(false);
    const [paidAmount, setPaidAmount] = useState('0');
    const [lastSale, setLastSale] = useState<any>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'shop' | 'history'>('shop');
    const [currentSession, setCurrentSession] = useState<any>(null);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (activeShop) {
            setSelectedCategory('Toutes');
            setSelectedBrand('Toutes');
            setSearchQuery('');
            fetchCurrentSession(activeShop.id);
        }
    }, [activeShop]);

    const fetchCurrentSession = async (shopId: number) => {
        try {
            const { data } = await supabase
                .from('cash_sessions')
                .select('*')
                .eq('shop_id', shopId)
                .eq('status', 'open')
                .maybeSingle();
            setCurrentSession(data);
        } catch (err) {
            console.error('Session fetch error', err);
        }
    };

    const totalAmount = isAgency
        ? agencyLines.reduce((sum, l) => sum + (l.price * l.quantity), 0)
        : cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (!activeShop || activeShop.id === 0) {
            showToast("Action impossible en vue globale. Sélectionnez une boutique.", "error");
            return;
        }
        setIsCheckingOut(true);

        try {
            if (paymentMethod.toLowerCase() === 'cash' && !currentSession && !isAgency) {
                showToast("La caisse est fermée. Veuillez l'ouvrir dans 'Ma Caisse' avant d'encaisser du Cash.", "error");
                setIsCheckingOut(false);
                return;
            }

            if (!isAgency) {
                const saleData = {
                    customer_name: customerName || 'Client Comptant',
                    customer_id: selectedCustomerId,
                    totalAmount,
                    paymentMethod: paymentMethod.toLowerCase(),
                    shopId: activeShop.id,
                    created_by: profile?.id,
                    created_at: new Date(saleDate).toISOString(),
                    project_id: selectedProjectId,
                    items: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        variantId: item.variantInfo?.id?.toString() || null,
                        name: item.name
                    }))
                };

                const sale = await safeFetch(`${API_URL}/sales`, {
                    method: 'POST',
                    body: JSON.stringify(saleData)
                });

                if (paymentMethod.toLowerCase() === 'cash' && currentSession) {
                    await supabase.from('cash_movements').insert([{
                        session_id: currentSession.id,
                        shop_id: activeShop.id,
                        type: 'income',
                        amount: totalAmount,
                        description: `Vente POS #${sale.invoice_number || sale.id}`,
                        source: 'sale',
                        source_id: sale.id?.toString(),
                        payment_method: paymentMethod.toLowerCase()
                    }]);
                }

                showToast("Vente réussie !", "success");
                setLastSale({ ...sale, items: cart, receivedAmount: parseFloat(receivedAmount) || 0 });
                setIsReceiptOpen(true);
                resetCart();
                setReceivedAmount('');
                setCustomerName('');
                fetchHistory();
                fetchProducts();
            } else {
                if (!customerName) {
                    showToast("Veuillez saisir le nom du client", "error");
                    return;
                }

                const prefix = docType === 'quote' ? 'DEV' : docType === 'invoice' ? 'FAC' : 'BL';
                const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
                const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                const docNumber = `${prefix}-${dateCode}-${rand}`;

                const docData = {
                    customer_name: customerName,
                    customer_id: selectedCustomerId,
                    totalAmount,
                    type: docType,
                    status: docType === 'quote' ? 'pending' : 'completed',
                    shopId: activeShop.id,
                    created_by: profile?.id,
                    created_at: new Date(saleDate).toISOString(),
                    invoice_number: docNumber,
                    with_tva: withTva,
                    paid_amount: parseFloat(paidAmount) || 0,
                    project_id: selectedProjectId,
                    items: agencyLines.map(l => ({
                        productId: l.product_id || 0,
                        name: l.name,
                        quantity: l.quantity,
                        price: l.price
                    }))
                };

                const savedDoc = await safeFetch(`${API_URL}/sales`, {
                    method: 'POST',
                    body: JSON.stringify(docData)
                });

                if (parseFloat(paidAmount) > 0 && currentSession) {
                    await supabase.from('cash_movements').insert([{
                        session_id: currentSession.id,
                        shop_id: activeShop.id,
                        type: 'income',
                        amount: parseFloat(paidAmount),
                        description: `${docType === 'invoice' ? 'Facture' : 'BL'} #${savedDoc.invoice_number || savedDoc.id}`,
                        source: 'sale',
                        source_id: savedDoc.id?.toString(),
                        payment_method: paymentMethod.toLowerCase()
                    }]);
                }

                showToast(`${docType === 'quote' ? 'Devis' : 'Document'} enregistré !`, "success");
                setLastSale({ ...savedDoc, items: agencyLines });
                setIsReceiptOpen(true);
                resetAgency();
                setCustomerName('');
                setPaidAmount('0');
                fetchHistory();
            }
        } catch (e: any) {
            showToast(`${e.message}`, "error");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handleViewReceipt = async (sale: any) => {
        try {
            const items = await safeFetch(`${API_URL}/sales/${sale.id}/items`);
            if (items) {
                setLastSale({
                    ...sale,
                    items: items.map((i: any) => ({
                        name: i.products?.name || i.description || 'Article inconnu',
                        quantity: i.quantity,
                        price: i.price
                    }))
                });
                setIsReceiptOpen(true);
            }
        } catch (e) {
            showToast("Erreur de récupération des détails", "error");
        }
    };

    const handleDeleteSale = async (id: string) => {
        if (!confirm("Supprimer définitivement cet enregistrement ?")) return;
        try {
            const { error } = await supabase.from('sales').delete().eq('id', id);
            if (error) throw error;
            showToast("Enregistrement supprimé", "success");
            fetchHistory();
        } catch (e) {
            showToast("Erreur lors de la suppression", "error");
        }
    };

    const handleCancelSale = async (sale: any) => {
        if (!confirm(`Annuler la vente ${sale.invoice_number || ''} et remettre les articles en stock ?`)) return;
        try {
            await safeFetch(`${API_URL}/sales/${sale.id}/cancel?shopId=${activeShop?.id}`, { method: 'POST' });
            showToast("Vente annulée et stock rétabli", "success");
            fetchHistory();
            fetchProducts();
        } catch (e: any) {
            showToast(e.message || "Erreur lors de l'annulation", "error");
        }
    };

    return (
        <div className="flex h-screen bg-background relative overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-20 sm:h-24 bg-background/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-10 z-30 sticky top-0">
                    <div className="flex items-center space-x-4 sm:space-x-8 overflow-hidden pl-12 lg:pl-0">
                        <div className="flex-shrink-0">
                            <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tighter text-white font-museo">
                                LOLLY<span className="text-shop">POS</span>
                            </h1>
                            <p className="text-[7px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:block">Système de Vente Premium <span className="text-shop/60 ml-2">v1.5 - MODULAR</span></p>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
                        <div className="scale-90 sm:scale-100 origin-left">
                            <ShopSelector />
                        </div>
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
                    <button onClick={() => setActiveTab('shop')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'shop' ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground'}`}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-2" /> Catalogue
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 flex items-center justify-center py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground'}`}>
                        <Clock className="w-3.5 h-3.5 mr-2" /> Historique
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar">
                    {/* Catalog Content (Shop Tab) */}
                    {(activeTab === 'shop' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                        <div className={activeTab === 'history' ? 'hidden lg:block' : ''}>
                            {!isAgency ? (
                                <ProductGrid 
                                    products={products} loading={loading} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                    categories={categories} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
                                    brands={brands} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand}
                                    addToCart={addToCart} imageErrors={imageErrors} setImageErrors={setImageErrors}
                                />
                            ) : (
                                <AgencyForm 
                                    docType={docType} setDocType={setDocType} linkedDocNumber={linkedDocNumber} setLinkedDocNumber={setLinkedDocNumber}
                                    customerName={customerName} setCustomerName={setCustomerName} allCustomers={allCustomers}
                                    setSelectedCustomerId={setSelectedCustomerId} productSearch={productSearch} setProductSearch={setProductSearch}
                                    products={products} addProductToAgency={addProductToAgency} agencyLines={agencyLines} updateAgencyLine={updateAgencyLine}
                                    setAgencyLines={setAgencyLines} addAgencyLine={addAgencyLine} paidAmount={paidAmount} setPaidAmount={setPaidAmount}
                                    totalAmount={totalAmount} isCheckingOut={isCheckingOut} handleCheckout={handleCheckout}
                                    projects={projects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId}
                                />
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {(activeTab === 'history' || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                        <div className={`space-y-8 ${activeTab === 'shop' ? 'hidden lg:block mt-20 border-t border-white/5 pt-20' : ''}`}>
                            <SalesHistoryTable 
                                history={agencyHistory} isAgency={isAgency} docType={docType}
                                handleTransformDocument={async (sale, type) => {
                                    const success = await handleTransformDocument(sale, type);
                                    if (success) setActiveTab('shop');
                                }}
                                handleViewReceipt={handleViewReceipt} handleDeleteSale={handleDeleteSale} handleCancelSale={handleCancelSale}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Cart */}
            {!isAgency && (
                <CartSidebar 
                    cart={cart} setCart={setCart} addToCart={addToCart} updateCartItemPrice={updateCartItemPrice}
                    products={products} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen}
                    paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} receivedAmount={receivedAmount}
                    setReceivedAmount={setReceivedAmount} totalAmount={totalAmount} isCheckingOut={isCheckingOut}
                    handleCheckout={handleCheckout} projects={projects} selectedProjectId={selectedProjectId}
                    setSelectedProjectId={setSelectedProjectId}
                />
            )}

            {lastSale && <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} saleData={lastSale} shop={activeShop} />}

            {/* Variant Selection Modal */}
            {selectedProductForVariant && (
                <Portal>
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedProductForVariant(null)} />
                        <div className="relative glass-card w-full max-w-lg p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                            <button onClick={() => setSelectedProductForVariant(null)} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative shadow-2xl">
                                    <Image src={selectedProductForVariant.image} alt={selectedProductForVariant.name} fill className="object-cover" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white">{selectedProductForVariant.name}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Sélectionner une Variante</p>
                                </div>
                                <div className="w-full space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedProductForVariant.variants.map((v: any, i: number) => (
                                            <button key={i} disabled={v.stock !== undefined && parseInt(v.stock) <= 0} onClick={() => { addToCart(selectedProductForVariant, v); setSelectedProductForVariant(null); }} className={`group flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 transition-all w-full text-left ${v.stock !== undefined && parseInt(v.stock) <= 0 ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-shop/50 hover:bg-shop/5'}`}>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-xl bg-black/20 overflow-hidden border border-white/5">
                                                        {v.image ? <img src={v.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <div className="w-full h-full flex items-center justify-center bg-white/5"><ImageIcon className="w-4 h-4 text-white/10" /></div>}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <p className="text-sm font-bold text-white uppercase">{v.color || 'Standard'}</p>
                                                            {v.stock !== undefined && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${parseInt(v.stock) <= 2 ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-green-500/20 border-green-500/30 text-green-400'}`}>S: {v.stock}</span>}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{v.size || 'Unique'}</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-shop group-hover:text-white transition-all"><Plus className="w-4 h-4" /></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => { addToCart(selectedProductForVariant, { color: 'Standard', size: 'N/A' }); setSelectedProductForVariant(null); }} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors py-2">Continuer sans variante spécifique</button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
