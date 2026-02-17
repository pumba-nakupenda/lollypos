'use client'

import React, { useState, useRef } from 'react'
import { X, FileUp, Download, CheckCircle2, AlertTriangle, Loader2, Table } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useToast } from '@/context/ToastContext'
import Portal from './Portal'
import { bulkCreateProducts } from '@/app/inventory/actions'

interface ExcelImportModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
    const { showToast } = useToast()
    const [file, setFile] = useState<File | null>(null)
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            setFile(selectedFile)
            parseFile(selectedFile)
        }
    }

    const parseFile = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const bstr = e.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const json = XLSX.utils.sheet_to_json(ws)
            setData(json)
            setStep('preview')
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        if (data.length === 0) return

        setLoading(true)
        try {
            // Mapping des colonnes (Gestion des noms de colonnes courants)
            const mappedProducts = data.map(item => {
                const parsedVariants = (item.Variantes || item.variants || '').split(';').filter(Boolean).map((vStr: string) => {
                    const [color, size, stock, variantImage] = vStr.split(':').map(s => s.trim());
                    return {
                        id: Date.now() + Math.floor(Math.random() * 1000),
                        color: color || '',
                        size: size || '',
                        stock: stock || '',
                        image: variantImage || ''
                    };
                })

                const totalVariantStock = parsedVariants.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0)
                const globalStock = parsedVariants.length > 0 ? totalVariantStock : Number(item.Stock || item.stock || 0)

                return {
                    name: item.Nom || item.name || item.Name,
                    description: item.Description || item.description || '',
                    price: Number(item.Prix || item.price || item.Price || 0),
                    promo_price: Number(item['Prix Promo'] || item.promo_price || item.promo || 0) || null,
                    cost_price: Number(item['Prix d\'achat'] || item.cost_price || item.Cost || 0),
                    stock: globalStock,
                    category: item.Catégorie || item.category || 'Général',
                    brand: item.Marque || item.brand || '',
                    min_stock: Number(item['Stock Min'] || item.min_stock || 2),
                    expiry_date: item['Date d\'expiration'] || item.expiry_date || null,
                    image: item.Image || item.Photo || item.image || item.imageUrl || '',
                    variants: parsedVariants
                }
            })

            // Validation minimale
            const finalProducts = mappedProducts.filter(p => p.name)

            if (finalProducts.length === 0) {
                showToast("Aucun produit valide trouvé", "error")
                setLoading(false)
                return
            }

            const res = await bulkCreateProducts(finalProducts)
            if (res.success) {
                showToast(res.message || `${finalProducts.length} produits importés avec succès`, "success")
                onSuccess()
                onClose()
            } else {
                showToast(res.error || "Erreur lors de l'importation", "error")
            }
        } catch (err) {
            showToast("Erreur lors du traitement du fichier", "error")
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = () => {
        const template = [
            {
                Nom: 'Produit Exemple',
                Description: 'Une brève description',
                Prix: 1500,
                "Prix Promo": 1200,
                "Prix d'achat": 1000,
                Stock: 10,
                Catégorie: 'Général',
                Marque: 'Ma Marque',
                "Stock Min": 2,
                "Date d'expiration": '2025-12-31',
                Image: 'https://example.com/photo.jpg',
                Variantes: 'Rouge:XL:5:https://example.com/red.jpg;Bleu:L:5:https://example.com/blue.jpg'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Template')
        XLSX.writeFile(wb, 'Lolly_Template_Inventaire.xlsx')
    }

    return (
        <Portal>
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
                <div className="relative glass-card w-full max-w-4xl p-8 rounded-[40px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-12 h-12 bg-shop/20 rounded-2xl flex items-center justify-center">
                            <Table className="w-6 h-6 text-shop" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-white">Importation Excel</h2>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mise à jour massive de l'inventaire</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        {step === 'upload' ? (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[32px] p-12 space-y-6 hover:border-shop/50 transition-all group">
                                <div className="p-6 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                                    <FileUp className="w-12 h-12 text-shop" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-white mb-2 uppercase">Glissez votre fichier ici</p>
                                    <p className="text-xs text-muted-foreground">Formats acceptés : .xlsx, .xls, .csv</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-3 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                    >
                                        Parcourir les fichiers
                                    </button>
                                    <button
                                        onClick={downloadTemplate}
                                        className="px-6 py-3 bg-white/5 text-muted-foreground border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center"
                                    >
                                        <Download className="w-3.5 h-3.5 mr-2" />
                                        Modèle Excel
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Aperçu : {data.length} lignes détectées</p>
                                    <button
                                        onClick={() => setStep('upload')}
                                        className="text-[10px] font-black text-shop uppercase tracking-widest hover:underline"
                                    >
                                        Changer de fichier
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar border border-white/5 rounded-2xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-black/50 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                                            <tr>
                                                <th className="p-4">Nom</th>
                                                <th className="p-4">Prix</th>
                                                <th className="p-4">Stock</th>
                                                <th className="p-4">Catégorie</th>
                                                <th className="p-4">Variantes</th>
                                                <th className="p-4">Image</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {data.slice(0, 50).map((row, i) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 font-bold text-white/80">{row.Nom || row.name || '---'}</td>
                                                    <td className="p-4 text-shop font-bold">{row.Prix || row.price || 0} CFA</td>
                                                    <td className="p-4">{row.Stock || row.stock || 0}</td>
                                                    <td className="p-4">
                                                        <span className="bg-white/5 px-2 py-1 rounded-md border border-white/10 text-[9px] font-bold">
                                                            {row.Catégorie || row.category || 'Général'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-[9px] text-muted-foreground whitespace-nowrap">
                                                        {row.Variantes || row.variants || '---'}
                                                    </td>
                                                    <td className="p-4 text-[9px] truncate max-w-[100px] text-muted-foreground whitespace-nowrap">
                                                        {row.Image || row.Photo || row.image || '---'}
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.length > 50 && (
                                                <tr>
                                                    <td colSpan={4} className="p-4 text-center text-muted-foreground font-bold text-[10px] uppercase">
                                                        ... et {data.length - 50} autres lignes
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start space-x-3 max-w-lg">
                                        <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-blue-200/70 font-medium leading-relaxed uppercase">
                                            Assurez-vous que les prix et les stocks sont corrects. L'importation peut prendre quelques secondes pour générer les index de recherche.
                                        </p>
                                    </div>
                                    <button
                                        disabled={loading}
                                        onClick={handleImport}
                                        className="px-8 py-4 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-shop/20 flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Importation...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Confirmer l'import
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    )
}
