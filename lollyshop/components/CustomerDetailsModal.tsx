'use client'

import React, { useState, useEffect } from 'react';
import { 
    X, Package, MapPin, Calendar, ShoppingBag, 
    Phone, Mail, User, Loader2, CheckCircle2, 
    Clock, Truck, AlertCircle, TrendingUp, ShieldAlert, ShieldCheck
} from 'lucide-react';

interface CustomerDetailsModalProps {
    customer: any;
    onClose: () => void;
}

export default function CustomerDetailsModal({ customer, onClose }: CustomerDetailsModalProps) {
    const [orders, setOrders] = useState<any[]>([]);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(customer.is_active !== false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch customer orders
                const ordersRes = await fetch(`/api/admin/orders?customer_id=${customer.id}`);
                const ordersData = await ordersRes.json();
                if (Array.isArray(ordersData)) {
                    // Filter orders for this customer (if the API doesn't do it)
                    setOrders(ordersData.filter((o: any) => o.customer_id === customer.id));
                }

                // Fetch customer addresses (we might need a new admin API for this or use the existing one if allowed)
                const addrRes = await fetch(`/api/admin/customers/${customer.id}/addresses`);
                if (addrRes.ok) {
                    const addrData = await addrRes.json();
                    setAddresses(addrData);
                }
            } catch (error) {
                console.error("Failed to fetch customer details", error);
            } finally {
                setLoading(false);
            }
        };

        if (customer) fetchData();
    }, [customer]);

    const toggleStatus = async () => {
        setIsUpdatingStatus(true);
        try {
            const res = await fetch('/api/admin/customers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: customer.id, is_active: !isActive })
            });
            if (res.ok) {
                setIsActive(!isActive);
            }
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (!customer) return null;

    const totalSpent = orders.reduce((acc, o) => acc + Number(o.total_amount), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#111114] border border-white/10 w-full max-w-5xl max-h-[90vh] rounded-[48px] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <header className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-lolly/10 rounded-3xl flex items-center justify-center text-lolly font-black italic text-2xl border border-lolly/20 relative">
                            {customer.full_name?.[0]?.toUpperCase() || customer.email?.[0]?.toUpperCase()}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#111114] ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                            <div className="flex items-center space-x-3">
                                <h2 className="text-2xl font-black italic">{customer.full_name || 'Sans nom'}</h2>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {isActive ? 'Compte Actif' : 'Compte Bloqué'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">{customer.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={toggleStatus}
                            disabled={isUpdatingStatus}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white'}`}
                        >
                            {isUpdatingStatus ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isActive ? (
                                <ShieldAlert className="w-3 h-3" />
                            ) : (
                                <ShieldCheck className="w-3 h-3" />
                            )}
                            <span>{isActive ? 'Bloquer le client' : 'Débloquer le client'}</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-4 hover:bg-white/5 rounded-2xl transition-all group"
                        >
                            <X className="w-6 h-6 text-gray-500 group-hover:text-white" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <Loader2 className="w-12 h-12 animate-spin text-lolly mb-6" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Analyse du profil client...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Left Column: Stats & Contact */}
                            <div className="space-y-10">
                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Résumé Activité</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Total Dépensé</p>
                                            <p className="text-2xl font-black italic text-lolly">{totalSpent.toLocaleString()} CFA</p>
                                        </div>
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Points Fidélité</p>
                                            <p className="text-2xl font-black italic text-white">{customer.loyalty_points || 0} pts</p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Coordonnées</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                            <span className="text-xs font-bold">{customer.phone || 'Non renseigné'}</span>
                                        </div>
                                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <Mail className="w-4 h-4 text-gray-500" />
                                            <span className="text-xs font-bold">{customer.email}</span>
                                        </div>
                                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <Calendar className="w-4 h-4 text-gray-500" />
                                            <span className="text-xs font-bold">Inscrit le {new Date(customer.created_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">Adresses de Livraison</h3>
                                    <div className="space-y-4">
                                        {addresses.map((addr) => (
                                            <div key={addr.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 relative group">
                                                {addr.is_default && (
                                                    <span className="absolute top-4 right-4 text-[8px] font-black uppercase bg-lolly/20 text-lolly px-2 py-0.5 rounded">Défaut</span>
                                                )}
                                                <div className="flex items-start space-x-3">
                                                    <MapPin className="w-4 h-4 text-lolly mt-1" />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-white mb-1">{addr.label}</p>
                                                        <p className="text-xs font-medium text-gray-400">{addr.address_line1}</p>
                                                        {addr.address_line2 && <p className="text-xs font-medium text-gray-400">{addr.address_line2}</p>}
                                                        <p className="text-xs font-bold text-gray-500 mt-1">{addr.city}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {addresses.length === 0 && (
                                            <p className="text-[10px] text-gray-500 italic">Aucune adresse enregistrée</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Order History */}
                            <div className="lg:col-span-2 space-y-10">
                                <section>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Historique des Commandes</h3>
                                        <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black">{orders.length} commandes</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                                                <div className="flex flex-wrap items-center justify-between gap-6">
                                                    <div className="flex items-center space-x-6">
                                                        <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center">
                                                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black italic uppercase">#{order.id.toString().padStart(6, '0')}</p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-10">
                                                        <div className="text-right">
                                                            <p className="text-xs font-black italic text-lolly">{Number(order.total_amount).toLocaleString()} CFA</p>
                                                            <p className="text-[9px] text-gray-500 font-medium uppercase tracking-widest">{order.payment_method === 'cash' ? 'Espèces' : order.payment_method}</p>
                                                        </div>
                                                        <div className="w-32 flex justify-end">
                                                            <OrderStatusBadge status={order.status} />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Mini items list */}
                                                <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                                                    {order.sale_items?.map((item: any) => (
                                                        <span key={item.id} className="bg-black/40 px-3 py-1.5 rounded-xl text-[9px] font-bold text-gray-400 border border-white/5">
                                                            {item.quantity}x {item.products?.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        {orders.length === 0 && (
                                            <div className="text-center py-20 bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                                                <Package className="w-10 h-10 mx-auto mb-4 text-gray-700" />
                                                <p className="text-xs font-black uppercase tracking-widest text-gray-600">Aucune commande passée</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'completed':
            return <div className="flex items-center space-x-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20"><CheckCircle2 className="w-3 h-3" /> <span>Livré</span></div>;
        case 'shipped':
            return <div className="flex items-center space-x-1.5 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20"><Truck className="w-3 h-3" /> <span>En route</span></div>;
        case 'processing':
            return <div className="flex items-center space-x-1.5 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-500/20"><Clock className="w-3 h-3" /> <span>Préparation</span></div>;
        case 'pending':
            return <div className="flex items-center space-x-1.5 bg-white/5 text-gray-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10"><AlertCircle className="w-3 h-3" /> <span>En attente</span></div>;
        case 'cancelled':
            return <div className="flex items-center space-x-1.5 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-500/20"><X className="w-3 h-3" /> <span>Annulé</span></div>;
        default:
            return <div className="flex items-center space-x-1.5 bg-white/5 text-gray-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10"><span>{status}</span></div>;
    }
}
