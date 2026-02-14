'use client'

import React, { useState, useEffect, useRef } from 'react';
import { AdminGuard } from '@/components/AdminGuard';
import { 
    LayoutDashboard, ShoppingCart, Users, Package, Settings, 
    ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, 
    Megaphone, Calendar, Upload, Loader2, X, Search, 
    Globe, Eye, EyeOff, Star, TrendingUp, 
    Filter, CheckCircle2, Clock, Truck, AlertCircle, 
    ExternalLink, ChevronDown, UserCheck, Award, Phone, User, Ticket, Printer, MessageSquare, ThumbsUp, ThumbsDown, Pencil, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import CustomerDetailsModal from '@/components/CustomerDetailsModal';
import EditProductModal from '@/components/EditProductModal';
import { useToast } from '@/context/ToastContext';

export default function AdminDashboard() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settings, setSettings] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [coupons, setCoupons] = useState<any[]>([]);
    const [shippingZones, setShippingZones] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState<any>({
        dailySales: [],
        topProducts: [],
        lowStock: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [shopFilter, setShopFilter] = useState('all');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'config') fetchSettings();
        if (activeTab === 'products') fetchProducts();
        if (activeTab === 'orders' || activeTab === 'dashboard') fetchOrders();
        if (activeTab === 'customers') fetchCustomers();
        if (activeTab === 'coupons') fetchCoupons();
        if (activeTab === 'shipping') fetchShippingZones();
        if (activeTab === 'reviews') fetchReviews();
    }, [activeTab]);

    useEffect(() => {
        if (orders.length > 0 || products.length > 0) {
            // Calculate Daily Sales (last 7 days)
            const days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const salesByDay = days.map(day => {
                const total = orders
                    .filter(o => o.created_at.startsWith(day) && o.status !== 'cancelled')
                    .reduce((acc, o) => acc + Number(o.total_amount), 0);
                return { day: day.split('-').slice(1).join('/'), total };
            });

            // Calculate Top Products
            const productCounts: any = {};
            orders.forEach(order => {
                if (order.status === 'cancelled') return;
                order.sale_items?.forEach((item: any) => {
                    const name = item.products?.name || 'Inconnu';
                    productCounts[name] = (productCounts[name] || 0) + item.quantity;
                });
            });
            const topProducts = Object.entries(productCounts)
                .map(([name, count]: [string, any]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Low Stock
            const lowStock = products
                .filter(p => p.stock <= 5 && p.show_on_website)
                .sort((a, b) => a.stock - b.stock)
                .slice(0, 5);

            setAnalytics({ dailySales: salesByDay, topProducts, lowStock });
        }
    }, [orders, products]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            setSettings(data);
        } catch (error) { console.error("Failed to fetch settings"); }
        finally { setLoading(false); }
    };

    const fetchShippingZones = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/shipping');
            const data = await res.json();
            if (Array.isArray(data)) setShippingZones(data);
        } catch (error) { console.error("Failed to fetch shipping zones"); }
        finally { setLoading(false); }
    };

    const handleAddShippingZone = async (zoneData: any) => {
        try {
            const res = await fetch('/api/admin/shipping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(zoneData)
            });
            if (res.ok) {
                fetchShippingZones();
                showToast("Zone de livraison ajoutée");
            }
        } catch (error) { showToast("Erreur lors de l'ajout", "error"); }
    };

    const handleDeleteShippingZone = async (id: string) => {
        if (!confirm("Supprimer cette zone ?")) return;
        try {
            const res = await fetch(`/api/admin/shipping?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchShippingZones();
                showToast("Zone supprimée");
            }
        } catch (error) { showToast("Erreur lors de la suppression", "error"); }
    };

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (Array.isArray(data)) setCoupons(data);
        } catch (error) { console.error("Failed to fetch coupons"); }
        finally { setLoading(false); }
    };

    const handleAddCoupon = async (couponData: any) => {
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData)
            });
            if (res.ok) {
                fetchCoupons();
                showToast("Code promo créé !");
            }
        } catch (error) { showToast("Erreur lors de l'ajout", "error"); }
    };

    const handleDeleteCoupon = async (id: string) => {
        if (!confirm("Supprimer ce code promo ?")) return;
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCoupons();
                showToast("Coupon supprimé");
            }
        } catch (error) { showToast("Erreur lors de la suppression", "error"); }
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/reviews');
            const data = await res.json();
            if (Array.isArray(data)) setReviews(data);
        } catch (error) { console.error("Failed to fetch reviews"); }
        finally { setLoading(false); }
    };

    const updateReviewStatus = async (id: string, status: string) => {
        try {
            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                fetchReviews();
                showToast(`Avis ${status === 'approved' ? 'approuvé' : 'refusé'}`);
            }
        } catch (error) { showToast("Erreur lors de la mise à jour", "error"); }
    };

    const deleteReview = async (id: string) => {
        if (!confirm("Supprimer cet avis ?")) return;
        try {
            const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchReviews();
                showToast("Avis supprimé");
            }
        } catch (error) { showToast("Erreur lors de la suppression", "error"); }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) { console.error("Failed to fetch products"); }
        finally { setLoading(false); }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/orders');
            const data = await res.json();
            if (Array.isArray(data)) setOrders(data);
        } catch (error) { console.error("Failed to fetch orders"); }
        finally { setLoading(false); }
    };

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/customers');
            const data = await res.json();
            if (Array.isArray(data)) setCustomers(data);
        } catch (error) { console.error("Failed to fetch customers"); }
        finally { setLoading(false); }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) showToast("Configuration sauvegardée !", "success");
        } catch (error) { showToast("Erreur lors de la sauvegarde", "error"); }
        finally { setIsSaving(false); }
    };

    const toggleProductVisibility = async (id: number, current: boolean) => {
        setProducts(products.map(p => p.id === id ? { ...p, show_on_website: !current } : p));
        try {
            await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, show_on_website: !current })
            });
            showToast("Visibilité mise à jour");
        } catch (e) { fetchProducts(); }
    };

    const updateOrderStatus = async (id: number, newStatus: string) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
        try {
            await fetch('/api/admin/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });
            showToast("Statut de commande mis à jour");
        } catch (e) { fetchOrders(); }
    };

    const updateLoyaltyPoints = async (id: string, newPoints: number) => {
        setCustomers(customers.map(c => c.id === id ? { ...c, loyalty_points: newPoints } : c));
        try {
            await fetch('/api/admin/customers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, loyalty_points: newPoints })
            });
            showToast("Points de fidélité mis à jour");
        } catch (e) { fetchCustomers(); }
    };

    const toggleProductFeatured = async (id: number, current: boolean) => {
        setProducts(products.map(p => p.id === id ? { ...p, is_featured: !current } : p));
        try {
            await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_featured: !current })
            });
            showToast("Statut vedette mis à jour");
        } catch (e) { fetchProducts(); }
    };

    const updateProductPromo = async (id: number, promoPrice: number) => {
        try {
            await fetch('/api/admin/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, promo_price: promoPrice })
            });
            showToast("Prix promo mis à jour");
        } catch (e) { showToast("Erreur promo", "error"); }
    };

    const updateSlide = (index: number, field: string, value: string) => {
        const newSlides = [...settings.slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setSettings({ ...settings, slides: newSlides });
    };

    const addSlide = () => {
        setSettings({
            ...settings,
            slides: [...settings.slides, { image: '', title: '', subtitle: '', buttonText: 'Voir', link: '/' }]
        });
    };

    const removeSlide = (index: number) => {
        setSettings({
            ...settings,
            slides: settings.slides.filter((_: any, i: number) => i !== index)
        });
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesShop = shopFilter === 'all' || p.shop_id?.toString() === shopFilter;
        return matchesSearch && matchesShop;
    });

    const filteredCustomers = customers.filter(c => 
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    return (
        <AdminGuard>
            <div className="min-h-screen bg-[#0a0a0c] flex text-white font-sans">
                {/* Admin Sidebar */}
                <aside className="w-72 bg-[#111114] border-r border-white/5 flex flex-col sticky top-0 h-screen z-50">
                    <div className="p-8 border-b border-white/5">
                        <h1 className="brand-lolly text-3xl italic font-black">LOLLY<span className="text-lolly">.</span></h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mt-2">Gestion Boutique</p>
                    </div>
                    
                    <nav className="flex-1 p-6 space-y-3">
                        <AdminLink icon={<LayoutDashboard className="w-4 h-4" />} label="Tableau de Bord" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                        <AdminLink icon={<Users className="w-4 h-4" />} label="Clients" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
                        <AdminLink icon={<Package className="w-4 h-4" />} label="Produits Web" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
                        <AdminLink icon={<Ticket className="w-4 h-4" />} label="Codes Promo" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />
                        <AdminLink icon={<Truck className="w-4 h-4" />} label="Livraison" active={activeTab === 'shipping'} onClick={() => setActiveTab('shipping')} />
                        <AdminLink icon={<MessageSquare className="w-4 h-4" />} label="Avis Clients" active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
                        <AdminLink icon={<ShoppingCart className="w-4 h-4" />} label="Commandes" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
                        <AdminLink icon={<Settings className="w-4 h-4" />} label="Configuration" active={activeTab === 'config'} onClick={() => setActiveTab('config')} />
                    </nav>

                    <div className="p-8 border-t border-white/5">
                        <Link href="/" className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">
                            <ArrowLeft className="w-3 h-3 mr-3" /> Retour Boutique
                        </Link>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto">
                    {activeTab === 'dashboard' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Tableau de Bord</h2>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Intelligence & Performance</p>
                            </header>

                            {/* Main Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <StatCard title="Chiffre d'Affaires" value={orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + Number(o.total_amount), 0).toLocaleString()} unit="CFA" trend="+15%" />
                                <StatCard title="Commandes Web" value={orders.length.toString()} unit="Total" trend="+8%" />
                                <StatCard title="Panier Moyen" value={orders.length ? Math.round(orders.reduce((acc, o) => acc + Number(o.total_amount), 0) / orders.length).toLocaleString() : '0'} unit="CFA" trend="+2%" />
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                {/* Sales Chart (CSS Bars) */}
                                <section className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-10 flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-2 text-lolly" /> Ventes (7 derniers jours)
                                    </h3>
                                    <div className="flex items-end justify-between h-64 gap-4 px-4">
                                        {analytics.dailySales.map((day: any, i: number) => {
                                            const max = Math.max(...analytics.dailySales.map((d: any) => d.total)) || 1;
                                            const height = (day.total / max) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center group relative">
                                                    <div className="absolute -top-8 bg-lolly text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {day.total.toLocaleString()} CFA
                                                    </div>
                                                    <div 
                                                        className="w-full bg-lolly/20 group-hover:bg-lolly/40 transition-all rounded-t-xl relative overflow-hidden" 
                                                        style={{ height: `${height}%`, minHeight: '4px' }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-t from-lolly/40 to-transparent" />
                                                    </div>
                                                    <span className="text-[8px] font-black text-gray-600 mt-4 uppercase tracking-tighter">{day.day}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                <div className="space-y-12">
                                    {/* Top Products */}
                                    <section className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-8 flex items-center">
                                            <Star className="w-3 h-3 mr-2 text-orange-500" /> Meilleures Ventes
                                        </h3>
                                        <div className="space-y-4">
                                            {analytics.topProducts.map((p: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500">
                                                            #{i+1}
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-300">{p.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black bg-lolly/10 text-lolly px-3 py-1 rounded-full">{p.count} vendus</span>
                                                </div>
                                            ))}
                                            {analytics.topProducts.length === 0 && (
                                                <p className="text-center py-10 text-[10px] text-gray-600 font-black uppercase tracking-widest">Aucune vente enregistrée</p>
                                            )}
                                        </div>
                                    </section>

                                    {/* Stock Alerts */}
                                    <section className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-8 flex items-center">
                                            <AlertCircle className="w-3 h-3 mr-2 text-red-500" /> Stock Critique (Web)
                                        </h3>
                                        <div className="space-y-4">
                                            {analytics.lowStock.map((p: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                                    <span className="text-xs font-bold text-gray-300">{p.name}</span>
                                                    <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full">Reste: {p.stock}</span>
                                                </div>
                                            ))}
                                            {analytics.lowStock.length === 0 && (
                                                <p className="text-center py-10 text-[10px] text-green-500 font-black uppercase tracking-widest">Stock optimal</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter italic">Clients Web</h2>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Gestion des comptes et fidélité</p>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Nom, email ou téléphone..."
                                        className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold focus:border-lolly/50 outline-none w-80 transition-all"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </header>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <Loader2 className="w-12 h-12 animate-spin text-lolly mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Chargement des profils...</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Client</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Coordonnées</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Commandes</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Points Lolly</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Inscription</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredCustomers.map((c) => (
                                                <tr 
                                                    key={c.id} 
                                                    className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                                                    onClick={() => setSelectedCustomer(c)}
                                                >
                                                    <td className="p-8">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-lolly/10 rounded-full flex items-center justify-center text-lolly font-black italic border border-lolly/20">
                                                                {c.full_name?.[0]?.toUpperCase() || c.email?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black italic">{c.full_name || 'Sans nom'}</p>
                                                                <p className="text-[10px] text-gray-500 font-medium">{c.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{c.phone || 'Non renseigné'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-center">
                                                        <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black">{c.order_count}</span>
                                                    </td>
                                                    <td className="p-8" onClick={e => e.stopPropagation()}>
                                                        <div className="flex flex-col items-center gap-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Award className="w-4 h-4 text-lolly" />
                                                                <input 
                                                                    type="number"
                                                                    className="bg-black/40 border border-white/10 rounded-xl py-1 px-3 text-xs font-black w-20 text-center focus:border-lolly outline-none text-lolly"
                                                                    defaultValue={c.loyalty_points || 0}
                                                                    onBlur={(e) => updateLoyaltyPoints(c.id, Number(e.target.value))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <p className="text-[10px] font-black uppercase text-gray-500">{new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
                                                            <button 
                                                                className="mt-2 text-[8px] font-black uppercase tracking-widest text-lolly opacity-0 group-hover:opacity-100 transition-all flex items-center"
                                                            >
                                                                Voir détails <ChevronDown className="w-2 h-2 ml-1 -rotate-90" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter italic">Produits Web</h2>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Visibilité du catalogue en ligne</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Chercher un produit..."
                                            className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold focus:border-lolly/50 outline-none w-64 transition-all"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <select 
                                        className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-lolly/50"
                                        value={shopFilter}
                                        onChange={e => setShopFilter(e.target.value)}
                                    >
                                        <option value="all">Toutes Boutiques</option>
                                        <option value="1">Luxya Beauté</option>
                                        <option value="2">Homtek Tech</option>
                                    </select>
                                </div>
                            </header>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <Loader2 className="w-12 h-12 animate-spin text-lolly mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Synchronisation du catalogue...</p>
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Produit</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Prix</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Promo</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">En Ligne</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredProducts.map((p) => (
                                                <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="p-8">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center p-2 relative overflow-hidden">
                                                                {p.image ? <img src={p.image} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-6 h-6 text-white/10" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black italic">{p.name}</p>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${p.shop_id === 1 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                                        {p.shop_id === 1 ? 'Luxya' : 'Homtek'}
                                                                    </span>
                                                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{p.category}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <p className="text-sm font-black">{Number(p.price).toLocaleString()} <span className="text-[8px] text-gray-500">CFA</span></p>
                                                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Stock: {p.stock}</p>
                                                    </td>
                                                    <td className="p-8">
                                                        <input 
                                                            type="number" 
                                                            placeholder="0"
                                                            className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-xs font-bold w-24 focus:border-lolly outline-none transition-all text-white"
                                                            defaultValue={p.promo_price || ''}
                                                            onBlur={(e) => updateProductPromo(p.id, Number(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex justify-center">
                                                            <button 
                                                                onClick={() => toggleProductVisibility(p.id, p.show_on_website)}
                                                                className={`w-12 h-6 rounded-full relative transition-all ${p.show_on_website ? 'bg-lolly' : 'bg-white/10'}`}
                                                            >
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${p.show_on_website ? 'left-7' : 'left-1'}`} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <button 
                                                                onClick={() => toggleProductFeatured(p.id, p.is_featured)}
                                                                className={`p-3 rounded-2xl transition-all ${p.is_featured ? 'bg-orange-500/10 text-orange-500' : 'bg-white/5 text-white/10 hover:text-white/30'}`}
                                                            >
                                                                <Star className={`w-5 h-5 ${p.is_featured ? 'fill-current' : ''}`} />
                                                            </button>
                                                            <button 
                                                                onClick={() => setSelectedProduct(p)}
                                                                className="p-3 bg-white/5 text-gray-500 hover:text-white rounded-2xl transition-all"
                                                                title="Modifier"
                                                            >
                                                                <Pencil className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'coupons' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Codes Promo</h2>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Marketing & Fidélisation</p>
                            </header>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                <div className="xl:col-span-2 space-y-6">
                                    <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/[0.02] border-b border-white/5">
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Code</th>
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Réduction</th>
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Utilisations</th>
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {coupons.map((coupon) => (
                                                    <tr key={coupon.id} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="p-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-lolly tracking-widest uppercase">{coupon.code}</span>
                                                                {coupon.expiry_date && (
                                                                    <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">
                                                                        Expire le {new Date(coupon.expiry_date).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <p className="text-sm font-black italic">
                                                                {coupon.discount_type === 'percentage' ? `-${coupon.discount_value}%` : `-${Number(coupon.discount_value).toLocaleString()} CFA`}
                                                            </p>
                                                            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-widest mt-1">
                                                                Min: {Number(coupon.min_purchase).toLocaleString()} CFA
                                                            </p>
                                                        </td>
                                                        <td className="p-8 text-center">
                                                            <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black">
                                                                {coupon.used_count} / {coupon.max_uses || '∞'}
                                                            </span>
                                                        </td>
                                                        <td className="p-8 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                                                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {coupons.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-20 text-center text-gray-500 text-xs font-black uppercase tracking-widest opacity-20">
                                                            Aucun code promo actif
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <h3 className="font-black uppercase italic text-sm tracking-widest text-white mb-8">Nouveau Code</h3>
                                        <form className="space-y-6" onSubmit={(e: any) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            handleAddCoupon({
                                                code: formData.get('code'),
                                                discount_type: formData.get('discount_type'),
                                                discount_value: Number(formData.get('discount_value')),
                                                min_purchase: Number(formData.get('min_purchase')),
                                                max_uses: formData.get('max_uses') ? Number(formData.get('max_uses')) : null,
                                                expiry_date: formData.get('expiry_date') || null
                                            });
                                            e.target.reset();
                                        }}>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Code (ex: LOLLY2024)</label>
                                                <input name="code" required type="text" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white uppercase" />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Type</label>
                                                    <select name="discount_type" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold focus:border-lolly outline-none text-white appearance-none">
                                                        <option value="percentage">Pourcentage (%)</option>
                                                        <option value="fixed">Fixe (CFA)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Valeur</label>
                                                    <input name="discount_value" required type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Achat Minimum (CFA)</label>
                                                <input name="min_purchase" defaultValue="0" type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Date d'expiration (Optionnel)</label>
                                                <input name="expiry_date" type="date" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                            </div>

                                            <button type="submit" className="w-full py-5 bg-lolly text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-lolly/20">
                                                Créer le coupon
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Zones de Livraison</h2>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Logistique & Tarification</p>
                            </header>

                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                <div className="xl:col-span-2 space-y-6">
                                    <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/[0.02] border-b border-white/5">
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Zone</th>
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Tarif</th>
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Livraison Gratuite</th>
                                                    <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {shippingZones.map((zone) => (
                                                    <tr key={zone.id} className="hover:bg-white/[0.01] transition-colors group">
                                                        <td className="p-8">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black italic">{zone.name}</span>
                                                                <span className="text-[8px] text-gray-500 font-bold uppercase mt-1">Estimé: {zone.estimated_days}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-8">
                                                            <p className="text-sm font-black">{Number(zone.price).toLocaleString()} CFA</p>
                                                        </td>
                                                        <td className="p-8">
                                                            <p className="text-[10px] font-black uppercase text-gray-500">
                                                                {zone.free_threshold ? `Dès ${Number(zone.free_threshold).toLocaleString()} CFA` : 'Non disponible'}
                                                            </p>
                                                        </td>
                                                        <td className="p-8 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteShippingZone(zone.id)}
                                                                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <h3 className="font-black uppercase italic text-sm tracking-widest text-white mb-8">Nouvelle Zone</h3>
                                        <form className="space-y-6" onSubmit={(e: any) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.target);
                                            handleAddShippingZone({
                                                name: formData.get('name'),
                                                price: Number(formData.get('price')),
                                                free_threshold: formData.get('free_threshold') ? Number(formData.get('free_threshold')) : null,
                                                estimated_days: formData.get('estimated_days')
                                            });
                                            e.target.reset();
                                        }}>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Nom de la Zone</label>
                                                <input name="name" required type="text" placeholder="ex: Dakar Plateau" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Tarif (CFA)</label>
                                                    <input name="price" required type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Délai</label>
                                                    <input name="estimated_days" placeholder="ex: 24h" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Gratuit dès (Optionnel)</label>
                                                <input name="free_threshold" type="number" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly outline-none text-white" />
                                            </div>

                                            <button type="submit" className="w-full py-5 bg-lolly text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-lolly/20">
                                                Ajouter la zone
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Avis Clients</h2>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Modération & Preuve Sociale</p>
                            </header>

                            <div className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/5">
                                            <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Produit & Client</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500">Note & Commentaire</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-center">Statut</th>
                                            <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {reviews.map((review) => (
                                            <tr key={review.id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td className="p-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black italic">{review.products?.name}</span>
                                                        <span className="text-[10px] text-lolly font-bold uppercase mt-1">{review.profiles?.full_name || 'Anonyme'}</span>
                                                        <span className="text-[8px] text-gray-500 font-medium">{review.profiles?.email}</span>
                                                    </div>
                                                </td>
                                                <td className="p-8 max-w-md">
                                                    <div className="flex items-center space-x-1 mb-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-600'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-300 italic">"{review.comment}"</p>
                                                    <p className="text-[8px] text-gray-500 mt-2 uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                                                </td>
                                                <td className="p-8 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                        review.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                                                        review.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 
                                                        'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                        {review.status === 'approved' ? 'Approuvé' : 
                                                         review.status === 'rejected' ? 'Refusé' : 
                                                         'En attente'}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {review.status !== 'approved' && (
                                                            <button 
                                                                onClick={() => updateReviewStatus(review.id, 'approved')}
                                                                className="p-3 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-xl transition-all"
                                                                title="Approuver"
                                                            >
                                                                <ThumbsUp className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        {review.status !== 'rejected' && (
                                                            <button 
                                                                onClick={() => updateReviewStatus(review.id, 'rejected')}
                                                                className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                                title="Rejeter"
                                                            >
                                                                <ThumbsDown className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => deleteReview(review.id)}
                                                            className="p-3 bg-white/5 text-gray-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {reviews.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-20 text-center text-gray-500 text-xs font-black uppercase tracking-widest opacity-20">
                                                    Aucun avis client à modérer
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic">Commandes Web</h2>
                                <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Suivi logistique et ventes en ligne</p>
                            </header>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <Loader2 className="w-12 h-12 border-4 border-lolly/20 border-t-lolly rounded-full animate-spin mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Récupération des commandes...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-white/5 border border-white/5 rounded-[48px] overflow-hidden backdrop-blur-xl group hover:border-white/10 transition-all">
                                            <div className="p-10">
                                                <div className="flex flex-wrap items-start justify-between gap-10 mb-10 pb-10 border-b border-white/5">
                                                    <div className="flex items-center space-x-10">
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Référence</p>
                                                            <p className="text-sm font-black italic uppercase">#{order.id.toString().padStart(6, '0')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Date</p>
                                                            <p className="text-sm font-bold uppercase">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Client</p>
                                                            <p className="text-sm font-black italic">{order.profiles?.full_name || 'Anonyme'}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">{order.profiles?.email}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] mb-2">Montant</p>
                                                            <p className="text-sm font-black text-lolly italic">{Number(order.total_amount).toLocaleString()} CFA</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-end gap-4">
                                                        <OrderStatusBadge status={order.status} />
                                                        <select 
                                                            className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400 outline-none focus:border-lolly transition-all"
                                                            value={order.status || 'pending'}
                                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                        >
                                                            <option value="pending">En attente</option>
                                                            <option value="processing">Préparation</option>
                                                            <option value="shipped">En route</option>
                                                            <option value="completed">Livré</option>
                                                            <option value="cancelled">Annulé</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center">
                                                            <Package className="w-3 h-3 mr-2" /> Articles ({order.sale_items?.length || 0})
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {order.sale_items?.map((item: any) => (
                                                                <div key={item.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                                                                            <Package className="w-4 h-4 text-gray-600" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold">{item.products?.name}</p>
                                                                            <p className="text-[9px] text-gray-500 font-medium">Quantité : {item.quantity}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs font-black italic">{Number(item.price).toLocaleString()} CFA</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5">
                                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center">
                                                            <Truck className="w-3 h-3 mr-2" /> Logistique
                                                        </h4>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-500 font-medium">Méthode de paiement</span>
                                                                <span className="font-black uppercase tracking-widest italic">{order.payment_method === 'cash' ? 'Espèces' : order.payment_method}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-500 font-medium">Téléphone Contact</span>
                                                                <span className="font-black italic">{order.profiles?.phone || 'Non renseigné'}</span>
                                                            </div>
                                                            <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                                                                <Link 
                                                                    href={`/admin/orders/${order.id}/invoice`}
                                                                    target="_blank"
                                                                    className="w-full py-4 bg-lolly/10 hover:bg-lolly/20 text-lolly rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2"
                                                                >
                                                                    <Printer className="w-3 h-3" />
                                                                    <span>Imprimer Facture</span>
                                                                </Link>
                                                                <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2">
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    <span>Voir bon de livraison</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length === 0 && (
                                        <div className="text-center py-40 opacity-20">
                                            <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                                            <p className="text-xs font-black uppercase tracking-widest">Aucune commande web</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="p-12 animate-in fade-in duration-500">
                            <header className="mb-12 flex items-center justify-between">
                                <div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter italic">Configuration</h2>
                                    <p className="text-gray-500 text-sm font-medium uppercase tracking-widest mt-2">Design & Vitrine Digitale</p>
                                </div>
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={isSaving || !settings}
                                    className="flex items-center space-x-3 px-10 py-5 bg-lolly text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-2xl shadow-lolly/20 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSaving ? 'Enregistrement...' : 'Publier les changements'}</span>
                                </button>
                            </header>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <Loader2 className="w-12 h-12 border-4 border-lolly/20 border-t-lolly rounded-full animate-spin mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Chargement du studio...</p>
                                </div>
                            ) : settings ? (
                                <div className="space-y-12 pb-40">
                                    <section className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <div className="flex items-center space-x-3 mb-8">
                                            <div className="w-10 h-10 bg-lolly/10 rounded-xl flex items-center justify-center text-lolly">
                                                <Megaphone className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-black uppercase italic text-sm tracking-widest text-white">Bandeau d'annonce</h3>
                                        </div>
                                        <input 
                                            type="text" 
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold focus:border-lolly/50 outline-none transition-all text-white placeholder:text-white/10"
                                            value={settings.announcement}
                                            onChange={e => setSettings({...settings, announcement: e.target.value})}
                                            placeholder="Ex: LIVRAISON OFFERTE CE WEEK-END !"
                                        />
                                    </section>

                                    <section className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                                    <ImageIcon className="w-5 h-5" />
                                                </div>
                                                <h3 className="font-black uppercase italic text-sm tracking-widest text-white">Carousel Principal</h3>
                                            </div>
                                            <button onClick={addSlide} className="flex items-center space-x-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                <Plus className="w-4 h-4" />
                                                <span>Ajouter un slide</span>
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-10">
                                            {settings.slides.map((slide: any, i: number) => (
                                                <div key={i} className="p-10 bg-black/40 rounded-[40px] border border-white/5 relative group">
                                                    <button onClick={() => removeSlide(i)} className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                                                        <div className="xl:col-span-1">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 ml-2">Image du slide</label>
                                                            </div>
                                                            <ImageUploadField value={slide.image} onChange={(url) => updateSlide(i, 'image', url)} />
                                                        </div>
                                                        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div className="space-y-6">
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Titre du slide</label>
                                                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white" value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Description courte</label>
                                                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white" value={slide.subtitle} onChange={e => updateSlide(i, 'subtitle', e.target.value)} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-6">
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Texte bouton</label>
                                                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white" value={slide.buttonText} onChange={e => updateSlide(i, 'buttonText', e.target.value)} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Lien de redirection</label>
                                                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white" value={slide.link} onChange={e => updateSlide(i, 'link', e.target.value)} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="bg-white/5 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
                                        <div className="flex items-center space-x-3 mb-10">
                                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-black uppercase italic text-sm tracking-widest text-white">Évènement du Moment</h3>
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Bannière Large (Desktop)</label>
                                                    <ImageUploadField value={settings.event.image} onChange={(url) => setSettings({...settings, event: {...settings.event, image: url}})} />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Bannière Menu (600x60)</label>
                                                    <ImageUploadField value={settings.event.mini_image} onChange={(url) => setSettings({...settings, event: {...settings.event, mini_image: url}})} />
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Titre de l'évènement</label>
                                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white" value={settings.event.title} onChange={e => setSettings({...settings, event: {...settings.event, title: e.target.value}})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Description Marketing</label>
                                                    <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white resize-none" value={settings.event.description} onChange={e => setSettings({...settings, event: {...settings.event, description: e.target.value}})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Lien CTA</label>
                                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold focus:border-lolly/50 outline-none text-white" value={settings.event.link} onChange={e => setSettings({...settings, event: {...settings.event, link: e.target.value}})} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            ) : null}
                        </div>
                    )}
                </main>
            </div>

            {selectedCustomer && (
                <CustomerDetailsModal 
                    customer={selectedCustomer} 
                    onClose={() => setSelectedCustomer(null)} 
                />
            )}

            {selectedProduct && (
                <EditProductModal 
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onSave={(updated) => {
                        setProducts(products.map(p => p.id === updated.id ? updated : p));
                    }}
                />
            )}
        </AdminGuard>
    );
}

// Helper Components
function OrderStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'completed':
            return <div className="flex items-center space-x-1.5 bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> <span>Livré</span></div>;
        case 'shipped':
            return <div className="flex items-center space-x-1.5 bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20"><Truck className="w-3 h-3" /> <span>En route</span></div>;
        case 'processing':
            return <div className="flex items-center space-x-1.5 bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-500/20"><Clock className="w-3 h-3" /> <span>Préparation</span></div>;
        case 'pending':
            return <div className="flex items-center space-x-1.5 bg-white/5 text-gray-400 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10"><AlertCircle className="w-3 h-3" /> <span>En attente</span></div>;
        case 'cancelled':
            return <div className="flex items-center space-x-1.5 bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-500/20"><X className="w-3 h-3" /> <span>Annulé</span></div>;
        default:
            return <div className="flex items-center space-x-1.5 bg-white/5 text-gray-400 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10"><span>{status}</span></div>;
    }
}

function ImageUploadField({ value, onChange }: { value: string, onChange: (url: string) => void }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.url) onChange(data.url);
        } catch (error) { alert("Erreur upload"); }
        finally { setUploading(false); }
    };

    return (
        <div className="relative group">
            <div className={`aspect-video bg-white/5 border-2 border-dashed ${value ? 'border-transparent' : 'border-white/10'} rounded-3xl overflow-hidden flex flex-col items-center justify-center relative transition-all group-hover:border-lolly/30 group-hover:bg-lolly/5`}>
                {value ? (
                    <>
                        <img src={value} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button onClick={() => fileInputRef.current?.click()} className="p-5 bg-lolly text-white rounded-full shadow-2xl hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-6 cursor-pointer w-full h-full flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                        {uploading ? (
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 border-4 border-lolly/20 border-t-lolly rounded-full animate-spin mb-4" />
                                <p className="text-[8px] font-black uppercase tracking-widest text-lolly">Upload...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-lolly/20 transition-colors">
                                    <Upload className="w-6 h-6 text-white/20 group-hover:text-lolly" />
                                </div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Glisser ou cliquer</p>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
            {value && (
                <button onClick={() => onChange('')} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500/80 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-red-600 transition-colors z-10">
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

function AdminLink({ icon, label, active = false, onClick }: any) {
    return (
        <button onClick={onClick} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-lolly text-white shadow-2xl shadow-lolly/40' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
            <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
            <span>{label}</span>
        </button>
    );
}

function StatCard({ title, value, unit, trend }: any) {
    return (
        <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] hover:bg-white/[0.07] transition-all group">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 group-hover:text-lolly transition-colors">{title}</p>
            <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black italic">{value}</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{unit}</span>
            </div>
            <div className="mt-4 flex items-center space-x-2">
                <div className="bg-green-500/10 px-2 py-1 rounded-lg">
                    <span className="text-[10px] font-black text-green-500">{trend}</span>
                </div>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">vs hier</span>
            </div>
        </div>
    );
}
