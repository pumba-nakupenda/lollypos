
'use client'

import React, { useRef } from 'react'
import { X, Printer, CheckCircle2, Download, Share2, Loader2 } from 'lucide-react'
import { pdf, PDFViewer } from '@react-pdf/renderer'
import { PDFDocument } from './PDFDocument'

interface InvoiceModalProps {
    isOpen: boolean
    onClose: () => void
    saleData: any 
    shop: any
}

export default function InvoiceModal({ isOpen, onClose, saleData, shop }: InvoiceModalProps) {
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isClient, setIsClient] = React.useState(false)

    React.useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isOpen || !saleData) return null

    const docLabels: Record<string, string> = {
        'invoice': 'Facture',
        'quote': 'Devis',
        'delivery_note': 'Bon de Livraison'
    };
    const docTitle = docLabels[saleData.type] || 'Facture';

    const handleDownloadPDF = async () => {
        try {
            setIsGenerating(true);
            const doc = <PDFDocument saleData={saleData} docTitle={docTitle} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${docTitle}-${saleData.invoice_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('PDF generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    }

    const handleSharePDF = async () => {
        try {
            setIsGenerating(true);
            const doc = <PDFDocument saleData={saleData} docTitle={docTitle} />;
            const blob = await pdf(doc).toBlob();
            const filename = `${docTitle}-${saleData.invoice_number}.pdf`;
            const file = new File([blob], filename, { type: 'application/pdf' });
            
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: filename });
            } else {
                const message = `*LOLLY*\nVoici votre ${docTitle.toLowerCase()} n° ${saleData.invoice_number}`;
                window.open(`https://wa.me/221772354747?text=${encodeURIComponent(message)}`, '_blank');
            }
        } catch (err) { 
            console.error('Share failed:', err); 
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-700" onClick={onClose} />
            <div className="relative w-full max-w-6xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-500">
                
                <div className="flex justify-between items-center mb-6 px-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#fde700] rounded-2xl flex items-center justify-center shadow-2xl">
                            <CheckCircle2 className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Aperçu du Document</h2>
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Génération Directe PDF</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={handleSharePDF} 
                            disabled={isGenerating}
                            className="hidden sm:flex items-center px-6 py-3 bg-green-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Share2 className="w-3.5 h-3.5 mr-2" />} 
                            Partager
                        </button>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isGenerating}
                            className="flex items-center px-6 py-3 bg-white/10 text-white backdrop-blur-xl rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Download className="w-3.5 h-3.5 mr-2 text-[#fde700]" />} 
                            Télécharger
                        </button>
                        <button onClick={onClose} className="p-3 bg-white/5 text-white rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all"><X className="w-5 h-5" /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden rounded-[32px] shadow-2xl bg-[#1a1a1a] border border-white/10 relative">
                    {isClient ? (
                        <PDFViewer width="100%" height="100%" style={{ border: 'none' }} showToolbar={false}>
                            <PDFDocument saleData={saleData} docTitle={docTitle} />
                        </PDFViewer>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                            <Loader2 className="w-12 h-12 animate-spin mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Préparation du document...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
