import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart, Laptop, Sparkles, Search, SlidersHorizontal, X, ChevronRight, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Initializer from "@/components/Initializer";
import Image from "next/image";
import { Suspense } from "react";
import { supabase } from "@/utils/supabase";
import { API_URL } from "@/utils/api";

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.error("Backend connection failed:", e);
    return [];
  }
}

async function getSiteSettings() {
    try {
        const { data } = await supabase
            .from('site_settings')
            .select('content')
            .eq('name', 'lolly_shop_config')
            .single();
        return data?.content || null;
    } catch (e) {
        console.error("Failed to fetch settings:", e);
        return null;
    }
}

export default async function Home(props: { 
    searchParams: Promise<{ 
        q?: string, 
        cat?: string, 
        shop?: string,
        price?: string,
        sort?: string,
        stock?: string
    }> 
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q?.toLowerCase() || "";
  const catFilter = searchParams.cat || "all";
  const shopFilter = searchParams.shop || "all";
  const priceFilter = searchParams.price || "all";
  const sort = searchParams.sort || "newest";
  const onlyInStock = searchParams.stock === "true";

  const [allProducts, siteSettings] = await Promise.all([
      getProducts(),
      getSiteSettings()
  ]);

  const shopProducts = allProducts.filter((p: any) => (p.shop_id === 1 || p.shop_id === 2) && p.show_on_website !== false);
  
  // Filtering Logic
  let filteredProducts = shopProducts.filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(query) || (p.category || "").toLowerCase().includes(query);
      const matchesCat = catFilter === "all" || p.category === catFilter;
      const matchesShop = shopFilter === "all" || p.shop_id.toString() === shopFilter;
      const matchesStock = !onlyInStock || p.stock > 0;
      
      let matchesPrice = true;
      if (priceFilter === "low") matchesPrice = p.price < 10000;
      else if (priceFilter === "mid") matchesPrice = p.price >= 10000 && p.price <= 50000;
      else if (priceFilter === "high") matchesPrice = p.price > 50000;

      return matchesSearch && matchesCat && matchesShop && matchesPrice && matchesStock;
  });

  const productsForCategories = shopFilter === "all" ? shopProducts : shopProducts.filter((p: any) => p.shop_id.toString() === shopFilter);
  const categories = Array.from(new Set(productsForCategories.map((p: any) => p.category).filter(Boolean))) as string[];
  const isFiltering = query || catFilter !== "all" || shopFilter !== "all" || priceFilter !== "all" || onlyInStock;

  return (
    <div className="min-h-screen bg-[#eaeded] text-black font-sans selection:bg-lolly selection:text-white">
      <Initializer products={shopProducts} />
      
      <Navbar settings={siteSettings} />

      {!isFiltering && (
          <div className="relative">
              <HeroCarousel slides={siteSettings?.slides || []} />
              
              {/* Entrance Cards Overlay */}
              <div className="max-w-[1500px] mx-auto px-4 lg:px-10 -mt-20 sm:-mt-40 relative z-40 pb-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <UniverseEntry 
                        title="Luxya" 
                        sub="Beauté & Luxe" 
                        id="1" 
                        img="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000" 
                        color="from-pink-500 to-purple-600"
                      />
                      <UniverseEntry 
                        title="Homtek" 
                        sub="Tech & Office" 
                        id="2" 
                        img="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000" 
                        color="from-blue-500 to-blue-800"
                      />
                      <PromoEntry 
                        title="Offres Flash" 
                        desc="Jusqu'à -50%" 
                        icon={<Zap className="w-10 h-10 text-[#FF9900]" />}
                      />
                      <PromoEntry 
                        title="Livraison" 
                        desc="Gratuite sur Dakar" 
                        icon={<ShoppingBag className="w-10 h-10 text-lolly" />}
                      />
                  </div>
              </div>
          </div>
      )}

      <main className="max-w-[1600px] mx-auto px-4 lg:px-10 py-6">
        
        {/* Amazon-Style Navigation Breadcrumbs */}
        <div className="mb-6 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Link href="/" className="hover:text-black">Accueil</Link>
            {shopFilter !== 'all' && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-black">{shopFilter === '1' ? 'Luxya' : 'Homtek'}</span>
                </>
            )}
            {catFilter !== 'all' && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-black font-black text-lolly">{catFilter}</span>
                </>
            )}
        </div>

        {!isFiltering ? (
            <div className="space-y-16">
                <UniverseSection 
                    title="Luxya" 
                    subtitle="Élégance & Soin" 
                    shopId="1"
                    products={shopProducts.filter((p: any) => p.shop_id === 1)}
                />
                <UniverseSection 
                    title="Homtek" 
                    subtitle="Performance Tech" 
                    shopId="2"
                    products={shopProducts.filter((p: any) => p.shop_id === 2)}
                />
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar Filters */}
                <aside className="lg:w-64 shrink-0 bg-white p-6 rounded-lg border border-gray-200 h-fit space-y-8 sticky top-28">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Catégories</h3>
                        <div className="space-y-2.5">
                            {categories.map(cat => (
                                <Link 
                                    key={cat} 
                                    href={`/?cat=${cat}${shopFilter !== 'all' ? `&shop=${shopFilter}` : ''}`}
                                    className={`block text-xs font-bold hover:text-lolly transition-colors ${catFilter === cat ? 'text-lolly' : 'text-gray-500'}`}
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Budget</h3>
                        <div className="space-y-2.5 text-xs font-bold">
                            <Link href="/?price=low" className="block text-gray-500 hover:text-lolly">Moins de 10.000 CFA</Link>
                            <Link href="/?price=mid" className="block text-gray-500 hover:text-lolly">10.000 - 50.000 CFA</Link>
                            <Link href="/?price=high" className="block text-gray-500 hover:text-lolly">Plus de 50.000 CFA</Link>
                        </div>
                    </div>
                </aside>

                {/* Main Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter">
                            {query ? `Résultats pour "${query}"` : 'Tous les produits'}
                        </h2>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filteredProducts.length} articles</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((p: any) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            </div>
        )}
      </main>

      <footer className="bg-[#232f3e] text-white py-20 mt-20">
        <div className="max-w-[1500px] mx-auto px-10 text-center">
            <h2 className="brand-lolly text-5xl tracking-tighter mb-10">LOLLY<span className="text-lolly">.</span></h2>
            <div className="flex justify-center flex-wrap gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-12 border-y border-white/5 py-8">
                <Link href="/?shop=1" className="hover:text-white">Luxya Beauty</Link>
                <Link href="/?shop=2" className="hover:text-white">Homtek Tech</Link>
                <Link href="#" className="hover:text-white">Conditions de Vente</Link>
                <Link href="#" className="hover:text-white">Contact</Link>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500">
                {siteSettings?.address || '© 2026 LOLLY SAS • Dakar, Sénégal'}
            </p>
        </div>
      </footer>
    </div>
  );
}

function UniverseEntry({ title, sub, id, img, color }: any) {
    return (
        <Link href={`/?shop=${id}`} className="group relative h-64 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
            <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-20 z-10 group-hover:opacity-40 transition-opacity`} />
            <Image src={img} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{title}</h3>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{sub}</p>
            </div>
        </Link>
    );
}

function PromoEntry({ title, desc, icon }: any) {
    return (
        <div className="bg-white p-8 rounded-lg shadow-sm flex flex-col items-center justify-center text-center space-y-4 hover:shadow-md transition-all">
            <div className="p-4 bg-gray-50 rounded-full">{icon}</div>
            <div>
                <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{desc}</p>
            </div>
        </div>
    );
}

function UniverseSection({ title, subtitle, shopId, products }: any) {
    return (
        <section className="bg-white p-8 rounded-lg shadow-sm border border-gray-200/60">
            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">{title} <span className="text-lolly">Collection.</span></h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{subtitle}</p>
                </div>
                <Link href={`/?shop=${shopId}`} className="text-[10px] font-black uppercase tracking-widest text-lolly hover:underline">
                    Voir tout
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products.slice(0, 6).map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
}
