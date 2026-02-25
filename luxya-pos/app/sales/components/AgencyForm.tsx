'use client'

import React from 'react';
import { FileText, X, Search, PlusCircle, Check, RefreshCw, LayoutDashboard } from 'lucide-react';
import CustomDropdown from '@/components/CustomDropdown';

interface AgencyFormProps {
    docType: 'quote' | 'invoice' | 'delivery_note';
    setDocType: (val: 'quote' | 'invoice' | 'delivery_note') => void;
    linkedDocNumber: string | null;
    setLinkedDocNumber: (val: string | null) => void;
    customerName: string;
    setCustomerName: (val: string) => void;
    allCustomers: any[];
    setSelectedCustomerId: (val: string | null) => void;
    productSearch: string;
    setProductSearch: (val: string) => void;
    products: any[];
    addProductToAgency: (p: any) => void;
    agencyLines: any[];
    updateAgencyLine: (id: number, field: string, value: any) => void;
    setAgencyLines: React.Dispatch<React.SetStateAction<any[]>>;
    addAgencyLine: () => void;
    paidAmount: string;
    setPaidAmount: (val: string) => void;
    totalAmount: number;
    isCheckingOut: boolean;
    handleCheckout: () => void;
    projects: any[];
    selectedProjectId: string | null;
    setSelectedProjectId: (val: string | null) => void;
}

export default function AgencyForm({
    docType, setDocType, linkedDocNumber, setLinkedDocNumber,
    customerName, setCustomerName, allCustomers, setSelectedCustomerId,
    productSearch, setProductSearch, products, addProductToAgency,
    agencyLines, updateAgencyLine, setAgencyLines, addAgencyLine,
    paidAmount, setPaidAmount, totalAmount, isCheckingOut, handleCheckout,
    projects, selectedProjectId, setSelectedProjectId
}: AgencyFormProps) {
    
    const quickTasks = [
        { name: 'Conseil', price: 50000 },
        { name: 'Maintenance', price: 25000 },
        { name: 'Frais Dossier', price: 10000 },
        { name: 'Déplacement', price: 5000 },
    ];

    return (
        <div className="glass-panel p-4 sm:p-10 rounded-[32px] sm:rounded-[40px] border-white/5 bg-white/[0.01] space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-shop/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-shop" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-3xl font-black uppercase tracking-tighter text-white font-museo leading-tight">Édition Document</h2>
                        <div className="flex items-center space-x-2">
                            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {linkedDocNumber ? `Lien : ${linkedDocNumber}` : 'Devis & Factures'}
                            </p>
                            {linkedDocNumber && (
                                <button onClick={() => setLinkedDocNumber(null)} className="text-red-400 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full md:w-auto">
                    {(['quote', 'invoice', 'delivery_note'] as const).map(t => (
                        <button key={t} onClick={() => setDocType(t)} className={`flex-1 md:flex-none px-3 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${docType === t ? 'bg-shop text-white shadow-lg' : 'text-muted-foreground hover:text-white'}`}>
                            {t === 'quote' ? 'Devis' : t === 'invoice' ? 'Facture' : 'BL'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-2">Client / Entreprise</label>
                    <div className="relative group">
                        <input
                            list="agency-customer-list"
                            value={customerName}
                            onChange={e => {
                                const name = e.target.value;
                                setCustomerName(name);
                                const found = allCustomers.find(c => c.name?.toLowerCase() === name.toLowerCase());
                                setSelectedCustomerId(found ? found.id : null);
                            }}
                            placeholder="Nom du client..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 sm:py-4 px-5 sm:px-6 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white"
                        />
                        <datalist id="agency-customer-list">
                            <option value="Client Comptant" />
                            {allCustomers.map(c => <option key={c.id} value={c.name} />)}
                        </datalist>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-2">Recherche Service</label>
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
                            placeholder="Chercher service..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 sm:py-4 pl-12 pr-6 text-sm font-bold outline-none focus:border-shop/50 transition-all text-white"
                        />
                        <datalist id="agency-product-list">
                            {products.map(p => <option key={p.id} value={p.name}>{p.price.toLocaleString()} FCFA</option>)}
                        </datalist>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-2">Ajout Rapide</p>
                <div className="flex flex-wrap gap-2">
                    {quickTasks.map(task => (
                        <button 
                            key={task.name}
                            onClick={() => {
                                const newLine = { id: Date.now(), name: task.name, quantity: 1, price: task.price };
                                setAgencyLines([...agencyLines, newLine]);
                            }}
                            className="px-4 py-2 bg-white/5 hover:bg-shop/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95"
                        >
                            + {task.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                {agencyLines.map(l => (
                    <div key={l.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 relative">
                        <input value={l.name} onChange={e => updateAgencyLine(l.id, 'name', e.target.value)} placeholder="Désignation..." className="w-full sm:flex-1 bg-transparent border-none outline-none text-sm font-bold text-white mb-2 sm:mb-0" />
                        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
                            <div className="flex items-center space-x-2 bg-black/20 rounded-xl px-2 py-1.5">
                                <input type="number" inputMode="numeric" value={l.quantity} onChange={e => updateAgencyLine(l.id, 'quantity', parseInt(e.target.value))} className="w-10 bg-transparent text-center text-sm font-black text-white outline-none" />
                                <span className="text-[9px] font-black opacity-30">QTÉ</span>
                            </div>
                            <div className="flex items-center space-x-2 bg-black/20 rounded-xl px-3 py-1.5 flex-1 sm:flex-none">
                                <input type="number" inputMode="decimal" value={l.price || ''} onChange={e => updateAgencyLine(l.id, 'price', parseFloat(e.target.value))} className="w-full sm:w-24 bg-transparent text-right text-sm font-black text-white outline-none" />
                                <span className="text-[9px] font-black opacity-30">CFA</span>
                            </div>
                            <button onClick={() => setAgencyLines(agencyLines.filter(x => x.id !== l.id))} className="p-2 text-muted-foreground hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
                <button onClick={addAgencyLine} className="w-full sm:w-auto py-3 px-6 rounded-2xl border border-dashed border-shop/30 text-[11px] font-black uppercase text-shop flex items-center justify-center hover:bg-shop/5 transition-all"><PlusCircle className="w-4 h-4 mr-2" /> Ajouter une ligne</button>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-2">Lier à un Projet</label>
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

            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-6 border-t border-white/5">
                <div className="w-full sm:w-auto">
                    <p className="text-[11px] font-black uppercase text-muted-foreground mb-2 ml-2">Acompte reçu</p>
                    <input type="number" inputMode="decimal" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-xl py-3.5 px-5 text-sm font-black text-white outline-none focus:border-shop/50" />
                </div>
                <div className="text-right w-full sm:w-auto">
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Total TTC</p>
                    <h2 className="text-3xl sm:text-5xl font-black text-shop truncate">{totalAmount.toLocaleString()} <span className="text-lg">CFA</span></h2>
                </div>
            </div>
            
            <button disabled={totalAmount <= 0 || !customerName || isCheckingOut} onClick={handleCheckout} className="w-full py-5 bg-white text-black rounded-[24px] sm:rounded-[28px] font-black text-lg uppercase tracking-[0.2em] shadow-2xl hover:bg-shop hover:text-white transition-all flex items-center justify-center space-x-3 active:scale-95">
                {isCheckingOut ? <RefreshCw className="animate-spin" /> : <><Check /> <span>Confirmer & Enregistrer</span></>}
            </button>
        </div>
    );
}
