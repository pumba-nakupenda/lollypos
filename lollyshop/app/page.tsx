import Link from "next/link";
import { ArrowRight, ShoppingBag, ShoppingCart, Laptop, Sparkles, Search, SlidersHorizontal, X, ChevronRight, Zap, CheckCircle2, RotateCcw, Filter, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "../utils/supabase/server";
import { API_URL } from "@/utils/api";
import FilterBar from "@/components/FilterBar";
import Initializer from "@/components/Initializer";

async function getProducts(filters: {
    page?: number,
    shopId?: string,
    cat?: string,
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
        if (filters.cat && filters.cat !== 'all') query = query.eq('category', filters.cat);
        if (filters.brand && filters.brand !== 'all') query = query.eq('brand', filters.brand);
        if (filters.stock === 'true') query = query.gt('stock', 0);
        if (filters.q) query = query.ilike('name', `%${filters.q}%`);

        if (filters.price === 'low') query = query.lt('price', 10000);
        else if (filters.price === 'mid') query = query.gte('price', 10000).lte('price', 50000);
        else if (filters.price === 'high') query = query.gt('price', 50000);

        // Special Filter for Promos
        if (filters.sort === 'promo') {
            query = query.gt('promo_price', 0);
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

async function getFilterData(shopId?: string) {
    try {
        const supabase = await createClient();

        // Fetch ALL products to get complete category and brand lists
        // This is independent of pagination to ensure all categories are always visible
        let query = supabase
            .from('products')
            .select('category, brand')
            .neq('show_on_website', false);

        if (shopId && shopId !== 'all') {
            query = query.eq('shop_id', shopId);
        }

        // No pagination here - we need all unique categories/brands
        const { data, error } = await query;
        if (error) throw error;

        const categories = Array.from(new Set(data?.map((p: any) => p.category).filter(Boolean) || [])).sort() as string[];
        const brands = Array.from(new Set(data?.map((p: any) => p.brand).filter(Boolean) || [])).sort() as string[];

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
    const [{ products: filteredProducts, totalCount }, siteSettings, { categories, brands }] = await Promise.all([
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
        getFilterData(shopFilter)
    ]);

    // For Amazon Home View, we fetch small sets for each shop to ensure they always show up
    const [{ products: luxyaPreview }, { products: homtekPreview }] = await Promise.all([
        getProducts({ shopId: '1', limit: 6 }),
        getProducts({ shopId: '2', limit: 6 })
    ]);

    const isFiltering = query || catFilter !== "all" || shopFilter !== "all" || brandFilter !== "all" || priceFilter !== "all" || onlyInStock === 'true' || sort !== 'newest';

    const event = siteSettings?.event || {
        title: "Livraison Offerte",
        description: "Gratuite sur tout Dakar ce week-end !",
        image: "https://images.unsplash.com/photo-1590874102752-ce229799d529?q=80&w=1000",
        link: "/?sort=best"
    };

    const showAmazonHome = !isFiltering && sort === 'newest';

    return (
        <>
            <Initializer products={filteredProducts} />
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
                                    {filteredProducts.slice(0, 4).map((p: any) => (
                                        <Link key={p.id} href={`/product/${p.id}`} className="group block">
                                            <div className="aspect-square relative mb-1 overflow-hidden bg-gray-50 rounded-lg">
                                                {p.image ? <Image src={p.image} alt={p.name} fill className="object-contain p-2" /> : <ShoppingBag className="w-6 h-6 m-auto text-gray-200" />}
                                            </div>
                                            <p className="text-[10px] text-gray-600 truncate">{p.name}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-sm">
                                <h3 className="text-xl font-bold mb-4 text-lolly">{event.title}</h3>
                                <div className="aspect-square relative mb-4 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                                    <Image
                                        src={event.miniImage || event.image}
                                        alt="Event"
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                                <Link href={event.link || "#"} className="text-sm text-[#0055ff] hover:underline block font-black uppercase tracking-widest text-center">Découvrir</Link>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <UniverseSection title="Luxya" subtitle="COLLECTION BEAUTÉ" shopId="1" products={luxyaPreview} hexColor="#dc2626" />

                            <div className="py-4">
                                <Link href={event.link || "/?sort=best"} className="block relative w-full h-48 sm:h-64 md:h-80 overflow-hidden rounded-[32px] shadow-2xl group border-4 border-white">
                                    <Image src={event.image} alt="Event" fill className="object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent flex flex-col justify-center px-6 sm:px-12 md:px-16 text-white">
                                        <h3 className="text-2xl sm:text-5xl md:text-7xl font-black uppercase italic leading-none tracking-tighter drop-shadow-2xl">{event.title}</h3>
                                        <p className="text-xs sm:text-xl md:text-2xl font-bold mt-2 sm:mt-4 max-w-xs sm:max-w-xl leading-tight line-clamp-2">{event.description}</p>
                                        <div className="mt-4 sm:mt-8 bg-[#0055ff] text-white px-6 py-2.5 sm:px-10 sm:py-4 rounded-full w-fit font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl">En profiter</div>
                                    </div>
                                </Link>
                            </div>

                            <UniverseSection title="Homtek" subtitle="COLLECTION TECH" shopId="2" products={homtekPreview} hexColor="#2563eb" />
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
                                        <div className="flex lg:flex-col gap-4 lg:gap-2 max-h-48 overflow-y-auto no-scrollbar">{categories.map(cat => (<Link key={cat} href={`/?cat=${cat}&shop=${shopFilter}&price=${priceFilter}&stock=${onlyInStock}&sort=${sort}`} className={`block text-[11px] font-bold whitespace-nowrap transition-colors ${catFilter === cat ? 'text-[#0055ff] lg:translate-x-1' : 'text-gray-500 hover:text-black'}`}>{cat}</Link>))}</div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border-b border-gray-50 pb-2">Budget</h3>
                                    <div className="flex lg:flex-col gap-4 lg:gap-2">
                                        {[
                                            { label: 'Moins de 10.000', val: 'low' },
                                            { label: '10.000 - 50.000', val: 'mid' },
                                            { label: 'Plus de 50.000', val: 'high' }
                                        ].map(p => (
                                            <Link
                                                key={p.val}
                                                href={`/?price=${p.val}&shop=${shopFilter}&cat=${catFilter}&stock=${onlyInStock}&sort=${sort}`}
                                                className={`block text-[11px] font-bold whitespace-nowrap transition-colors ${priceFilter === p.val ? 'text-[#0055ff] lg:translate-x-1' : 'text-gray-500 hover:text-black'}`}
                                            >
                                                {p.label} <span className="text-[8px] opacity-50 font-black">CFA</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <div className="flex-1 space-y-10">
                            {/* Results Counter & Sort */}
                            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{totalCount} articles trouvés</span>
                                <div className="flex items-center space-x-4">
                                    <Link href={`/?sort=newest&shop=${shopFilter}&cat=${catFilter}&price=${priceFilter}&stock=${onlyInStock}`} className={`text-[10px] font-black uppercase tracking-widest ${sort === 'newest' ? 'text-lolly' : 'text-gray-400'}`}>Nouveautés</Link>
                                    <Link href={`/?sort=price_asc&shop=${shopFilter}&cat=${catFilter}&price=${priceFilter}&stock=${onlyInStock}`} className={`text-[10px] font-black uppercase tracking-widest ${sort === 'price_asc' ? 'text-lolly' : 'text-gray-400'}`}>Prix croissant</Link>
                                </div>
                            </div>

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

            <footer className="bg-[#131921] text-white py-20 mt-20 text-center border-t border-white/5">
                <h2 className="brand-lolly text-5xl tracking-tighter mb-10 uppercase italic font-black text-white">LOLLY<span className="text-[#0055ff]">.</span></h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 opacity-50">© 2026 LOLLY SAS • Dakar, Sénégal</p>
            </footer>
        </>
    );
}

function UniverseEntry({ title, sub, id, img, hexColor }: any) {
    return (
        <div className="bg-white p-6 shadow-sm border border-gray-200 flex flex-col h-full relative overflow-hidden group rounded-xl hover:shadow-2xl transition-all duration-500" style={{ borderTop: `6px solid ${hexColor}` }}>
            <h3 className="text-xl font-black italic mb-1 uppercase tracking-tighter">{title}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4" style={{ color: hexColor }}>{sub}</p>
            <div className="flex-1 relative mb-4 overflow-hidden rounded-2xl min-h-[200px] bg-gray-50">
                <Image src={img} alt={title} fill className="object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <Link href={`/?shop=${id}`} className="text-xs font-black uppercase tracking-widest flex items-center group-hover:translate-x-2 transition-transform" style={{ color: hexColor }}>
                Acheter maintenant <ArrowRight className="w-3 h-3 ml-2" />
            </Link>
        </div>
    );
}

function UniverseSection({ title, subtitle, shopId, products, hexColor }: any) {
    return (
        <section className="bg-white p-6 sm:p-10 shadow-sm border border-gray-100 rounded-[32px] overflow-hidden" style={{ borderTop: `4px solid ${hexColor}` }}>
            <div className="flex items-baseline space-x-4 mb-8 border-b border-gray-50 pb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none">{title}</h2>
                    <p className="text-[10px] font-black text-gray-400 tracking-widest mt-1 uppercase">{subtitle}</p>
                </div>
                <Link href={`/?shop=${shopId}`} className="text-xs font-black uppercase tracking-widest ml-auto hover:underline" style={{ color: hexColor }}>Voir tout</Link>
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
