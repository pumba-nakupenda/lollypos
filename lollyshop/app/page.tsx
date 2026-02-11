import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart, Laptop, Sparkles, Search, SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
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

  // Sorting Logic
  if (sort === "price_asc") filteredProducts.sort((a: any, b: any) => a.price - b.price);
  else if (sort === "price_desc") filteredProducts.sort((a: any, b: any) => b.price - a.price);
  else {
      // Default sorting: Featured first, then Promo, then newest
      filteredProducts.sort((a: any, b: any) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          
          const aHasPromo = a.promo_price && a.promo_price > 0;
          const bHasPromo = b.promo_price && b.promo_price > 0;
          if (aHasPromo && !bHasPromo) return -1;
          if (!aHasPromo && bHasPromo) return 1;
          
          return b.id - a.id;
      });
  }

  // Dynamic categories for filters based on current shop
  const productsForCategories = shopFilter === "all" ? shopProducts : shopProducts.filter((p: any) => p.shop_id.toString() === shopFilter);
  const categories = Array.from(new Set(productsForCategories.map((p: any) => p.category).filter(Boolean))) as string[];

  const isFiltering = query || catFilter !== "all" || shopFilter !== "all" || priceFilter !== "all" || onlyInStock;

  // JSON-LD for Products
  const productListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "numberOfItems": filteredProducts.length,
    "itemListElement": filteredProducts.slice(0, 20).map((p: any, index: number) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": p.name,
        "description": p.description || `Découvrez ${p.name} chez Lolly Shop.`,
        "image": p.image,
        "offers": {
          "@type": "Offer",
          "priceCurrency": "XOF",
          "price": p.promo_price || p.price,
          "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
      }
    }))
  };

  // JSON-LD for FAQ (AEO Strategy)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Qu'est-ce que Lolly Shop ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Lolly Shop est la destination shopping premium au Sénégal, regroupant Luxya pour la beauté et maroquinerie, et Homtek pour la technologie."
        }
      },
      {
        "@type": "Question",
        "name": "Quels sont les délais de livraison à Dakar ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Nous livrons à Dakar en moins de 24h. Les livraisons en régions sont effectuées sous 48h à 72h."
        }
      },
      {
        "@type": "Question",
        "name": "Les produits Luxya sont-ils authentiques ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oui, tous nos produits Luxya sont 100% authentiques et sélectionnés avec le plus grand soin."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black font-sans selection:bg-[#0055ff] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      
      <h1 className="sr-only">Lolly Shop - Boutique Premium Beauté, Maroquinerie et Tech au Sénégal</h1>
      
      <Initializer products={shopProducts} />
      {/* Promo Banner Top */}
      <div className="bg-black text-white py-2 px-4 overflow-hidden relative">
        <div className="flex items-center justify-center space-x-12 animate-marquee whitespace-nowrap">
            {[1,2,3,4,5].map(i => (
                <span key={i} className="text-[9px] font-black uppercase tracking-[0.4em] flex items-center">
                    <Sparkles className="w-3 h-3 mr-3 text-[#0055ff]" /> 
                    {shopFilter === '1' ? 'LUXYA : VOTRE RITUEL BEAUTÉ PREMIUM EST ICI' : 
                     shopFilter === '2' ? 'HOMTEK : LA TECHNOLOGIE DE DEMAIN DÈS AUJOURD\'HUI' :
                     siteSettings?.promo_banner || "BIENVENUE CHEZ LOLLY SHOP : L'EXCELLENCE AU SÉNÉGAL"} 
                    <Sparkles className="w-3 h-3 ml-3 text-[#0055ff]" />
                </span>
            ))}
        </div>
      </div>

      <Navbar settings={siteSettings} />

      {!isFiltering && <HeroCarousel slides={siteSettings?.slides || []} />}

      {/* NEW: Shop Universe Selector - Entry Points */}
      {!isFiltering && (
        <div className="container mx-auto px-6 -mt-10 relative z-40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Luxya Entrance */}
                <Link href="/?shop=1" className="group relative h-64 sm:h-80 rounded-[40px] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] active:scale-95 duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/80 to-purple-900/90 z-10" />
                    <Image src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000" alt="Luxya Universe" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-200 mb-2">Univers Beauté</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter italic">Luxya<span className="text-pink-400">.</span></h2>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">Maroquinerie & Cosmétiques Premium</p>
                        <div className="mt-6 flex items-center text-white font-black text-[10px] uppercase tracking-widest">
                            Explorer la collection <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* Homtek Entrance */}
                <Link href="/?shop=2" className="group relative h-64 sm:h-80 rounded-[40px] overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] active:scale-95 duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0055ff]/80 to-blue-900/90 z-10" />
                    <Image src="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000" alt="Homtek Universe" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200 mb-2">Univers High-Tech</span>
                        <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter italic">Homtek<span className="text-[#0055ff]">.</span></h2>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">Informatique & Accessoires Bureau</p>
                        <div className="mt-6 flex items-center text-white font-black text-[10px] uppercase tracking-widest">
                            Voir le catalogue tech <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
      )}

      <div className={`relative z-30 transition-all duration-700 ${isFiltering ? 'pt-32' : 'pt-20'} mb-10`}>
        <div className="container mx-auto px-6">
            <Suspense fallback={<div className="h-20 bg-white/50 animate-pulse rounded-3xl" />}>
                <FilterBar categories={categories} resultsCount={filteredProducts.length} />
            </Suspense>
        </div>
      </div>

      <main className="container mx-auto px-6 py-20 min-h-[60vh]">
        
        {!isFiltering ? (
            <div className="space-y-32">
                <UniverseSection 
                    title="Luxya" 
                    subtitle="Beauté & Maroquinerie" 
                    icon={<Sparkles className="w-6 h-6 text-pink-400" />}
                    products={shopProducts.filter((p: any) => p.shop_id === 1)}
                />
                
                <UniverseSection 
                    title="Homtek" 
                    subtitle="Tech & Papeterie" 
                    icon={<Laptop className="w-6 h-6 text-[#0055ff]" />}
                    products={shopProducts.filter((p: any) => p.shop_id === 2)}
                />
            </div>
        ) : (
            <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {filteredProducts.length > 0 ? filteredProducts.map((p: any) => (
                        <ProductCard key={p.id} product={p} />
                    )) : (
                        <div className="col-span-full py-40 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                <Search className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-widest text-gray-300">Aucun trésor trouvé</h3>
                            <p className="text-gray-400 text-xs mt-2 font-bold uppercase tracking-widest">Ajustez vos filtres pour explorer d'autres articles</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* FAQ Section for AEO & SEO */}
        <section className="mt-40 border-t border-gray-100 pt-20">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-12">Questions Fréquentes <span className="text-[#0055ff]">(FAQ)</span></h2>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Comment se passe la livraison ?</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Lolly Shop assure une livraison express en moins de 24h sur Dakar. Pour les régions du Sénégal (Thiès, Saint-Louis, Mbour, etc.), comptez 48h à 72h via nos partenaires logistiques.
                    </p>
                </div>
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Quelles sont les méthodes de paiement ?</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Nous acceptons le paiement à la livraison, Wave, Orange Money et les cartes bancaires. La sécurité de vos transactions est notre priorité absolue.
                    </p>
                </div>
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">D'où viennent vos produits ?</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Les articles de <span className="font-bold text-red-500">Luxya</span> (beauté et sacs) et <span className="font-bold text-blue-600">Homtek</span> (tech) sont soigneusement sélectionnés auprès de fournisseurs certifiés pour vous garantir une qualité premium et une authenticité totale.
                    </p>
                </div>
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black">Puis-je retourner un article ?</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Oui, nous acceptons les retours sous 48h si l'article est dans son emballage d'origine et n'a pas été utilisé. Contactez notre service client WhatsApp pour la procédure.
                    </p>
                </div>
            </div>
        </section>

      </main>

      {/* Newsletter Section */}
      <section className="bg-black py-24 px-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0055ff] rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500 rounded-full blur-[120px]" />
          </div>
          
          <div className="container mx-auto max-w-4xl text-center relative z-10">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-8 animate-float" />
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6 italic leading-none">
                  Rejoignez le <span className="text-[#0055ff]">Club VIP</span> Lolly
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-12 max-w-xl mx-auto">
                  Inscrivez-vous pour recevoir nos offres privées, nos nouveaux arrivages et des cadeaux exclusifs chaque mois.
              </p>
              
              <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto" suppressHydrationWarning>
                  <input 
                    type="text" 
                    placeholder="Email ou WhatsApp..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-full py-5 px-8 text-white font-bold placeholder:text-gray-600 focus:border-[#0055ff] outline-none transition-all"
                  />
                  <button className="bg-white text-black font-black uppercase text-xs tracking-[0.2em] px-12 py-5 rounded-full hover:bg-[#0055ff] hover:text-white transition-all shadow-2xl">
                      S'inscrire
                  </button>
              </form>
          </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-24">
        <div className="container mx-auto px-6 text-center">
            <h2 className="brand-lolly text-6xl tracking-tighter mb-8 group cursor-default">
                LOLLY<span className="text-[#0055ff] group-hover:animate-pulse transition-all">SHOP</span>
            </h2>
            <div className="flex justify-center flex-wrap gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-12">
                <Link href="/?shop=1" className="hover:text-black transition-colors text-red-500">Luxya Boutique</Link>
                <Link href="/?shop=2" className="hover:text-black transition-colors text-blue-600">Homtek Tech</Link>
                <Link href="#" className="hover:text-black transition-colors">Support: {siteSettings?.whatsapp_number || '+221 77 235 47 47'}</Link>
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-300">
                {siteSettings?.address || '© 2026 LOLLY SAS • Dakar'}
            </p>
        </div>
      </footer>
    </div>
  );
}

function UniverseSection({ title, subtitle, icon, products }: any) {
    return (
        <section>
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 px-2">
                <div>
                    <div className="flex items-center space-x-3 mb-3">
                        {icon}
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">{subtitle}</span>
                    </div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter italic"><span className="brand-lolly">{title}</span> Universe</h2>
                </div>
                <Link href={`/?shop=${title === 'Luxya' ? '1' : '2'}`} className="group flex items-center space-x-4 bg-white border border-gray-100 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl shadow-black/5">
                    <span>Voir tout le catalogue</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12">
                {products.slice(0, 8).map((p: any) => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </section>
    );
}