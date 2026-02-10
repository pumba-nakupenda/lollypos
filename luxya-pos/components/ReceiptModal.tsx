
'use client'

import React, { useRef } from 'react'
import { X, Printer, CheckCircle2, Download, Share2 } from 'lucide-react'

// Import html2pdf dynamically
const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;

interface InvoiceModalProps {
    isOpen: boolean
    onClose: () => void
    saleData: any 
    shop: any
}

export default function InvoiceModal({ isOpen, onClose, saleData, shop }: InvoiceModalProps) {
    const invoiceRef = useRef<HTMLDivElement>(null)

    if (!isOpen || !saleData) return null

    const handlePrint = () => {
        const printContent = invoiceRef.current;
        if (!printContent) return;
        const printWindow = window.open('', '', 'width=900,height=1000');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${docTitle} ${saleData.invoice_number}</title>
                        <style>
                            @page { size: A4; margin: 0; }
                            body { margin: 0; padding: 0; background: white; }
                            ${getStyles()}
                        </style>
                    </head>
                    <body>${printContent.innerHTML}</body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        }
    }

    const handleDownloadPDF = () => {
        if (!html2pdf || !invoiceRef.current) return;
        const element = invoiceRef.current;
        const opt = {
            margin: 0,
            filename: `${docTitle}-${saleData.invoice_number}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff', letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    }

    const handleSharePDF = async () => {
        if (!html2pdf || !invoiceRef.current) return;
        const element = invoiceRef.current;
        const filename = `${docTitle}-${saleData.invoice_number}.pdf`;
        const opt = {
            margin: 0,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            const blob = await html2pdf().from(element).set(opt).outputPdf('blob');
            const file = new File([blob], filename, { type: 'application/pdf' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: filename });
            } else {
                const message = `*LOLLY*\nVoici votre ${docTitle.toLowerCase()} n° ${saleData.invoice_number}`;
                window.open(`https://wa.me/221772354747?text=${encodeURIComponent(message)}`, '_blank');
            }
        } catch (err) { console.error('Share failed:', err); }
    }

    const totalTTC = Number(saleData.total_amount || saleData.totalAmount || 0);
    const withTva = saleData.with_tva !== false; 
    const ht = withTva ? (totalTTC / 1.18) : totalTTC;
    const tva = totalTTC - ht;
    const paid = Number(saleData.paid_amount || 0);
    const rest = totalTTC - paid;

    const docLabels: Record<string, string> = {
        'invoice': 'Facture',
        'quote': 'Devis',
        'delivery_note': 'Bon de Livraison'
    };
    const docTitle = docLabels[saleData.type] || 'Facture';
    const accentColor = '#FDE700'; 

    const getStyles = () => `
        .invoice-box { 
            max-width: 800px; 
            margin: auto; 
            padding: 60px; 
            font-family: 'Inter', sans-serif; 
            color: #000; 
            background: white; 
            min-height: 1120px; 
            position: relative; 
            overflow: hidden;
        }
        .bg-curve {
            position: absolute;
            top: -150px;
            right: -150px;
            width: 500px;
            height: 500px;
            background: ${accentColor};
            border-radius: 50%;
            opacity: 0.1;
            z-index: 0;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            position: relative;
            z-index: 1;
            margin-bottom: 80px;
        }
        .brand-name { 
            font-family: var(--font-museo), 'MuseoModerno', sans-serif;
            font-size: 48px; 
            font-weight: 900; 
            font-style: italic;
            letter-spacing: -2px; 
            margin: 0; 
            text-transform: uppercase;
            color: #000;
            line-height: 1;
        }
        .brand-sub {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #888;
            margin-top: 10px;
        }
        .doc-badge {
            background: ${accentColor};
            color: #000;
            padding: 8px 25px;
            border-radius: 100px;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 12px;
            margin-top: 15px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .card {
            background: #fcfcfc;
            padding: 35px;
            border-radius: 45px;
            border: 1px solid #f0f0f0;
        }
        .label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #bbb;
            margin-bottom: 10px;
        }
        .value-lg { font-size: 22px; font-weight: 800; color: #000; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0 10px; margin-bottom: 40px; }
        th { text-align: left; padding: 15px 25px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #aaa; }
        .item-row td {
            background: #fff;
            padding: 20px 25px;
            border-top: 1px solid #f8f8f8;
            border-bottom: 1px solid #f8f8f8;
        }
        .item-row td:first-child { border-left: 1px solid #f8f8f8; border-radius: 30px 0 0 30px; font-weight: 700; }
        .item-row td:last-child { border-right: 1px solid #f8f8f8; border-radius: 0 30px 30px 0; text-align: right; font-weight: 900; }
        
        .summary-card {
            background: transparent;
            color: #000;
            padding: 40px;
            border-radius: 50px;
            width: 320px;
            margin-left: auto;
            border: 2px solid #000;
        }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; font-weight: 600; }
        .summary-total {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-top: 25px;
            padding-top: 25px;
            border-top: 2px solid #000;
        }
        .total-amount { font-size: 32px; font-weight: 950; color: #000; }

        .footer-sig {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .sig-circle {
            width: 140px;
            height: 140px;
            border: 2px dashed #eee;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #eee;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            padding: 20px;
        }
    `;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-700" onClick={onClose} />
            <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-500">
                
                <div className="flex justify-between items-center mb-8 px-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-[#fde700] rounded-[22px] flex items-center justify-center shadow-2xl rotate-3">
                            <CheckCircle2 className="w-7 h-7 text-black" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Document Prêt</h2>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Édition Signature LOLLY</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 relative z-[210]">
                        <button onClick={handleSharePDF} className="flex items-center px-8 py-4 bg-green-500 text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl pointer-events-auto"><Share2 className="w-4 h-4 mr-2" /> Partager</button>
                        <button onClick={handleDownloadPDF} className="flex items-center px-8 py-4 bg-white/10 text-white backdrop-blur-xl rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all pointer-events-auto"><Download className="w-4 h-4 mr-2 text-[#fde700]" /> PDF</button>
                        <button onClick={onClose} className="p-4 bg-white/5 text-white rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all pointer-events-auto"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                <style>{getStyles()}</style>

                <div className="flex-1 overflow-y-auto rounded-[60px] shadow-2xl bg-white custom-scrollbar border-[12px] border-white/5">
                    <div className="invoice-box" id="invoice-content" ref={invoiceRef}>
                        <div className="bg-curve"></div>
                        
                        {/* Header Section */}
                        <div className="header">
                            <div>
                                <h1 className="brand-name">LOLLY</h1>
                                <div className="brand-sub">Creative Agency</div>
                                <div className="doc-badge">{docTitle}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="label">Référence</div>
                                <div style={{ fontSize: '24px', fontWeight: '900' }}>{saleData.invoice_number}</div>
                                <div className="label" style={{ marginTop: '20px' }}>Émis le</div>
                                <div style={{ fontSize: '14px', fontWeight: '700' }}>{new Date(saleData.created_at || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                            </div>
                        </div>

                        {/* Contact Table Section for perfect alignment */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px', border: 'none' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '50%', padding: '0', verticalAlign: 'top' }}>
                                        <span className="label">De la part de</span>
                                    </td>
                                    <td style={{ width: '50%', padding: '0', verticalAlign: 'top', textAlign: 'right' }}>
                                        <span className="label">Destiné à</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 0 0 0', verticalAlign: 'top' }}>
                                        <strong style={{ fontSize: '18px', display: 'block', marginBottom: '5px' }}>LOLLY GROUP SENEGAL</strong>
                                        <div style={{ color: '#666', lineHeight: '1.5', fontSize: '13px' }}>
                                            Fass delorme 13x22<br/>
                                            +221 77 235 47 47<br/>
                                            contact@lolly.sn
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px 0 0 0', verticalAlign: 'top', textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '5px', textTransform: 'uppercase' }}>{saleData.customer_name || 'Client de Passage'}</div>
                                        <div style={{ color: '#666', lineHeight: '1.5', fontSize: '13px' }}>
                                            {saleData.linked_doc_number && <div style={{ fontWeight: 700, color: '#000' }}>RÉF: {saleData.linked_doc_number}</div>}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Items Table */}
                        <table>
                            <thead>
                                <tr>
                                    <th>Désignation</th>
                                    <th style={{ textAlign: 'center' }}>Qté</th>
                                    <th style={{ textAlign: 'right' }}>P.U</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(saleData.items || []).map((item: any, idx: number) => (
                                    <tr key={idx} className="item-row">
                                        <td>{item.name || `Service ${idx+1}`}</td>
                                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ textAlign: 'right' }}>{Number(item.price).toLocaleString()}</td>
                                        <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Total Summary */}
                        <div className="total-section">
                            <div className="summary-card">
                                <div className="summary-row"><span>Sous-total HT</span><span>{ht.toLocaleString()}</span></div>
                                {withTva && <div className="summary-row"><span>TVA (18%)</span><span>{tva.toLocaleString()}</span></div>}
                                {paid > 0 && <div className="summary-row" style={{ color: accentColor, opacity: 1 }}><span>Déjà payé</span><span>-{paid.toLocaleString()}</span></div>}
                                
                                <div className="summary-total">
                                    <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>NET À PAYER</span>
                                    <span className="total-amount">{rest > 0 ? rest.toLocaleString() : '0'} <span style={{ fontSize: '12px' }}>CFA</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Signature */}
                        <div className="footer-sig">
                            <div className="sig-circle">
                                Cachet & Signature<br/>Autorisée
                            </div>
                            <div style={{ textAlign: 'right', maxWidth: '300px' }}>
                                <div className="label">Note</div>
                                <p style={{ fontSize: '11px', color: '#888', lineHeight: '1.6' }}>
                                    Ce document est émis par le système central du groupe LOLLY. Merci pour votre fidélité.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
