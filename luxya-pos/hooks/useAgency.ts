import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { API_URL, safeFetch } from '@/utils/api';

export function useAgency(products: any[]) {
    const { showToast } = useToast();

    const [agencyLines, setAgencyLines] = useState<any[]>([]);
    const [docType, setDocType] = useState<'quote' | 'invoice' | 'delivery_note'>('quote');
    const [productSearch, setProductSearch] = useState('');
    const [editingDocId, setEditingDocId] = useState<number | null>(null);
    const [linkedDocNumber, setLinkedDocNumber] = useState<string | null>(null);
    const [linkedDocId, setLinkedDocId] = useState<any>(null);

    const addAgencyLine = () => {
        setAgencyLines([...agencyLines, { id: Date.now(), name: '', quantity: 1, price: 0 }]);
    };

    const updateAgencyLine = (id: number, field: string, value: any) => {
        setAgencyLines(agencyLines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const addProductToAgency = (p: any) => {
        if (p.stock <= 0 && p.type !== 'service') {
            showToast(`${p.name} est épuisé !`, "warning");
            return;
        }
        setAgencyLines([...agencyLines, { id: Date.now(), name: p.name, quantity: 1, price: p.price, product_id: p.id }]);
    };

    const handleTransformDocument = async (sale: any, targetType: 'invoice' | 'delivery_note') => {
        try {
            const items = await safeFetch(`${API_URL}/sales/${sale.id}/items`);
            if (items) {
                setDocType(targetType);
                setLinkedDocNumber(sale.invoice_number);
                setLinkedDocId(sale.id);
                setAgencyLines(items.map((i: any) => ({
                    id: Date.now() + Math.random(),
                    name: i.products?.name || i.description || 'Article inconnu',
                    quantity: i.quantity,
                    price: i.price,
                    product_id: i.product_id
                })));
                setEditingDocId(null);
                showToast(`Prêt pour conversion en ${targetType === 'invoice' ? 'Facture' : 'Bon de Livraison'}`, "success");
                return true; // Signal to switch tab
            }
        } catch (e) {
            showToast("Erreur lors de la préparation de la conversion", "error");
        }
        return false;
    };
    
    const resetAgency = () => {
        setAgencyLines([]);
        setLinkedDocId(null);
        setLinkedDocNumber(null);
    }

    return {
        agencyLines,
        setAgencyLines,
        docType,
        setDocType,
        productSearch,
        setProductSearch,
        editingDocId,
        setEditingDocId,
        linkedDocNumber,
        setLinkedDocNumber,
        linkedDocId,
        setLinkedDocId,
        addAgencyLine,
        updateAgencyLine,
        addProductToAgency,
        handleTransformDocument,
        resetAgency,
    };
}
