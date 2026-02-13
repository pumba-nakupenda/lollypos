
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

  let shopProducts = allProducts.filter((p: any) => (p.shop_id === 1 || p.shop_id === 2) && p.show_on_website !== false);
  
  // Sorting Logic
  if (sort === 'newest') {
      shopProducts = shopProducts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sort === 'promo') {
      shopProducts = shopProducts.filter((p: any) => p.promo_price && p.promo_price > 0 && p.promo_price < p.price);
  } else if (sort === 'best') {
      shopProducts = shopProducts.sort((a: any, b: any) => b.stock - a.stock);
  }

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
  const isFiltering = query || catFilter !== "all" || shopFilter !== "all" || priceFilter !== "all" || onlyInStock || sort !== 'newest';

  const event = siteSettings?.event || {
      title: "Livraison Offerte",
      description: "Gratuite sur tout Dakar ce week-end !",
      image: "https://images.unsplash.com/photo-1590874102752-ce229799d529?q=80&w=1000",
      link: "/?sort=best"
  };

  return (
    <div className="min-h-screen bg-[#eaeded] text-black font-sans selection:bg-lolly selection:text-white">
      <Initializer products={shopProducts} />
      
      <Navbar settings={siteSettings} categories={categories} />

      {(!isFiltering && sort === 'newest') && (
          <div className="relative">
              <HeroCarousel slides={siteSettings?.slides || []} />
              
              <div className="max-w-[1500px] mx-auto px-4 lg:px-6 -mt-40 md:-mt-64 relative z-40 pb-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <UniverseEntry 
                        title="Luxya Beauté" 
                        sub="L'Univers de l'Élégance" 
                        id="1" 
                        img="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000" 
                        hexColor="#dc2626"
                      />
                      <UniverseEntry 
                        title="Homtek Tech" 
                        sub="Innovation & Futur" 
                        id="2" 
                        img="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000" 
                        hexColor="#2563eb"
                      />
                      
                      <div className="bg-white p-6 shadow-sm border border-gray-200">
                          <h3 className="text-xl font-bold mb-4">Meilleures Ventes</h3>
                          <div className="grid grid-cols-2 gap-3">
                              {shopProducts.slice(0, 4).map((p: any) => (
                                  <Link key={p.id} href={`/?q=${encodeURIComponent(p.name)}`} className="group block">
                                      <div className="aspect-square relative mb-1 overflow-hidden bg-gray-50">
                                          {p.image ? (
                                              <Image src={p.image} alt={p.name} fill className="object-contain p-2 group-hover:scale-110 transition-transform" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                  <ShoppingBag className="w-6 h-6" />
                                              </div>
                                          )}
                                      </div>
                                      <p className="text-[10px] text-gray-600 line-clamp-1 truncate font-medium">{p.name}</p>
                                  </Link>
                              ))}
                          </div>
                          <Link href="/?sort=best" className="text-sm text-[#007185] hover:text-[#c45500] hover:underline mt-6 block">Voir toutes les offres</Link>
                      </div>

                      <div className="bg-white p-6 shadow-sm border border-gray-200">
                          <h3 className="text-xl font-bold mb-4">{event.title}</h3>
                          <div className="aspect-square relative mb-4 overflow-hidden rounded">
                              <Image src={event.image} alt="Event" fill className="object-cover" />
                          </div>
                          <p className="text-xs text-gray-600 mb-4">{event.description}</p>
                          <Link href={event.link || "#"} className="text-sm text-[#007185] hover:text-[#c45500] hover:underline block font-medium">Découvrir l'offre</Link>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <main className="max-w-[1500px] mx-auto px-4 lg:px-6 py-6">
        
        <div className="mb-6 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Link href="/" className="hover:text-black">Accueil</Link>
            {shopFilter !== 'all' && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <div className={`w-3 h-3 rounded-sm ${shopFilter === '1' ? 'bg-red-600' : 'bg-blue-600'}`} />
                    <span className="text-black font-bold">{shopFilter === '1' ? 'Luxya' : 'Homtek'}</span>
                </>
            )}
            {catFilter !== 'all' && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-black font-black text-lolly">{catFilter}</span>
                </>
            )}
            {sort !== 'newest' && (
                <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-black font-black uppercase text-lolly">{sort === 'promo' ? 'Promotions' : sort === 'best' ? 'Meilleures Ventes' : 'Nouveautés'}</span>
                </>
            )}
        </div>

        {(!isFiltering && sort === 'newest') ? (
            <div className="space-y-8">
                <UniverseSection 
                    title="Luxya" 
                    subtitle="COLLECTION BEAUTÉ" 
                    shopId="1"
                    products={shopProducts.filter((p: any) => p.shop_id === 1)}
                    hexColor="#dc2626"
                />

                {/* PROMINENT AMAZON EVENT BANNER */}
                <div className="py-4">
                    <Link href={event.link || "/?sort=best"} className="block relative w-full h-56 md:h-80 overflow-hidden rounded-lg shadow-xl group border-4 border-white">
                        <Image 
                            src={event.image || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2000"} 
                            alt="Event" 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-[3000ms]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent flex flex-col justify-center px-8 md:px-16 text-white">
                            <div className="bg-[#febd69] text-[#131921] px-3 py-1 rounded-sm w-fit font-black text-[10px] uppercase tracking-widest mb-4 shadow-lg">
                                Événement Spécial
                            </div>
                            <h3 className="text-4xl md:text-7xl font-black uppercase italic leading-none tracking-tighter shadow-black drop-shadow-2xl">
                                {event.title}
                            </h3>
                            <p className="text-base md:text-2xl font-bold opacity-100 mt-4 max-w-xl leading-tight">
                                {event.description}
                            </p>
                            <div className="mt-8 bg-white text-black px-10 py-4 rounded-full w-fit font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-[#febd69] transition-colors">
                                Profiter de l'offre
                            </div>
                        </div>
                    </Link>
                </div>

                <UniverseSection 
                    title="Homtek" 
                    subtitle="COLLECTION TECH" 
                    shopId="2"
                    products={shopProducts.filter((p: any) => p.shop_id === 2)}
                    hexColor="#2563eb"
                />
            </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-64 shrink-0 bg-white p-6 rounded-lg border border-gray-200 h-fit space-y-8 sticky top-28 shadow-sm">
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

                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">
                            {query ? `Résultats pour "${query}"` : sort === 'promo' ? 'Promotions' : sort === 'best' ? 'Meilleures Ventes' : 'Tous les produits'}
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
            <h2 className="brand-lolly text-5xl tracking-tighter mb-10 text-white uppercase italic font-black">LOLLY<span className="text-lolly">.</span></h2>
            <div className="flex justify-center flex-wrap gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-12 border-y border-white/5 py-8">
                <Link href="/?shop=1" className="hover:text-red-500 transition-colors flex items-center"><div className="w-2 h-2 bg-red-600 rounded-full mr-2"/> Luxya Beauty</Link>
                <Link href="/?shop=2" className="hover:text-blue-500 transition-colors flex items-center"><div className="w-2 h-2 bg-blue-600 rounded-full mr-2"/> Homtek Tech</Link>
                <Link href="/conditions" className="hover:text-white">Conditions de Vente</Link>
                <a href={`https://wa.me/${siteSettings?.whatsapp_number || "221772354747"}`} className="hover:text-white">Contact WhatsApp</a>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 opacity-50">
                {siteSettings?.address || '© 2026 LOLLY SAS • Dakar, Sénégal'}
            </p>
        </div>
      </footer>
    </div>
  );
}

function UniverseEntry({ title, sub, id, img, hexColor }: any) {
    return (
        <div 
            className="bg-white p-6 shadow-sm border-x border-b border-gray-200 flex flex-col h-full relative overflow-hidden group"
            style={{ borderTop: `6px solid ${hexColor}` }}
        >
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
        <section 
            className="bg-white p-6 shadow-sm border-x border-b border-gray-200"
            style={{ borderTop: `4px solid ${hexColor}` }}
        >
            <div className="flex items-baseline space-x-4 mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full shadow-lg shadow-black/10" style={{ backgroundColor: hexColor }} />
                    <h2 className="text-2xl font-bold italic uppercase">{title}</h2>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{subtitle}</p>
                <Link href={`/?shop=${shopId}`} className="text-sm hover:underline ml-auto font-bold" style={{ color: hexColor }}>
                    Voir tout
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {products.slice(0, 6).map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
}
