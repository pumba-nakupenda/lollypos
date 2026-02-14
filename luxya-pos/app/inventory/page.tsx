
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, Search, LayoutDashboard, TrendingUp, AlertTriangle } from 'lucide-react'
import CreateProductButton from '@/components/CreateProductButton'
import ShopSelector from '@/components/ShopSelector'
import { shops, Shop } from '@/types/shop'
import InventoryList from '@/components/InventoryList'
import { API_URL } from '@/utils/api'

export default async function InventoryPage(props: { searchParams: Promise<{ shopId?: string, page?: string, q?: string, category?: string, status?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const currentPage = parseInt(searchParams.page || '1');
  const searchQuery = searchParams.q || '';
  const categoryFilter = searchParams.category || 'Toutes';
  const statusFilter = searchParams.status || 'all';
  const pageSize = 50;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ... (keep profile fetch)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, shop_id, has_stock_access, is_super_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[InventoryPage] Profile error:', profileError);
  }

  // Permissions check: STRICT ERP ACCESS
  const isERPUser = profile?.role === 'admin' || profile?.role === 'manager';
  const hasSpecificAccess = profile?.has_stock_access === true;

  if (!profile || (!isERPUser && !hasSpecificAccess)) {
    redirect('/sales?error=unauthorized_erp')
  }

  // SHOP RESTRICTION
  const effectiveShopId = profile.shop_id ? profile.shop_id.toString() : (searchParams.shopId || '1');
  
  const activeShop = shops.find(s => s.id === +effectiveShopId) || shops[0];
  const shopName = activeShop.name;

  let products = []
  let totalCount = 0;
  let allProductsForStats: any[] = [];

  try {
    // Build query for current page
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('shop_id', +effectiveShopId);
    
    if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
    }

    if (categoryFilter !== 'Toutes') {
        query = query.eq('category', categoryFilter);
    }

    if (statusFilter !== 'all') {
        if (statusFilter === 'out_of_stock') {
            query = query.lte('stock', 0);
        } else if (statusFilter === 'low_stock') {
            query = query.gt('stock', 0).lte('stock', 2); // Assuming 2 is default min_stock
        } else if (statusFilter === 'in_stock') {
            query = query.gt('stock', 2);
        }
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(from, to);
    
    if (error) throw error;
    products = data || [];
    totalCount = count || 0;

    // Fetch light data for ALL products to calculate global stats
    const { data: statsData } = await supabase
      .from('products')
      .select('price, cost_price, stock, category, brand')
      .eq('shop_id', +effectiveShopId);
    
    allProductsForStats = statsData || [];
  } catch (e) {
    console.error('Failed to fetch products', e)
  }

  const allCategories = Array.from(new Set(allProductsForStats.map(p => p.category || 'Général'))).sort();
  const allBrands = Array.from(new Set(allProductsForStats.map(p => p.brand).filter(Boolean))).sort() as string[];

  const totalPages = Math.ceil(totalCount / pageSize);

  const totalValue = allProductsForStats.reduce((acc: number, p: any) => acc + (p.price * p.stock), 0);
  const totalCost = allProductsForStats.reduce((acc: number, p: any) => acc + (Number(p.cost_price || 0) * p.stock), 0);
  const marginPercent = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;
  const outOfStock = allProductsForStats.filter((p: any) => p.stock <= 0).length;

  // Preserve filters in pagination links
  const getPaginationLink = (page: number) => {
    const params = new URLSearchParams();
    params.set('shopId', effectiveShopId);
    params.set('page', page.toString());
    if (searchQuery) params.set('q', searchQuery);
    if (categoryFilter !== 'Toutes') params.set('category', categoryFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    return `/inventory?${params.toString()}`;
  };

  return (
    <div className="min-h-screen pb-20">
      {/* ... header reste inchangé ... */}
      <header className="glass-panel sticky top-2 sm:top-4 z-50 mx-2 sm:mx-4 rounded-2xl sm:rounded-[24px] shadow-xl border-white/5">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-4 sm:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <Link href="/" className="p-2 sm:p-2.5 glass-card rounded-xl text-muted-foreground hover:text-shop transition-all">
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div className="h-6 sm:h-8 w-px bg-white/10" />
            <div>
              <h1 className="text-base sm:text-xl font-black shop-gradient-text uppercase tracking-tighter leading-none">
                Inventaire
              </h1>
              <p className="text-[7px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{shopName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link 
              href="/inventory/quick"
              className="hidden sm:flex items-center px-4 py-2 bg-white/5 text-shop border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-shop/10 transition-all"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Inventaire Rapide
            </Link>
            <div className="hidden md:block">
               <ShopSelector />
            </div>
            <CreateProductButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Produits</p>
              <h2 className="text-xl sm:text-2xl font-black">{totalCount}</h2>
            </div>
            <Package className="w-8 h-8 text-white/5 absolute right-4 group-hover:scale-110 group-hover:text-shop/20 transition-all duration-500" />
          </div>

          {profile?.is_super_admin && (
            <>
              <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative">
                <div className="relative z-10">
                  <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Investissement (Achat)</p>
                  <h2 className="text-xl sm:text-2xl font-black text-blue-400 tracking-tight">{totalCost.toLocaleString()} <span className="text-[10px]">CFA</span></h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center absolute right-4 group-hover:bg-blue-500/20 transition-all">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Valeur Stock (Vente)</p>
                    <span className="bg-green-500/20 text-green-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-green-500/20">+{marginPercent.toFixed(1)}% MARGE</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-shop-secondary tracking-tight">{totalValue.toLocaleString()} <span className="text-[10px]">CFA</span></h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-shop-secondary/10 flex items-center justify-center absolute right-4 group-hover:bg-shop-secondary/20 transition-all">
                    <TrendingUp className="w-4 h-4 text-shop-secondary" />
                </div>
              </div>
            </>
          )}

          <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative border-red-500/10">
            <div className="relative z-10">
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Alertes Stock</p>
              <h2 className={`text-xl sm:text-2xl font-black ${outOfStock > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {outOfStock} Ruptures
              </h2>
            </div>
            <AlertTriangle className={`w-8 h-8 absolute right-4 group-hover:scale-110 transition-all duration-500 ${outOfStock > 0 ? 'text-red-500/20' : 'text-green-500/5'}`} />
          </div>
        </div>

        {/* Product List Container */}
        <InventoryList products={products} allCategories={allCategories} allBrands={allBrands} />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 pt-8">
            {currentPage > 1 && (
              <Link 
                href={getPaginationLink(currentPage - 1)}
                className="px-6 py-3 glass-card rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Précédent
              </Link>
            )}
            <div className="glass-card px-6 py-3 rounded-xl border border-white/10">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Page {currentPage} sur {totalPages}
              </span>
            </div>
            {currentPage < totalPages && (
              <Link 
                href={getPaginationLink(currentPage + 1)}
                className="px-6 py-3 bg-shop text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-shop/20"
              >
                Suivant
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
