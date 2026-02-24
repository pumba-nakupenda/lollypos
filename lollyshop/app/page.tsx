import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart, Laptop, Sparkles, Search, SlidersHorizontal, X, ChevronRight, Zap, CheckCircle2, RotateCcw, Filter, TrendingUp, ShieldCheck, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "../utils/supabase/server";
import { API_URL } from "@/utils/api";
import FilterBar from "@/components/FilterBar";
import Initializer from "@/components/Initializer";
import { groupCategories } from "@/lib/category-groups";
import CollapsibleCategoryGroup from "@/components/CollapsibleCategoryGroup";
import PriceSlider from "@/components/PriceSlider";
import ProductStories from "@/components/ProductStories";
import CategoryQuickBar from "@/components/CategoryQuickBar";

async function getProducts(filters: {
    page?: number,
    shopId?: string,
    cat?: string | string[],
    q?: string,
    brand?: string,
    price?: string,
    sort?: string,
    stock?: string,
    limit?: number
}) {
    try {
        const pageSize = filters.limit || 24;
        const page = filters.page || 1;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const supabase = await createClient();
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' });

        // Apply show_on_website constraint
        query = query.neq('show_on_website', false);

        // Apply Filters in DB
        if (filters.shopId && filters.shopId !== 'all') query = query.eq('shop_id', filters.shopId);

        if (filters.cat && filters.cat !== 'all') {
            if (Array.isArray(filters.cat)) {
                query = query.in('category', filters.cat);
            } else {
                query = query.eq('category', filters.cat);
            }
        }

        if (filters.brand && filters.brand !== 'all') query = query.eq('brand', filters.brand);
        if (filters.stock === 'true') query = query.gt('stock', 0);
        if (filters.q) query = query.ilike('name', `%${filters.q}%`);

        if (filters.price) {
            if (filters.price.includes('-')) {
                const [min, max] = filters.price.split('-').map(Number);
                if (!isNaN(min)) query = query.gte('price', min);
                if (!isNaN(max)) query = query.lte('price', max);
            } else if (filters.price === 'low') {
                query = query.lt('price', 10000);
            } else if (filters.price === 'mid') {
                query = query.gte('price', 10000).lte('price', 50000);
            } else if (filters.price === 'high') {
                query = query.gt('price', 50000);
            }
        }

        // Special Filter for Promos & Featured (Stories)
        if (filters.sort === 'promo') {
            query = query.or('promo_price.gt.0,is_featured.eq.true');
        }

        // Sort
        if (filters.sort === 'price_asc') query = query.order('price', { ascending: true });
        else if (filters.sort === 'price_desc') query = query.order('price', { ascending: false });
        else if (filters.sort === 'best') query = query.order('rating', { ascending: false });
        else query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query.range(from, to);

        if (error) {
            console.error("Supabase query error:", error);
            throw error;
        }
        return { products: data || [], totalCount: count || 0 };
    } catch (e: any) {
        console.error("getProducts failed:", e.message || e);
        return { products: [], totalCount: 0 };
    }
}


