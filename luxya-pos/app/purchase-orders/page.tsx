'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
    FileText, Plus, Search, Calendar, DollarSign, 
    CheckCircle2, Clock, Trash2, ArrowRight,
    Loader2, X, Check, Truck, Package, ShoppingCart, PlusCircle, Sparkles, Tag, Minus, Building2
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/client'
import CustomDropdown from '@/components/CustomDropdown'
import { API_URL } from '@/utils/api'

export default function PurchaseOrdersPage() {
    const { activeShop } = useShop()
    const { showToast } = useToast()
    const supabase = createClient()

    const [orders, setOrders] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    // New Order State
    const [selectedSupplier, setSelectedSupplier] = useState('')
    const [orderLines, setOrderLines] = useState<any[]>([])
    const [productSearch, setProductSearch] = useState('')
    
    // UI state for adding new product quickly
    const [isAddingNew, setIsAddingNew] = useState(false)
    const [newQuickProduct, setNewQuickProduct] = useState({ name: '', cost_price: '', price: '', category: 'Général' })

    useEffect(() => {
        if (activeShop) {
            fetchOrders()
            fetchSuppliers()
            fetchProducts()
        }
    }, [activeShop])

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('id, name').eq('shop_id', activeShop?.id || 1)
        if (data) setSuppliers(data)
    }

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('id, name, cost_price, price').eq('shop_id', activeShop?.id || 1)
        if (data) setProducts(data)
    }

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('purchase_orders')
                .select(`*, suppliers (name)`)
                .eq('shop_id', activeShop?.id || 1)
                .order('created_at', { ascending: false })
            if (error) throw error
            setOrders(data || [])
        } catch (err) {
            showToast("Erreur de chargement", "error")
        } finally {
            setLoading(false)
        }
    }

    const addExistingProduct = (p: any) => {
        const existing = orderLines.find(l => l.product_id === p.id)
        if (existing) {
            setOrderLines(orderLines.map(l => l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l))
        } else {
            setOrderLines([...orderLines, { 
                product_id: p.id, 
                name: p.name, 
                quantity: 1, 
                cost_price: p.cost_price || 0,
                is_new: false 
            }])
        }
        setProductSearch('')
    }

    const addNewProductLine = () => {
        if (!newQuickProduct.name) return
        setOrderLines([...orderLines, { 
            product_id: null, 
            name: newQuickProduct.name, 
            quantity: 1, 
            cost_price: parseFloat(newQuickProduct.cost_price) || 0,
            price: parseFloat(newQuickProduct.price) || 0,
            category: newQuickProduct.category,
            is_new: true 
        }])
        setNewQuickProduct({ name: '', cost_price: '', price: '', category: 'Général' })
        setIsAddingNew(false)
    }

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSupplier) return showToast("Choisissez un fournisseur", "warning")
        if (orderLines.length === 0) return showToast("Ajoutez au moins un produit", "warning")

        setCreating(true)
        try {
            const total = orderLines.reduce((sum, l) => sum + (l.cost_price * l.quantity), 0)
            
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('purchase_orders')
                .insert([{
                    supplier_id: selectedSupplier,
                    shop_id: activeShop?.id || 1,
                    total_amount: total,
                    status: 'pending'
                }])
                .select().single()

            if (orderError) throw orderError

            // 2. Create Items (including new products meta)
            const items = orderLines.map(l => ({
                purchase_order_id: order.id,
                product_id: l.product_id,
                quantity: l.quantity,
                cost_price: l.cost_price,
                temp_product_data: l.is_new ? { name: l.name, price: l.price, category: l.category } : null
            }))

            await supabase.from('purchase_order_items').insert(items)

            showToast("Bon de commande créé !", "success")
            setIsModalOpen(false)
            setOrderLines([])
            setSelectedSupplier('')
            fetchOrders()
        } catch (err) {
            showToast("Erreur de création", "error")
        } finally {
            setCreating(false)
        }
    }

    const handleReceiveOrder = async (orderId: string) => {
        if (!confirm("Réceptionner cette commande ? Les produits seront créés ou mis à jour dans votre inventaire.")) return
        
        try {
            setLoading(true)
            // 1. Get items
            const { data: items } = await supabase.from('purchase_order_items').select('*').eq('purchase_order_id', orderId)
            
            if (items) {
                for (const item of items) {
                    let targetProductId = item.product_id

                    // 2. If it's a NEW product, create it first
                    if (!targetProductId && item.temp_product_data) {
                        const { data: newProd } = await supabase.from('products').insert([{
                            name: item.temp_product_data.name,
                            price: item.temp_product_data.price,
                            cost_price: item.cost_price,
                            category: item.temp_product_data.category,
                            stock: item.quantity,
                            shop_id: activeShop?.id || 1
                        }]).select().single()
                        targetProductId = newProd?.id
                    } else {
                        // 3. Update existing product stock
                        await supabase.rpc('increment_stock', { row_id: targetProductId, amount: item.quantity })
                        // Optionally update cost price to latest
                        await supabase.from('products').update({ cost_price: item.cost_price }).eq('id', targetProductId)
                    }
                }
            }

            // 4. Close Order
            await supabase.from('purchase_orders').update({ status: 'received', received_at: new Date().toISOString() }).eq('id', orderId)
            
            showToast("Inventaire mis à jour avec succès !", "success")
            fetchOrders()
            fetchProducts()
        } catch (err) {
            showToast("Erreur lors de la réception", "error")
        } finally {
            setLoading(false)
        }
    }

    const totalOrderAmount = orderLines.reduce((sum, l) => sum + (l.cost_price * l.quantity), 0)

    return (
        <div className="min-h-screen p-4 sm:p-8 space-y-6 sm:space-y-8 pb-32">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-4 pl-14 lg:pl-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-shop/20 rounded-2xl flex items-center justify-center text-shop shadow-xl border border-shop/20 shrink-0">
                        <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white font-museo italic leading-none">Achats & <span className="text-shop">Stocks</span></h1>
                        <p className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Flux d'approvisionnement entrant</p>
                    </div>
                </div>

                <button onClick={() => setIsModalOpen(true)} className="w-full lg:w-auto bg-shop hover:bg-shop/80 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-shop/20 flex items-center justify-center hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> Nouveau Bon d'Achat
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {loading && orders.length === 0 ? (
                    <div className="col-span-full flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-shop opacity-20" /></div>
                ) : orders.map(order => (
                    <div key={order.id} className="glass-panel p-6 rounded-[32px] border-white/5 hover:border-shop/30 transition-all group relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="font-black text-white uppercase truncate max-w-[180px]">{order.suppliers?.name || 'Fournisseur inconnu'}</h3>
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1.5 opacity-50"># {order.id.slice(0,8)}</p>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border shadow-lg ${
                                order.status === 'received' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400 animate-pulse'
                            }`}>
                                {order.status === 'received' ? 'En Stock' : 'En transit'}
                            </span>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Montant Facture</span>
                                <span className="text-xl font-black text-white tracking-tighter">{Number(order.total_amount).toLocaleString()} <span className="text-[10px] opacity-30">CFA</span></span>
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-black uppercase text-muted-foreground opacity-40">
                                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(order.created_at).toLocaleDateString()}</span>
                                {order.received_at && <span className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1 text-green-500"/> Reçue</span>}
                            </div>
                        </div>

                        {order.status === 'pending' ? (
                            <button 
                                onClick={() => handleReceiveOrder(order.id)}
                                className="w-full py-4 bg-white text-black hover:bg-shop hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-2 shadow-2xl transition-all active:scale-95"
                            >
                                <Package className="w-4 h-4" />
                                <span>Encaisser le Stock</span>
                            </button>
                        ) : (
                            <div className="flex items-center justify-center py-4 bg-green-500/5 rounded-2xl border border-green-500/10 text-[9px] font-black uppercase text-green-400/60 tracking-widest">
                                Archivé dans l'inventaire
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* CREATE ORDER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60">
                    <div className="relative glass-card w-full max-w-3xl p-8 sm:p-12 rounded-[48px] shadow-[0_0_100px_rgba(var(--shop-primary),0.1)] border-white/10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[94vh]">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6 text-white"/></button>
                        
                        <div className="flex items-center space-x-6 mb-12">
                            <div className="w-20 h-20 bg-shop/20 text-shop rounded-[32px] flex items-center justify-center border border-shop/20 shadow-2xl">
                                <PlusCircle className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">Créer un <span className="text-shop">Bon d'Achat.</span></h2>
                                <p className="text-[11px] text-muted-foreground font-bold tracking-[0.3em] uppercase mt-1.5">Entrée de marchandises multiproduits</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 pr-4">
                            {/* STEP 1: Supplier */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-shop tracking-[0.2em] flex items-center"><Truck className="w-4 h-4 mr-2"/> 1. Source d'achat</p>
                                <CustomDropdown 
                                    options={suppliers.map(s => ({ label: s.name, value: s.id, icon: <Building2 className="w-4 h-4"/> }))}
                                    value={selectedSupplier}
                                    onChange={setSelectedSupplier}
                                    placeholder="Choisir le fournisseur..."
                                />
                            </div>

                            {/* STEP 2: Products */}
                            <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase text-shop tracking-[0.2em] flex items-center"><Package className="w-4 h-4 mr-2"/> 2. Produits commandés</p>
                                
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input 
                                            list="order-product-list"
                                            value={productSearch}
                                            onChange={e => setProductSearch(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const found = products.find(p => p.name.toLowerCase() === productSearch.toLowerCase());
                                                    if (found) addExistingProduct(found);
                                                }
                                            }}
                                            placeholder="Ajouter un produit existant..." 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white" 
                                        />
                                        <datalist id="order-product-list">
                                            {products.map(p => <option key={p.id} value={p.name}>Coût actuel: {p.cost_price?.toLocaleString()} CFA</option>)}
                                        </datalist>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsAddingNew(!isAddingNew)}
                                        className={`px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center whitespace-nowrap ${isAddingNew ? 'bg-shop border-shop text-white' : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'}`}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> {isAddingNew ? 'Fermer' : 'Nouveau Produit'}
                                    </button>
                                </div>

                                {isAddingNew && (
                                    <div className="p-6 bg-shop/5 border border-shop/20 rounded-[32px] space-y-4 animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-shop" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Informations du nouvel article</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input placeholder="Nom du produit" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-shop/50" value={newQuickProduct.name} onChange={e => setNewQuickProduct({...newQuickProduct, name: e.target.value})} />
                                            <input placeholder="Catégorie" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-shop/50" value={newQuickProduct.category} onChange={e => setNewQuickProduct({...newQuickProduct, category: e.target.value})} />
                                            <input type="number" placeholder="Coût d'achat" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-shop/50" value={newQuickProduct.cost_price} onChange={e => setNewQuickProduct({...newQuickProduct, cost_price: e.target.value})} />
                                            <input type="number" placeholder="Futur Prix Vente" className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-shop/50" value={newQuickProduct.price} onChange={e => setNewQuickProduct({...newQuickProduct, price: e.target.value})} />
                                        </div>
                                        <button onClick={addNewProductLine} type="button" className="w-full py-3 bg-shop text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Ajouter cette ligne</button>
                                    </div>
                                )}

                                {/* LINES TABLE */}
                                <div className="space-y-3">
                                    {orderLines.map((l, idx) => (
                                        <div key={idx} className="flex items-center space-x-4 bg-white/5 p-5 rounded-[28px] border border-white/5 group hover:border-white/10 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-black text-white uppercase truncate">{l.name}</p>
                                                    {l.is_new && <span className="bg-shop/20 text-shop text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Nouveau</span>}
                                                </div>
                                                <div className="flex items-center space-x-4 mt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">Coût:</span>
                                                        <input type="number" value={l.cost_price} onChange={e => setOrderLines(orderLines.map((line, i) => i === idx ? { ...line, cost_price: parseFloat(e.target.value) } : line))} className="w-24 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-[10px] font-black text-shop outline-none focus:border-shop/50" />
                                                    </div>
                                                    {l.is_new && (
                                                        <div className="flex items-center space-x-2 border-l border-white/10 pl-4">
                                                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">Vente:</span>
                                                            <span className="text-[10px] font-black text-white">{l.price.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 bg-black/40 rounded-2xl px-3 py-2 border border-white/5">
                                                <button type="button" onClick={() => setOrderLines(orderLines.map((line, i) => i === idx ? { ...line, quantity: Math.max(1, line.quantity - 1) } : line))} className="p-1 hover:text-shop text-muted-foreground"><Minus className="w-4 h-4"/></button>
                                                <input type="number" value={l.quantity} onChange={e => setOrderLines(orderLines.map((line, i) => i === idx ? { ...line, quantity: parseInt(e.target.value) } : line))} className="w-12 bg-transparent text-center text-xs font-black text-white outline-none" />
                                                <button type="button" onClick={() => setOrderLines(orderLines.map((line, i) => i === idx ? { ...line, quantity: line.quantity + 1 } : line))} className="p-1 hover:text-shop text-muted-foreground"><Plus className="w-4 h-4"/></button>
                                            </div>
                                            <button type="button" onClick={() => setOrderLines(orderLines.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-red-400 p-2"><Trash2 className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                    {orderLines.length === 0 && (
                                        <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[40px] opacity-30">
                                            <Package className="w-10 h-10 mx-auto mb-3" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Votre bon d'achat est vide</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* TOTAL & FOOTER */}
                        <div className="pt-8 border-t border-white/10 mt-auto flex flex-col sm:flex-row justify-between items-center gap-8">
                            <div className="text-center sm:text-left flex items-center space-x-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Articles</p>
                                    <p className="text-2xl font-black text-white tracking-tighter">{orderLines.reduce((s,l) => s + l.quantity, 0)}</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total à payer</p>
                                    <h2 className="text-4xl font-black text-shop tracking-tighter">{totalOrderAmount.toLocaleString()} <span className="text-sm opacity-30">CFA</span></h2>
                                </div>
                            </div>
                            <button onClick={handleCreateOrder} disabled={creating || orderLines.length === 0} className="w-full sm:w-auto px-16 py-6 bg-white text-black hover:bg-shop hover:text-white font-black uppercase tracking-[0.3em] rounded-[32px] hover:scale-105 active:scale-95 transition-all shadow-2xl text-[11px] disabled:opacity-20 disabled:grayscale">
                                {creating ? <Loader2 className="animate-spin mx-auto"/> : "Émettre le Bon d'Achat"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
