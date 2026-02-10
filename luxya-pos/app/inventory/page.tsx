
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, Search, LayoutDashboard, TrendingUp, AlertTriangle } from 'lucide-react'
import CreateProductButton from '@/components/CreateProductButton'
import ShopSelector from '@/components/ShopSelector'
import { shops, Shop } from '@/types/shop'
import InventoryList from '@/components/InventoryList'
import { API_URL } from '@/utils/api'

export default async function InventoryPage(props: { searchParams: Promise<{ shopId?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Role-based access control and shop restriction
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, shop_id, has_stock_access')
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

  // SHOP RESTRICTION: If user has a shop_id, they MUST use it. Otherwise, use URL or default '1'
  const effectiveShopId = profile.shop_id ? profile.shop_id.toString() : (searchParams.shopId || '1');
  
  const activeShop = shops.find(s => s.id === +effectiveShopId) || shops[0];
  const shopName = activeShop.name;

  let products = []
  try {
    const res = await fetch(`${API_URL}/products?shopId=${effectiveShopId}`, { cache: 'no-store' })
    if (res.ok) {
      products = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch products', e)
  }

  const outOfStock = products.filter((p: any) => p.stock <= 0).length;
  const totalValue = products.reduce((acc: number, p: any) => acc + (p.price * p.stock), 0);

  return (
    <div className="min-h-screen pb-20">
      {/* Refined Header - Increased z-index to avoid modal trapping issues */}
      <header className="glass-panel sticky top-2 sm:top-4 z-[70] mx-2 sm:mx-4 rounded-2xl sm:rounded-[24px] shadow-xl border-white/5">
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
            <div className="hidden md:block">
               <ShopSelector />
            </div>
            <CreateProductButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Produits</p>
              <h2 className="text-2xl sm:text-3xl font-black">{products.length}</h2>
            </div>
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-white/5 absolute right-4 group-hover:scale-110 group-hover:text-shop/20 transition-all duration-500" />
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Valeur Stock</p>
              <h2 className="text-2xl sm:text-3xl font-black text-shop-secondary tracking-tight">{totalValue.toLocaleString()} <span className="text-xs">FCFA</span></h2>
            </div>
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-white/5 absolute right-4 group-hover:scale-110 group-hover:text-shop-secondary/20 transition-all duration-500" />
          </div>

          <div className="glass-card p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] flex items-center justify-between group overflow-hidden relative border-red-500/10 sm:col-span-2 md:col-span-1">
            <div className="relative z-10">
              <p className="text-[10px] sm:text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Alertes Stock</p>
              <h2 className={`text-2xl sm:text-3xl font-black ${outOfStock > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {outOfStock} Ruptures
              </h2>
            </div>
            <AlertTriangle className={`w-10 h-10 sm:w-12 sm:h-12 absolute right-4 group-hover:scale-110 transition-all duration-500 ${outOfStock > 0 ? 'text-red-500/20' : 'text-green-500/5'}`} />
          </div>
        </div>

        {/* Product List Container */}
        <InventoryList products={products} />
      </main>
    </div>
  )
}
