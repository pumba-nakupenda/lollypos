'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';

export default function InvoicePage() {
    const params = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/admin/orders/${params.id}`);
                const data = await res.json();
                setOrder(data);
            } catch (e) {
                console.error("Failed to fetch order", e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Génération de la facture...</p>
        </div>
    );

    if (!order) return <div className="p-20 text-center">Commande non trouvée</div>;

    const subtotal = order.sale_items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
    const discount = subtotal - (Number(order.total_amount) - (order.shipping_cost || 0)); // Estimation simple si pas stocké explicitement

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
            {/* Top Bar - Hidden on print */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <button 
                    onClick={() => window.history.back()}
                    className="flex items-center text-xs font-bold text-gray-500 hover:text-black transition-all"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </button>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center px-6 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
                >
                    <Printer className="w-4 h-4 mr-2" /> Imprimer la facture
                </button>
            </div>

            {/* Invoice Paper */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-[32px] overflow-hidden print:shadow-none print:rounded-none">
                <div className="p-12 sm:p-16">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter mb-2">LOLLY<span className="text-[#fde700]">.</span></h1>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Concept Store Dakar</p>
                            <div className="mt-8 text-xs text-gray-600 space-y-1">
                                <p>Sacré Cœur 3, Dakar, Sénégal</p>
                                <p>+221 77 235 47 47</p>
                                <p>contact@lollyshop.sn</p>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <h2 className="text-5xl font-black text-gray-100 uppercase tracking-tighter mb-6 print:text-gray-200">Facture</h2>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400">Numéro de Commande</p>
                                <p className="text-lg font-black italic uppercase">#{order.id.toString().padStart(6, '0')}</p>
                            </div>
                            <div className="mt-6 space-y-2">
                                <p className="text-[10px] font-black uppercase text-gray-400">Date d'émission</p>
                                <p className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16 py-12 border-y border-gray-100">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Facturé à</h3>
                            <p className="text-lg font-black italic mb-2">{order.profiles?.full_name || 'Client Anonyme'}</p>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p>{order.profiles?.email}</p>
                                <p>{order.profiles?.phone}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Livraison</h3>
                            <div className="text-xs text-gray-600 space-y-1 italic">
                                <p>Dakar, Sénégal</p>
                                <p className="font-bold text-black mt-2">Méthode: {order.payment_method === 'cash' ? 'Paiement à la livraison' : order.payment_method}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-16">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest">Description</th>
                                <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest">Qté</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Prix Unitaire</th>
                                <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.sale_items?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-6 text-sm font-bold text-gray-900">{item.products?.name}</td>
                                    <td className="py-6 text-center text-sm font-medium">{item.quantity}</td>
                                    <td className="py-6 text-right text-sm font-medium">{Number(item.price).toLocaleString()} CFA</td>
                                    <td className="py-6 text-right text-sm font-black italic">{(item.price * item.quantity).toLocaleString()} CFA</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Sous-total</span>
                                <span className="font-bold">{subtotal.toLocaleString()} CFA</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="font-medium">Réduction</span>
                                    <span className="font-bold">-{discount.toLocaleString()} CFA</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">Livraison</span>
                                <span className="font-bold">Gratuit</span>
                            </div>
                            <div className="pt-4 border-t-2 border-black flex justify-between items-baseline">
                                <span className="text-lg font-black uppercase tracking-tighter italic">Total</span>
                                <span className="text-2xl font-black italic">{Number(order.total_amount).toLocaleString()} CFA</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-24 pt-12 border-t border-gray-100 text-center">
                        <p className="text-sm font-black italic mb-2">Merci pour votre confiance !</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">LOLLY SHOP - L'élégance à portée de main</p>
                    </div>
                </div>
            </div>
            
            {/* Print Styling */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    .print\:shadow-none {
                        shadow: none !important;
                        box-shadow: none !important;
                    }
                    @page {
                        margin: 2cm;
                    }
                }
            `}</style>
        </div>
    );
}
