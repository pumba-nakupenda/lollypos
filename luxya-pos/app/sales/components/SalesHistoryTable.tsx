'use client'

import React from 'react';
import { Clock, ArrowRight, Truck, Receipt, RefreshCw, Trash2 } from 'lucide-react';

interface SalesHistoryTableProps {
    history: any[];
    isAgency: boolean;
    docType: string;
    handleTransformDocument: (sale: any, targetType: 'invoice' | 'delivery_note') => void;
    handleViewReceipt: (sale: any) => void;
    handleDeleteSale: (id: string) => void;
    handleCancelSale: (sale: any) => void;
}

export default function SalesHistoryTable({
    history, isAgency, docType,
    handleTransformDocument, handleViewReceipt, handleDeleteSale, handleCancelSale
}: SalesHistoryTableProps) {
    
    return (
        <div className="space-y-8">
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
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest">{isAgency ? 'Type & N°' : 'Mode'}</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Total</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Ticket</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.filter(s => !isAgency || s.type === docType).map((sale) => (
                                <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-2 h-2 rounded-full ${sale.type === 'quote' ? 'bg-orange-500' : 'bg-green-500'} shadow-[0_0_10px_rgba(34,197,94,0.5)]`} />
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white uppercase text-xs">{sale.customer_name || 'Client Comptant'}</span>
                                                {sale.profiles?.email && (
                                                    <span className="text-[7px] text-shop font-black uppercase tracking-widest mt-0.5">Par: {sale.profiles.email.split('@')[0]}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-[10px] font-bold text-muted-foreground uppercase">{new Date(sale.created_at).toLocaleDateString()}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase w-fit ${
                                                sale.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                sale.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                                sale.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                                                sale.type === 'quote' ? 'bg-orange-500/20 text-orange-400' :
                                                sale.type === 'delivery_note' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                                {sale.status === 'cancelled' ? 'Annulé' : 
                                                 sale.status === 'pending' ? 'En attente' :
                                                 sale.status === 'shipped' ? 'Expédié' :
                                                 sale.status === 'processing' ? 'Préparation' :
                                                 sale.type === 'quote' ? 'Devis' : 
                                                 sale.type === 'delivery_note' ? 'Bon de Livraison' : 
                                                 'Facture'}
                                            </span>
                                            {sale.invoice_number && (
                                                <span className="text-[9px] font-bold text-white/40 mt-1">{sale.invoice_number}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`px-8 py-6 text-right font-black text-sm ${sale.status === 'cancelled' ? 'text-muted-foreground line-through' : 'text-shop'}`}>{Number(sale.total_amount).toLocaleString()}</td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            {isAgency && sale.type === 'quote' && (
                                                <button
                                                    onClick={() => handleTransformDocument(sale, 'invoice')}
                                                    title="Transformer en Facture"
                                                    className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                                >
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            )}
                                            {isAgency && sale.type === 'invoice' && (
                                                <button
                                                    onClick={() => handleTransformDocument(sale, 'delivery_note')}
                                                    title="Transformer en Bon de Livraison"
                                                    className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-all"
                                                >
                                                    <Truck className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleViewReceipt(sale)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-shop transition-all group-hover:scale-110">
                                                <Receipt className="w-4 h-4" />
                                            </button>
                                            {sale.status !== 'cancelled' && sale.type !== 'quote' && (
                                                <button onClick={() => handleCancelSale(sale)} title="Annuler et Rétablir Stock" className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-orange-400 transition-all opacity-0 group-hover:opacity-100">
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteSale(sale.id)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
