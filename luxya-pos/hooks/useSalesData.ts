import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useToast } from '@/context/ToastContext';
import { useShop } from '@/context/ShopContext';
import { API_URL } from '@/utils/api';

export function useSalesData() {
    const supabase = createClient();
    const { showToast } = useToast();
    const { activeShop } = useShop();

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>(['Toutes']);
    const [brands, setBrands] = useState<string[]>(['Toutes']);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [agencyHistory, setAgencyHistory] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAgency, setIsAgency] = useState(false);

    const fetchProducts = useCallback(async () => {
        if (!activeShop) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('shop_id', activeShop.id)
                .order('name', { ascending: true });

            if (error) throw error;
            if (data) {
                setProducts(data);
                const visibleProducts = data.filter((p: any) => p.show_on_pos !== false);
                const cats = new Set(visibleProducts.map((p: any) => p.category).filter(Boolean));
                setCategories(['Toutes', ...Array.from(cats) as string[]]);
                const bnds = new Set(visibleProducts.map((p: any) => p.brand).filter(Boolean));
                setBrands(['Toutes', ...Array.from(bnds).sort() as string[]]);
            }
        } catch (e) {
            showToast("Erreur de chargement des produits", "error");
        } finally {
            setLoading(false);
        }
    }, [activeShop, supabase, showToast]);

    const fetchHistory = useCallback(async () => {
        if (!activeShop) return;
        try {
            const { data, error } = await supabase
                .from('sales')
                .select('*, profiles:created_by (email)')
                .eq('shop_id', activeShop.id)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            if (data) setAgencyHistory(data);
        } catch (e) {
            console.error("Failed to fetch sales history:", e);
        }
    }, [activeShop, supabase]);

    const fetchCustomers = useCallback(async () => {
        if (!activeShop) return;
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('shop_id', activeShop.id);
            if (error) throw error;
            if (data) setAllCustomers(data);
        } catch (e) { 
            console.error("Failed to fetch customers:", e)
        }
    }, [activeShop, supabase]);

    const fetchProjects = useCallback(async () => {
        if (!activeShop) return;
        try {
            const { data, error } = await supabase.from('agency_projects').select('id, name').eq('shop_id', activeShop?.id).order('name');
            if (error) throw error;
            setProjects(data || []);
        } catch (e) {
            console.error("Error fetching projects:", e);
        }
    }, [activeShop, supabase]);

    useEffect(() => {
        if (activeShop) {
            setIsAgency(activeShop.id === 3);
            fetchProducts();
            fetchHistory();
            fetchCustomers();
            fetchProjects();
        }
    }, [activeShop, fetchProducts, fetchHistory, fetchCustomers, fetchProjects]);

    return {
        products,
        categories,
        brands,
        allCustomers,
        agencyHistory,
        projects,
        loading,
        isAgency,
        fetchProducts,
        fetchHistory,
        fetchCustomers,
        fetchProjects,
    };
}
