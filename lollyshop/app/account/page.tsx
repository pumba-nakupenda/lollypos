'use client'

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useUser } from '@/context/UserContext';
import { useWishlist } from '@/context/WishlistContext';
import { User, Package, MapPin, Shield, LogOut, ChevronRight, ShoppingBag, Phone, Mail, Plus, Trash2, CheckCircle2, Loader2, X, Heart, CreditCard, Clock, Truck, Check, AlertCircle, Gift, TrendingUp, History, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

export default function AccountPage() {
    const { user, profile, signOut } = useUser();
    const { wishlist, loading: wishlistLoading } = useWishlist();
    const [activeTab, setActiveTab] = useState('profile');
    
    // Orders State
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Loyalty State
    const [loyaltyHistory, setLoyaltyHistory] = useState<any[]>([]);
    const [loadingLoyalty, setLoadingLoyalty] = useState(false);

    // Profile Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: profile?.full_name || '',
        phone: profile?.phone || ''
    });

    // Address Management State
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Maison',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: 'Dakar',
        is_default: false
    });

    useEffect(() => {
        if (profile) {
            setEditForm({
                full_name: profile.full_name || '',
                phone: profile.phone || ''
            });
        }
    }, [profile]);

    useEffect(() => {
        if (activeTab === 'addresses') fetchAddresses();
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'loyalty') fetchLoyalty();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const res = await fetch('/api/user/orders');
            const data = await res.json();
            if (Array.isArray(data)) setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders");
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchLoyalty = async () => {
        setLoadingLoyalty(true);
        try {
            const res = await fetch('/api/user/loyalty-history');
            const data = await res.json();
            if (Array.isArray(data)) setLoyaltyHistory(data);
        } catch (error) {
            console.error("Failed to fetch loyalty history");
        } finally {
            setLoadingLoyalty(false);
        }
    };

    const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
            const res = await fetch('/api/user/addresses');
            const data = await res.json();
            if (Array.isArray(data)) setAddresses(data);
        } catch (error) {
            console.error("Failed to fetch addresses");
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (!res.ok) throw new Error('Erreur');
            window.location.reload();
        } catch (error) {
            alert("Erreur de sauvegarde");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingAddress(true);
        try {
            const res = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAddress)
            });
            if (!res.ok) throw new Error('Erreur');
            setIsAddressModalOpen(false);
            setNewAddress({ label: 'Maison', full_name: '', phone: '', address_line1: '', address_line2: '', city: 'Dakar', is_default: false });
            fetchAddresses();
        } catch (error) {
            alert("Erreur lors de l'ajout");
        } finally {
            setIsAddingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Supprimer cette adresse ?")) return;
        try {
            await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
            fetchAddresses();
        } catch (error) {
            alert("Erreur suppression");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await fetch(`/api/user/addresses/${id}`, { method: 'PATCH' });
            fetchAddresses();
        } catch (error) {
            console.error("Failed to set default address");
        }
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#eaeded]">
                <Navbar />
                
                <main className="max-w-[1200px] mx-auto px-4 py-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        
                        {/* Sidebar */}
                        <aside className="w-full md:w-72 space-y-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black text-xl italic">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Client Lolly</p>
                                        <p className="text-sm font-bold truncate max-w-[150px]">{user?.email}</p>
                                    </div>
                                </div>
                                
                                <nav className="space-y-1">
                                    <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-4 h-4" />} label="Mon Profil" />
                                    <TabButton active={activeTab === 'loyalty'} onClick={() => setActiveTab('loyalty')} icon={<Star className="w-4 h-4" />} label="Lolly Club" />
                                    <TabButton active={activeTab === 'wishlist'} onClick={() => setActiveTab('wishlist')} icon={<Heart className="w-4 h-4" />} label="Liste de Souhaits" />
                                    <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<Package className="w-4 h-4" />} label="Commandes" />
                                    <TabButton active={activeTab === 'addresses'} onClick={() => setActiveTab('addresses')} icon={<MapPin className="w-4 h-4" />} label="Adresses" />
                                    <button 
                                        onClick={signOut}
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all mt-4"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Déconnexion</span>
                                    </button>
                                </nav>
                            </div>

                            <div onClick={() => setActiveTab('loyalty')} className="bg-gradient-to-br from-black to-gray-800 p-6 rounded-2xl text-white shadow-xl cursor-pointer hover:scale-[1.02] transition-all group">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 group-hover:text-lolly transition-colors">Lolly Privilege</p>
                                <h3 className="text-xl font-black italic mb-2">LOLLY CLUB</h3>
                                <div className="flex items-center space-x-2 text-lolly mb-4">
                                    <span className="text-2xl font-black">{profile?.loyalty_points || 0}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Points</span>
                                </div>
                                <p className="text-xs opacity-80 mb-6">Bénéficiez de la livraison gratuite dès 1000 points !</p>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-lolly shadow-[0_0_10px_#0055ff] transition-all duration-1000" 
                                        style={{ width: `${Math.min(((profile?.loyalty_points || 0) / 1000) * 100, 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-[9px] font-bold uppercase opacity-50">
                                        {profile?.loyalty_points || 0} / 1000 pts
                                    </p>
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>
                        </aside>

                        {/* Content Area */}
                        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 min-h-[500px]">
                            {activeTab === 'profile' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Détails du Profil</h2>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Gérez vos informations personnelles</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InfoBlock label="Nom complet" value={profile?.full_name || "Non renseigné"} icon={<User className="w-4 h-4" />} />
                                        <InfoBlock label="Adresse Email" value={user?.email} icon={<Mail className="w-4 h-4" />} />
                                        <InfoBlock label="Téléphone" value={profile?.phone || "Non renseigné"} icon={<Phone className="w-4 h-4" />} />
                                        <InfoBlock label="Date d'inscription" value={new Date(user?.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} icon={<ShoppingBag className="w-4 h-4" />} />
                                    </div>
                                    
                                    <div className="mt-12 p-8 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="text-center md:text-left">
                                            <h4 className="font-black uppercase italic text-sm">Complétez votre profil</h4>
                                            <p className="text-xs text-gray-400 mt-1">Gagnez 50 points de fidélité en remplissant toutes vos infos !</p>
                                        </div>
                                        <button 
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="px-8 py-4 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-lolly transition-all shadow-lg hover:shadow-lolly/20"
                                        >
                                            Modifier mes infos
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'loyalty' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                                        <div>
                                            <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Lolly Club</h2>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-2">Votre fidélité récompensée</p>
                                        </div>
                                        <div className="bg-lolly/10 px-6 py-4 rounded-2xl border border-lolly/20">
                                            <p className="text-[10px] font-black uppercase text-lolly tracking-widest mb-1">Solde Actuel</p>
                                            <p className="text-2xl font-black italic">{profile?.loyalty_points || 0} <span className="text-xs uppercase font-bold tracking-tighter">Points</span></p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                                        <LoyaltyFeatureCard icon={<ShoppingBag className="w-5 h-5" />} title="Accumulez" desc="Gagnez 1 pt pour chaque 100 CFA dépensé" />
                                        <LoyaltyFeatureCard icon={<Truck className="w-5 h-5" />} title="Livraison" desc="Gratuite dès 1000 pts cumulés" />
                                        <LoyaltyFeatureCard icon={<Gift className="w-5 h-5" />} title="Cadeaux" desc="Accès aux ventes privées Lolly" />
                                    </div>

                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
                                        <History className="w-4 h-4 mr-2" /> Historique des points
                                    </h3>

                                    {loadingLoyalty ? (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
                                            <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Mise à jour...</p>
                                        </div>
                                    ) : loyaltyHistory.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune transaction pour le moment</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {loyaltyHistory.map((h) => (
                                                <div key={h.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.points_change > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {h.points_change > 0 ? <TrendingUp className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">{h.reason}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`text-sm font-black italic ${h.points_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {h.points_change > 0 ? '+' : ''}{h.points_change} pts
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'wishlist' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-8">Ma Liste de Souhaits</h2>
                                    
                                    {wishlistLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                            <p className="text-xs uppercase font-black tracking-widest">Synchronisation...</p>
                                        </div>
                                    ) : wishlist.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-[32px] border border-gray-100">
                                            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Heart className="w-10 h-10 text-gray-200" />
                                            </div>
                                            <h2 className="text-xl font-bold mb-2 italic uppercase">Liste vide</h2>
                                            <p className="text-gray-400 text-sm mb-8 max-w-[250px] mx-auto">Sauvegardez vos coups de cœur pour les retrouver ici.</p>
                                            <Link href="/" className="px-10 py-5 bg-lolly text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all">
                                                Découvrir le catalogue
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {wishlist.map((product) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-8">Mes Commandes</h2>
                                    
                                    {loadingOrders ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                            <p className="text-xs uppercase font-black tracking-widest">Récupération...</p>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-[32px] border border-gray-100">
                                            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Package className="w-10 h-10 text-gray-200" />
                                            </div>
                                            <h2 className="text-xl font-bold mb-2 italic uppercase">Historique vide</h2>
                                            <p className="text-gray-400 text-sm mb-8 max-w-[250px] mx-auto">Vos futurs achats et gourmandises apparaîtront ici.</p>
                                            <Link href="/" className="px-10 py-5 bg-lolly text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:shadow-lolly/40 transition-all hover:-translate-y-1">
                                                Faire un tour en boutique
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {orders.map((order) => (
                                                <div key={order.id} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="bg-gray-50 px-8 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                                                        <div className="flex items-center space-x-6">
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Commande</p>
                                                                <p className="text-xs font-bold uppercase">#{order.id.toString().padStart(6, '0')}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Date</p>
                                                                <p className="text-xs font-bold uppercase">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Total</p>
                                                                <p className="text-xs font-black text-lolly uppercase">{Number(order.total_amount).toLocaleString()} CFA</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <OrderStatusBadge status={order.status} />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-8">
                                                        <div className="space-y-4">
                                                            {order.sale_items?.map((item: any) => (
                                                                <div key={item.id} className="flex items-center space-x-4">
                                                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center p-2">
                                                                        {item.products?.image ? (
                                                                            <img src={item.products.image} alt="" className="w-full h-full object-contain" />
                                                                        ) : (
                                                                            <ShoppingBag className="w-6 h-6 text-gray-200" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-gray-900 truncate">{item.products?.name}</p>
                                                                        <p className="text-[10px] text-gray-500 font-medium">Quantité : {item.quantity}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-black italic">{Number(item.price).toLocaleString()} <span className="text-[8px]">CFA</span></p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        
                                                        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                                            <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                <CreditCard className="w-3 h-3" />
                                                                <span>Payé par {order.payment_method === 'cash' ? 'Espèces' : order.payment_method}</span>
                                                            </div>
                                                            <button className="px-6 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-lolly transition-all">
                                                                Détails
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'addresses' && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Mes Adresses</h2>
                                        <button 
                                            onClick={() => setIsAddressModalOpen(true)}
                                            className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-lolly transition-all shadow-lg shadow-black/10"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>Ajouter une adresse</span>
                                        </button>
                                    </div>
                                    
                                    {loadingAddresses ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 italic">
                                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                            <p className="text-xs uppercase font-black tracking-widest">Chargement...</p>
                                        </div>
                                    ) : addresses.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
                                            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                            <p className="text-sm font-bold text-gray-400">Aucune adresse enregistrée</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {addresses.map((addr) => (
                                                <div key={addr.id} className={`p-8 border-2 rounded-[32px] transition-all relative overflow-hidden group ${addr.is_default ? 'border-black bg-white shadow-xl' : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'}`}>
                                                    {addr.is_default && (
                                                        <div className="absolute top-0 right-0 p-6">
                                                            <div className="flex items-center space-x-1.5 bg-black text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                <span>Défaut</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-lolly mb-1 tracking-widest">{addr.label}</p>
                                                            <p className="text-base font-black italic">{addr.full_name}</p>
                                                        </div>
                                                        
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-gray-700">{addr.address_line1}</p>
                                                            {addr.address_line2 && <p className="text-xs text-gray-500 font-medium">{addr.address_line2}</p>}
                                                            <p className="text-sm font-black uppercase tracking-tighter">{addr.city}</p>
                                                        </div>
                                                        
                                                        <div className="flex items-center text-xs text-gray-500 font-bold space-x-2 pt-2">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{addr.phone}</span>
                                                        </div>

                                                        <div className="pt-6 flex items-center justify-between border-t border-gray-100 mt-6">
                                                            {!addr.is_default && (
                                                                <button 
                                                                    onClick={() => handleSetDefault(addr.id)}
                                                                    className="text-[10px] font-black uppercase text-gray-400 hover:text-black transition-colors underline underline-offset-4"
                                                                >
                                                                    Définir par défaut
                                                                </button>
                                                            )}
                                                            <div className="flex-1" />
                                                            <button 
                                                                onClick={() => handleDeleteAddress(addr.id)}
                                                                className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </main>

                {/* Edit Profile Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setIsEditModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-md p-8 rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-2xl font-black uppercase italic italic tracking-tighter mb-6">Modifier mes infos</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom Complet</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm outline-none focus:border-lolly transition-all font-bold"
                                        value={editForm.full_name}
                                        onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                        placeholder="Prénom et Nom"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Téléphone</label>
                                    <input 
                                        type="tel" 
                                        required 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-5 text-sm outline-none focus:border-lolly transition-all font-bold"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        placeholder="77 000 00 00"
                                    />
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-2 px-8 py-4 bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-lolly transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {isSaving ? 'Enregistrement...' : 'Sauvegarder'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Address Modal */}
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isAddingAddress && setIsAddressModalOpen(false)} />
                        <div className="relative bg-white w-full max-w-lg p-8 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Nouvelle Adresse</h3>
                                <button onClick={() => setIsAddressModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all"><X className="w-6 h-6" /></button>
                            </div>
                            
                            <form onSubmit={handleAddAddress} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Label</label>
                                        <select 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-lolly"
                                            value={newAddress.label}
                                            onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                        >
                                            <option value="Maison">Maison</option>
                                            <option value="Bureau">Bureau</option>
                                            <option value="Autre">Autre</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ville</label>
                                        <input 
                                            type="text" required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-lolly"
                                            value={newAddress.city}
                                            onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom du destinataire</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-lolly"
                                        placeholder="Ex: Moussa Diop"
                                        value={newAddress.full_name}
                                        onChange={e => setNewAddress({ ...newAddress, full_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Téléphone de livraison</label>
                                    <input 
                                        type="tel" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-lolly"
                                        placeholder="77 000 00 00"
                                        value={newAddress.phone}
                                        onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Adresse (Ligne 1)</label>
                                    <input 
                                        type="text" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:border-lolly"
                                        placeholder="Rue, Immeuble, Appartement"
                                        value={newAddress.address_line1}
                                        onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                                    <input 
                                        type="checkbox" 
                                        id="is_default"
                                        className="w-5 h-5 accent-black"
                                        checked={newAddress.is_default}
                                        onChange={e => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                                    />
                                    <label htmlFor="is_default" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Définir comme adresse par défaut</label>
                                </div>

                                <button 
                                    type="submit"
                                    disabled={isAddingAddress}
                                    className="w-full py-5 bg-black text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-2xl hover:bg-lolly transition-all shadow-xl disabled:opacity-50"
                                >
                                    {isAddingAddress ? 'Enregistrement...' : 'Ajouter l\'adresse'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'completed':
            return <div className="flex items-center space-x-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100"><Check className="w-3 h-3" /> <span>Livré</span></div>;
        case 'shipped':
            return <div className="flex items-center space-x-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100"><Truck className="w-3 h-3" /> <span>En route</span></div>;
        case 'processing':
            return <div className="flex items-center space-x-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-100"><Clock className="w-3 h-3" /> <span>Préparation</span></div>;
        case 'pending':
            return <div className="flex items-center space-x-1.5 bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-gray-100"><AlertCircle className="w-3 h-3" /> <span>En attente</span></div>;
        default:
            return <div className="flex items-center space-x-1.5 bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-gray-100"><span>{status}</span></div>;
    }
}

function LoyaltyFeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 hover:border-lolly/30 transition-all">
            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-lolly mb-4">{icon}</div>
            <h4 className="text-xs font-black uppercase tracking-tighter mb-1 italic">{title}</h4>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}

function TabButton({ active, icon, label, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${active ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
            <div className="flex items-center space-x-3">
                {icon}
                <span>{label}</span>
            </div>
            {active && <ChevronRight className="w-3 h-3" />}
        </button>
    );
}

function InfoBlock({ label, value, icon }: any) {
    return (
        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-start space-x-4">
            <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400">{icon}</div>
            <div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">{label}</p>
                <p className="text-sm font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
