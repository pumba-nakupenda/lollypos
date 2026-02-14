
import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart, Laptop, Sparkles, Search, SlidersHorizontal, X, ChevronRight, Zap, CheckCircle2, RotateCcw, Filter, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "../utils/supabase/server";
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
        const supabase = await createClient();
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
        brand?: string,
        price?: string,
        sort?: string,
        stock?: string
    }> 
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.q?.toLowerCase() || "";
  const catFilter = searchParams.cat || "all";
  const shopFilter = searchParams.shop || "all";
  const brandFilter = searchParams.brand || "all";
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
      const matchesSearch = !query || p.name.toLowerCase().includes(query) || (p.category || "").toLowerCase().includes(query);
      const matchesCat = catFilter === "all" || p.category === catFilter;
      const matchesShop = shopFilter === "all" || p.shop_id.toString() === shopFilter;
      const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
      const matchesStock = !onlyInStock || p.stock > 0;
      
      let matchesPrice = true;
      if (priceFilter === "low") matchesPrice = p.price < 10000;
      else if (priceFilter === "mid") matchesPrice = p.price >= 10000 && p.price <= 50000;
      else if (priceFilter === "high") matchesPrice = p.price > 50000;

      return matchesSearch && matchesCat && matchesShop && matchesBrand && matchesStock && matchesPrice;
  });

  // Sorting Logic
  if (sort === 'newest') {
      filteredProducts = filteredProducts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'price_asc') {
      filteredProducts = filteredProducts.sort((a: any, b: any) => a.price - b.price);
  } else if (sort === 'price_desc') {
      filteredProducts = filteredProducts.sort((a: any, b: any) => b.price - a.price);
  } else if (sort === 'best') {
      filteredProducts = filteredProducts.sort((a: any, b: any) => (b.sales_count || 0) - (a.sales_count || 0));
  } else if (sort === 'promo') {
      filteredProducts = filteredProducts.filter((p: any) => p.promo_price && p.promo_price > 0 && p.promo_price < p.price);
  }

  // DYNAMIC LISTS: Filter categories and brands based on the SELECTED SHOP
  const contextProducts = shopFilter === 'all' ? shopProducts : shopProducts.filter((p: any) => p.shop_id.toString() === shopFilter);
  const categories = Array.from(new Set(contextProducts.map((p: any) => p.category).filter(Boolean))).sort() as string[];
  const brands = Array.from(new Set(contextProducts.map((p: any) => p.brand).filter(Boolean))).sort() as string[];
  
  const isFiltering = query || catFilter !== "all" || shopFilter !== "all" || brandFilter !== "all" || priceFilter !== "all" || onlyInStock || sort !== 'newest';

  const event = siteSettings?.event || {
      title: "Livraison Offerte",
      description: "Gratuite sur tout Dakar ce week-end !",
      image: "https://images.unsplash.com/photo-1590874102752-ce229799d529?q=80&w=1000",
      link: "/?sort=best"
  };

  const showAmazonHome = !isFiltering && sort === 'newest';

  return (
    <>
      <Suspense fallback={<div className="h-20 bg-[#131921] w-full" />}>
        <Navbar settings={siteSettings} categories={categories} />
      </Suspense>

      {showAmazonHome ? (
          <div className="w-full bg-[#eaeded] min-h-screen">
              <section className="relative h-[300px] sm:h-[500px] lg:h-[600px] w-full overflow-hidden">
                <HeroCarousel slides={siteSettings?.slides || []} />
              </section>
              
              <main className="max-w-[1500px] mx-auto px-2 sm:px-4 lg:px-6 -mt-16 sm:-mt-32 lg:-mt-64 relative z-40 pb-20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                      <UniverseEntry title="Luxya Beauté" sub="L'Univers de l'Élégance" id="1" img="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000" hexColor="#dc2626" />
                      <UniverseEntry title="Homtek Tech" sub="Innovation & Futur" id="2" img="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000" hexColor="#2563eb" />
                      <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-sm">
                          <h3 className="text-xl font-bold mb-4">Populaires</h3>
                          <div className="grid grid-cols-2 gap-3">
                              {shopProducts.sort((a:any, b:any) => (b.sales_count || 0) - (a.sales_count || 0)).slice(0, 4).map((p: any) => (
                                  <Link key={p.id} href={`/?q=${encodeURIComponent(p.name)}`} className="group block">
                                      <div className="aspect-square relative mb-1 overflow-hidden bg-gray-50">
                                          {p.image ? <Image src={p.image} alt={p.name} fill className="object-contain p-2" /> : <ShoppingBag className="w-6 h-6 m-auto text-gray-200" />}
                                      </div>
                                      <p className="text-[10px] text-gray-600 truncate">{p.name}</p>
                                  </Link>
                              ))}
                          </div>
                      </div>
                      <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-sm">
                          <h3 className="text-xl font-bold mb-4">{event.title}</h3>
                          <div className="aspect-square relative mb-4 overflow-hidden rounded bg-gray-50">
                              <Image 
                                src={event.miniImage || event.image} 
                                alt="Event" 
                                fill 
                                className="object-contain p-2" 
                              />
                          </div>
                          <Link href={event.link || "#"} className="text-sm text-[#007185] hover:underline block font-medium">Découvrir l'offre</Link>
                      </div>
                  </div>

                  <div className="space-y-10">
                      <UniverseSection title="Luxya" subtitle="COLLECTION BEAUTÉ" shopId="1" products={shopProducts.filter((p: any) => p.shop_id === 1)} hexColor="#dc2626" />

                      <div className="py-4">
                        <Link href={event.link || "/?sort=best"} className="block relative w-full h-48 sm:h-64 md:h-80 overflow-hidden rounded-lg shadow-xl group border-2 sm:border-4 border-white">
                            <Image src={event.image} alt="Event" fill className="object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent flex flex-col justify-center px-6 sm:px-12 md:px-16 text-white">
                                <h3 className="text-2xl sm:text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter drop-shadow-2xl">{event.title}</h3>
                                <p className="text-xs sm:text-xl md:text-2xl font-bold mt-2 sm:mt-4 max-w-xs sm:max-w-xl leading-tight line-clamp-2">{event.description}</p>
                                <div className="mt-4 sm:mt-8 bg-[#febd69] text-black px-6 py-2.5 sm:px-10 sm:py-4 rounded-full w-fit font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl">En profiter</div>
                            </div>
                        </Link>
                      </div>

                      <UniverseSection title="Homtek" subtitle="COLLECTION TECH" shopId="2" products={shopProducts.filter((p: any) => p.shop_id === 2)} hexColor="#2563eb" />
                  </div>
              </main>
          </div>
      ) : (
          <main className="max-w-[1500px] mx-auto px-4 lg:px-6 py-6 pb-20 bg-[#eaeded] min-h-screen">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <Link href="/" className="hover:text-black transition-colors">Accueil</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-black font-black">{filteredProducts.length} articles trouvés</span>
                </div>
                <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm self-end">
                    <Link href={`/?sort=newest&shop=${shopFilter}&cat=${catFilter}&brand=${brandFilter}&price=${priceFilter}&stock=${onlyInStock}`} className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all ${sort === 'newest' ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-500'}`}>Nouveautés</Link>
                    <Link href={`/?sort=best&shop=${shopFilter}&cat=${catFilter}&brand=${brandFilter}&price=${priceFilter}&stock=${onlyInStock}`} className={`px-3 py-1.5 rounded text-[9px] font-bold transition-all ${sort === 'best' ? 'bg-black text-white shadow-md' : 'hover:bg-gray-100 text-gray-500'}`}>Populaires</Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                <aside className="w-full lg:w-64 shrink-0 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-8 lg:sticky lg:top-28">
                    {isFiltering && (
                        <Link href="/" className="flex items-center justify-center space-x-2 w-full py-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                            <RotateCcw className="w-3 h-3" /> <span>Effacer les filtres</span>
                        </Link>
                    )}
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Univers</h3>
                        <div className="space-y-2">
                            <Link href={`/?shop=all&cat=all&brand=all&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`flex items-center text-xs font-bold ${shopFilter === 'all' ? 'text-lolly' : 'text-gray-600'}`}><div className={`w-2 h-2 rounded-full mr-2 ${shopFilter === 'all' ? 'bg-lolly' : 'bg-gray-300'}`} /> Tout Lolly</Link>
                            <Link href={`/?shop=1&cat=all&brand=all&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`flex items-center text-xs font-bold ${shopFilter === '1' ? 'text-red-600' : 'text-gray-600'}`}><div className={`w-2 h-2 rounded-full mr-2 ${shopFilter === '1' ? 'bg-red-600' : 'bg-gray-300'}`} /> Luxya Beauty</Link>
                            <Link href={`/?shop=2&cat=all&brand=all&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`flex items-center text-xs font-bold ${shopFilter === '2' ? 'text-blue-600' : 'text-gray-600'}`}><div className={`w-2 h-2 rounded-full mr-2 ${shopFilter === '2' ? 'bg-blue-600' : 'bg-gray-300'}`} /> Homtek Tech</Link>
                        </div>
                    </div>
                    
                    {categories.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Rayons</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">{categories.map(cat => (<Link key={cat} href={`/?cat=${cat}&shop=${shopFilter}&brand=${brandFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`block text-[11px] font-bold transition-colors ${catFilter === cat ? 'text-lolly translate-x-1' : 'text-gray-500 hover:text-black'}`}>{cat}</Link>))}</div>
                        </div>
                    )}

                    {brands.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Marques</h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">{brands.map(brand => (<Link key={brand} href={`/?brand=${brand}&shop=${shopFilter}&cat=${catFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`block text-[11px] font-bold transition-colors ${brandFilter === brand ? 'text-lolly translate-x-1' : 'text-gray-500 hover:text-black'}`}>{brand}</Link>))}</div>
                        </div>
                    )}

                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Budget</h3>
                        <div className="space-y-2">
                            {[
                                { label: 'Moins de 10.000', val: 'low' },
                                { label: '10.000 - 50.000', val: 'mid' },
                                { label: 'Plus de 50.000', val: 'high' }
                            ].map(p => (
                                <Link 
                                    key={p.val}
                                    href={`/?price=${p.val}&shop=${shopFilter}&cat=${catFilter}&brand=${brandFilter}&stock=${onlyInStock}&sort=${sort}`}
                                    className={`block text-[11px] font-bold transition-colors ${priceFilter === p.val ? 'text-lolly translate-x-1' : 'text-gray-500 hover:text-black'}`}
                                >
                                    {p.label} <span className="text-[8px] opacity-50 font-black">CFA</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map((p: any) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
          </main>
      )}

      <footer className="bg-[#232f3e] text-white py-20 mt-20 text-center">
        <h2 className="brand-lolly text-5xl tracking-tighter mb-10 uppercase italic font-black text-white">LOLLY<span className="text-lolly">.</span></h2>
        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 opacity-50">© 2026 LOLLY SAS • Dakar, Sénégal</p>
      </footer>
    </>
  );
}

function UniverseEntry({ title, sub, id, img, hexColor }: any) {
    return (
        <div className="bg-white p-6 shadow-sm border border-gray-200 flex flex-col h-full relative overflow-hidden group rounded-sm" style={{ borderTop: `6px solid ${hexColor}` }}>
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4" style={{ color: hexColor }}>{sub}</p>
            <div className="flex-1 relative mb-4 overflow-hidden rounded min-h-[200px] bg-gray-50">
                <Image src={img} alt={title} fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <Link href={`/?shop=${id}`} className="text-sm hover:underline font-bold" style={{ color: hexColor }}>Acheter maintenant</Link>
        </div>
    );
}

function UniverseSection({ title, subtitle, shopId, products, hexColor }: any) {
    return (
        <section className="bg-white p-6 shadow-sm border border-gray-200 rounded-sm" style={{ borderTop: `4px solid ${hexColor}` }}>
            <div className="flex items-baseline space-x-4 mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold italic uppercase">{title}</h2>
                <Link href={`/?shop=${shopId}`} className="text-sm hover:underline ml-auto font-bold" style={{ color: hexColor }}>Voir tout</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.slice(0, 6).map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
}