async function getFilterData(filters: { shopId?: string, cat?: string }) {
    try {
        const supabase = await createClient();

        // 1. Fetch categories (always based on shop only, to keep navigation open)
        let catQuery = supabase
            .from('products')
            .select('category')
            .neq('show_on_website', false);

        if (filters.shopId && filters.shopId !== 'all') {
            catQuery = catQuery.eq('shop_id', filters.shopId);
        }

        const { data: catData, error: catError } = await catQuery;
        if (catError) throw catError;
        const categories = Array.from(new Set(catData?.map((p: any) => p.category).filter(Boolean) || [])).sort() as string[];


        // 2. Fetch brands (based on shop AND category if selected)
        let brandQuery = supabase
            .from('products')
            .select('brand')
            .neq('show_on_website', false);

        if (filters.shopId && filters.shopId !== 'all') {
            brandQuery = brandQuery.eq('shop_id', filters.shopId);
        }
        if (filters.cat && filters.cat !== 'all') {
            brandQuery = brandQuery.eq('category', filters.cat);
        }

        const { data: brandData, error: brandError } = await brandQuery;
        if (brandError) throw brandError;

        const brands = Array.from(new Set(brandData?.map((p: any) => p.brand).filter(Boolean) || [])).sort() as string[];

        return { categories, brands };
    } catch (e) {
        console.error("getFilterData failed:", e);
        return { categories: [], brands: [] };
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
        stock?: string,
        page?: string,
        openProduct?: string
    }>
}) {
    const searchParams = await props.searchParams;
    const openProductId = searchParams.openProduct;
    const currentPage = parseInt(searchParams.page || '1');
    const query = searchParams.q || "";
    const catFilter = searchParams.cat || "all";
    const shopFilter = searchParams.shop || "all";
    const brandFilter = searchParams.brand || "all";
    const priceFilter = searchParams.price || "all";
    const sort = searchParams.sort || "newest";
    const onlyInStock = searchParams.stock || "false";

    // Dynamic loading of products based on filters
    const [{ products: filteredProducts, totalCount }, siteSettings, { categories, brands }, { products: promoProducts }] = await Promise.all([
        getProducts({
            page: currentPage,
            shopId: shopFilter,
            cat: catFilter,
            q: query,
            brand: brandFilter,
            price: priceFilter,
            sort: sort,
            stock: onlyInStock
        }),
        getSiteSettings(),
        getFilterData({ shopId: shopFilter, cat: catFilter }),
        getProducts({ sort: 'promo', limit: 12 }) // For Stories
    ]);

    const categoryGroups = groupCategories(categories, siteSettings?.category_groups || []);
    const groupColors = ["#dc2626", "#2563eb", "#059669", "#7c3aed", "#ea580c", "#db2777"];

    // Fetch previews for the top 3 category groups
    const previewGroups = await Promise.all(
        categoryGroups.slice(0, 3).map(async (group, idx) => {
            const { products } = await getProducts({ cat: group.categories, limit: 6 });
            return {
                ...group,
                products,
                color: groupColors[idx % groupColors.length]
            };
        })
    );

    const isFiltering = query || catFilter !== "all" || shopFilter !== "all" || brandFilter !== "all" || priceFilter !== "all" || onlyInStock === 'true' || sort !== 'newest';

    const event = {
        title: siteSettings?.event?.title || "Livraison Offerte",
        description: siteSettings?.event?.description || "Gratuite sur tout Dakar ce week-end !",
        image: siteSettings?.event?.image || "https://images.unsplash.com/photo-1590874102752-ce229799d529?q=80&w=1000",
        miniImage: siteSettings?.event?.mini_image || siteSettings?.event?.image || "https://images.unsplash.com/photo-1590874102752-ce229799d529?q=80&w=1000",
        link: siteSettings?.event?.link || "/?sort=best"
    };

    const showAmazonHome = !isFiltering && sort === 'newest';

    return (
        <>
            <Initializer products={filteredProducts} />
            <Suspense fallback={<div className="h-20 bg-[#131921] w-full" />}>
                <Navbar settings={siteSettings} categories={categories} />
            </Suspense>

            {showAmazonHome && <ProductStories products={promoProducts} />}
            {showAmazonHome && <CategoryQuickBar categories={categories} />}

            {showAmazonHome ? (
                <div className="w-full bg-[#eaeded] min-h-screen pb-20">
                    <section className="relative h-[300px] sm:h-[500px] lg:h-[600px] w-full overflow-hidden">
                        <HeroCarousel slides={siteSettings?.slides || []} />
                    </section>

                    <main className="max-w-[1500px] mx-auto px-2 sm:px-4 lg:px-6 -mt-16 sm:-mt-32 lg:-mt-64 relative z-40 space-y-6 sm:space-y-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <UniverseEntry
                                title="Univers Luxya"
                                sub="BEAUTÉ & BIEN-ÊTRE"
                                href="/?shop=1"
                                img="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000"
                                hexColor="#ef4444"
                                tags={["Maquillage", "Parfums", "Soin Visage"]}
                            />
                            <UniverseEntry
                                title="Univers Homtek"
                                sub="TECH & INNOVATION"
                                href="/?shop=2"
                                img="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000"
                                hexColor="#3b82f6"
                                tags={["Smartphones", "Accessoires", "Audio"]}
                            />
                            
                            <div className="bg-white p-6 shadow-xl border border-gray-100 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 text-[#FF9900]/5 group-hover:text-[#FF9900]/10 transition-colors">
                                    <TrendingUp className="w-20 h-20 rotate-12" />
                                </div>
                                <h3 className="text-xl font-black italic mb-4 uppercase tracking-tighter">Populaires</h3>
                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    {filteredProducts.slice(0, 4).map((p: any) => (
                                        <Link key={p.id} href={`/product/${p.id}`} className="group/item block">
                                            <div className="aspect-square relative mb-1 overflow-hidden bg-gray-50 rounded-lg border border-gray-100">
                                                {p.image ? <Image src={p.image} alt={p.name} fill className="object-contain p-2 group-hover/item:scale-110 transition-transform" /> : <ShoppingBag className="w-6 h-6 m-auto text-gray-200" />}
                                            </div>
                                            <p className="text-[9px] font-bold text-gray-600 truncate uppercase">{p.name}</p>
                                        </Link>
                                    ))}
                                </div>
                                <Link href="/?sort=best" className="mt-4 block text-[10px] font-black text-[#007185] uppercase tracking-widest hover:underline">Tout voir</Link>
                            </div>

                            <div className="bg-white p-6 shadow-xl border border-gray-100 rounded-xl flex flex-col h-full bg-gradient-to-br from-white to-yellow-50/30">
                                <h3 className="text-xl font-black italic mb-4 uppercase tracking-tighter text-lolly">{event.title}</h3>
                                <div className="flex-1 aspect-square relative mb-4 overflow-hidden rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-inner group">
                                    {event.miniImage || event.image ? (
                                        <Image
                                            src={event.miniImage || event.image}
                                            alt="Event"
                                            fill
                                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <Sparkles className="w-10 h-10 text-gray-200" />
                                    )}
                                </div>
                                <Link href={event.link || "#"} className="py-3 bg-[#fde700] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl text-center shadow-lg hover:bg-black hover:text-white transition-all">DÉCOUVRIR</Link>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {previewGroups.map((group, idx) => (
                                <div key={group.title} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                                    <UniverseSection
                                        title={group.title}
                                        subtitle="SÉLECTION PREMIUM"
                                        href={`/?cat=${group.categories[0]}`}
                                        products={group.products}
                                        hexColor={group.color}
                                    />
                                    {idx === 0 && (
                                        <div className="py-2">
                                            <Link href={event.link || "/?sort=best"} className="block relative w-full h-48 sm:h-64 md:h-96 overflow-hidden rounded-[40px] shadow-2xl group border-4 border-white bg-black">
                                                {event.image ? (
                                                    <Image src={event.image} alt="Event" fill className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-[5000ms]" />
                                                ) : null}
                                                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent flex flex-col justify-center px-8 sm:px-16 md:px-24 text-white">
                                                    <div className="inline-flex items-center space-x-2 bg-lolly text-black px-3 py-1 rounded-full w-fit mb-4 sm:mb-6">
                                                        <Zap className="w-3 h-3 sm:w-4 h-4 fill-current" />
                                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Événement Flash</span>
                                                    </div>
                                                    <h3 className="text-3xl sm:text-6xl md:text-8xl font-black uppercase italic leading-none tracking-tighter drop-shadow-2xl">{event.title}</h3>
                                                    <p className="text-sm sm:text-2xl md:text-3xl font-bold mt-2 sm:mt-4 max-w-xs sm:max-w-2xl leading-tight line-clamp-2 opacity-90">{event.description}</p>
                                                    <div className="mt-6 sm:mt-10 bg-white text-black px-8 py-3.5 sm:px-12 sm:py-5 rounded-full w-fit font-black text-[10px] sm:text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-lolly transition-colors">Profiter de l'offre</div>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            ) : (
                <main className="max-w-[1500px] mx-auto px-4 lg:px-6 py-6 pb-20 bg-[#eaeded] min-h-screen">
                    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                        {/* Lateral Sidebar (Scrollable on Mobile, Sticky on Desktop) */}
                        <aside className="w-full lg:w-64 shrink-0 bg-white lg:bg-white p-5 rounded-2xl lg:rounded-xl border border-gray-200 shadow-sm space-y-8 lg:sticky lg:top-28 overflow-x-auto lg:overflow-visible">
                            <div className="flex lg:flex-col gap-8 lg:gap-8 min-w-max lg:min-w-0">
                                {isFiltering && (
                                    <Link href="/" className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                                        <RotateCcw className="w-3 h-3" /> <span>Effacer</span>
                                    </Link>
                                )}
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Univers</h3>
                                    <div className="flex lg:flex-col gap-4 lg:gap-2">
                                        <Link href={`/?shop=all&cat=all&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`flex items-center text-xs font-bold whitespace-nowrap ${shopFilter === 'all' ? 'text-lolly' : 'text-gray-600'}`}><div className={`w-2 h-2 rounded-full mr-2 ${shopFilter === 'all' ? 'bg-lolly' : 'bg-gray-300'}`} /> Tout Lolly</Link>
                                        <Link href={`/?shop=1&cat=all&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`flex items-center text-xs font-bold whitespace-nowrap ${shopFilter === '1' ? 'text-red-600' : 'text-gray-600'}`}><div className={`w-2 h-2 rounded-full mr-2 ${shopFilter === '1' ? 'bg-red-600' : 'bg-gray-300'}`} /> Luxya Beauty</Link>
                                        <Link href={`/?shop=2&cat=all&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`flex items-center text-xs font-bold whitespace-nowrap ${shopFilter === '2' ? 'text-blue-600' : 'text-gray-600'}`}><div className={`w-2 h-2 rounded-full mr-2 ${shopFilter === '2' ? 'bg-blue-600' : 'bg-gray-300'}`} /> Homtek Tech</Link>
                                    </div>
                                </div>





                                {categories.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Rayons</h3>
                                        <div className="flex lg:flex-col gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {groupCategories(categories, siteSettings?.category_groups || []).map((group) => (
                                                <CollapsibleCategoryGroup
                                                    key={group.title}
                                                    title={group.title}
                                                    categories={group.categories}
                                                    shopFilter={shopFilter}
                                                    catFilter={catFilter}
                                                    brandFilter={brandFilter}
                                                    priceFilter={priceFilter}
                                                    onlyInStock={onlyInStock}
                                                    sort={sort}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {brands.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Marques</h3>
                                        <div className="flex lg:flex-col gap-4 lg:gap-2 max-h-48 overflow-y-auto custom-scrollbar">{brands.map(brand => (<Link key={brand} href={`/?brand=${brand}&shop=${shopFilter}&cat=${catFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`block text-[11px] font-bold whitespace-nowrap transition-colors ${brandFilter === brand ? 'text-[#0055ff] lg:translate-x-1' : 'text-gray-500 hover:text-black'}`}>{brand}</Link>))}</div>
                                    </div>
                                )}


                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Budget</h3>
                                    <PriceSlider />
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 space-y-10">
                            {/* Filter Bar */}
                            <FilterBar categories={categories} resultsCount={totalCount} brands={brands} />

                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                                {filteredProducts.map((p: any) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex justify-center items-center space-x-4 pt-10">
                                {currentPage > 1 && (
                                    <Link
                                        href={`/?page=${currentPage - 1}&shop=${shopFilter}&cat=${catFilter}&brand=${brandFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`}
                                        className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                                    >
                                        Page Précédente
                                    </Link>
                                )}
                                <div className="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Page {currentPage}</span>
                                </div>
                                {filteredProducts.length === 24 && (
                                    <Link
                                        href={`/?page=${currentPage + 1}&shop=${shopFilter}&cat=${catFilter}&brand=${brandFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`}
                                        className="px-6 py-3 bg-[#0055ff] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                                    >
                                        Page Suivante
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            )}

            <footer className="bg-[#131921] text-white py-12 mt-20 text-center border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 mb-10">
                    <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Paiement 100% Sécurisé</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Livraison Rapide</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Retours Facilités</span>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-center items-center gap-4 opacity-40">
                        <span className="text-[8px] font-black uppercase border border-white/20 px-2 py-1 rounded">Wave</span>
                        <span className="text-[8px] font-black uppercase border border-white/20 px-2 py-1 rounded">OM</span>
                        <span className="text-[8px] font-black uppercase border border-white/20 px-2 py-1 rounded">Visa</span>
                        <span className="text-[8px] font-black uppercase border border-white/20 px-2 py-1 rounded">Cash on Delivery</span>
                    </div>
                </div>
                <h2 className="brand-lolly text-5xl tracking-tighter mb-6 uppercase italic font-black text-white">LOLLY<span className="text-[#0055ff]">.</span></h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 opacity-50">© 2026 LOLLY SAS • Dakar, Sénégal</p>
            </footer>
        </>
    );
}

function UniverseEntry({ title, sub, href, img, hexColor, tags }: any) {
    return (
        <div className="bg-white flex flex-col h-full relative overflow-hidden group rounded-[32px] border border-gray-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700" style={{ borderTop: `8px solid ${hexColor}` }}>
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
                <h3 className="text-2xl sm:text-3xl font-black italic mb-1 uppercase tracking-tighter leading-none">{title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6" style={{ color: hexColor }}>{sub}</p>
                
                <div className="relative flex-1 mb-6 overflow-hidden rounded-[24px] min-h-[220px] bg-gray-50 shadow-inner">
                    <Image src={img} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-[2000ms]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {tags?.map((tag: string) => (
                        <Link 
                            key={tag} 
                            href={`${href}&cat=${tag}`}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-black transition-all"
                        >
                            {tag}
                        </Link>
                    ))}
                </div>

                <Link href={href} className="mt-auto w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center transition-all bg-gray-900 text-white group-hover:shadow-2xl hover:scale-[1.02] active:scale-95" style={{ backgroundColor: hexColor }}>
                    EXPLORER <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-2 transition-transform" />
                </Link>
            </div>
            
            <div className="absolute -right-20 -bottom-20 w-64 h-64 opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: hexColor }} />
        </div>
    );
}

function UniverseSection({ title, subtitle, href, products, hexColor }: any) {
    return (
        <section className="bg-white p-6 sm:p-10 shadow-sm border border-gray-100 rounded-[32px] overflow-hidden" style={{ borderTop: `4px solid ${hexColor}` }}>
            <div className="flex items-baseline space-x-4 mb-8 border-b border-gray-50 pb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none">{title}</h2>
                    <p className="text-[10px] font-black text-gray-400 tracking-widest mt-1 uppercase">{subtitle}</p>
                </div>
                <Link href={href} className="text-xs font-black uppercase tracking-widest ml-auto hover:underline" style={{ color: hexColor }}>Voir tout</Link>
            </div>
            {products.length === 0 ? (
                <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-[10px]">Arrivage imminent...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                    {products.slice(0, 6).map((p: any) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </section>
    );
}
