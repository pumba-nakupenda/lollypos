
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from '../supabase.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';
import { ExpensesService } from '../expenses/expenses.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;
    private chatSessions: Map<string, any> = new Map(); // Memory: session_id -> chat instance

    constructor(
        private configService: ConfigService,
        private supabaseService: SupabaseService,
        private productsService: ProductsService,
        private salesService: SalesService,
        private expensesService: ExpensesService,
    ) {
        const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            
            // Model for Chat
            this.model = this.genAI.getGenerativeModel({ 
                model: 'gemini-2.0-flash',
                tools: [] // Add tools if needed
            });
            this.logger.log('AI Service initialized successfully with Gemini API Key.');
        } else {
            this.logger.error('CRITICAL: GOOGLE_GEMINI_API_KEY is missing from environment!');
        }
    }

    // NEW: Generate embedding for a text
    async generateEmbedding(text: string): Promise<number[]> {
        const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    }

    // NEW: RAG Search - Find relevant products
    async findRelevantContext(query: string, shopId?: number, limit = 5) {
        const embedding = await this.generateEmbedding(query);
        
        const { data, error } = await this.supabase.rpc('match_products', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: limit,
            p_shop_id: shopId
        });

        if (error) {
            this.logger.error(`[RAG] Search error: ${error.message}`);
            return [];
        }
        return data;
    }

    private async getQuickStats(shopId?: number) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        let salesQuery = this.supabase.from('sales').select('total_amount');
        if (shopId) salesQuery = salesQuery.eq('shop_id', shopId);
        const { data: sales } = await salesQuery.gte('created_at', startDate.toISOString());

        return {
            last_30_days_revenue: sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0,
            sales_count: sales?.length || 0,
            currency: 'FCFA'
        };
    }

    private async getMarketingContext(shopId?: number) {
        const { data } = await this.supabase
            .from('site_settings')
            .select('content')
            .eq('name', 'lolly_shop_config')
            .maybeSingle();
        return data?.content || {};
    }

    private async getCompetitiveIntelligence() {
        return {
            competitors: ["Marchés locaux (Dakar)", "Instagram Sellers", "Jumia (Tech)"],
            advantages: ["Qualité certifiée", "Livraison Express", "Service Client WhatsApp"]
        };
    }

    async generatePromoBanner() {
        if (!this.model) throw new Error('AI Service not initialized.');

        const [stats, topProducts, marketing] = await Promise.all([
            this.getQuickStats(),
            this.getTopProducts(10),
            this.getMarketingContext()
        ]);

        const prompt = `
            Tu es le Responsable Marketing de LOLLY SHOP (Sénégal). 
            Tu dois générer UN SEUL slogan percutant pour le bandeau défilant du site e-commerce.
            
            DONNÉES ACTUELLES :
            - Top Ventes : ${JSON.stringify(topProducts.map(p => p.name))}
            - Stats 30j : ${stats.sales_count} ventes.
            - Contexte : Nous sommes en Février (Ambiance Post-Saint-Valentin / Pré-Ramadan).
            
            RÈGLES :
            1. Un seul slogan court (max 15 mots).
            2. Écris tout en MAJUSCULES.
            3. Inclus des emojis pertinents (étincelles, sac, tech).
            4. Le ton doit être PREMIUM, INCITATIF et SÉNÉGALAIS (Dakar Style).
            5. Varie entre Luxya (Beauté) et Homtek (Tech).
            
            EXEMPLES :
            - NOUVEL ARRIVAGE LUXYA : L'EXCELLENCE DE LA BEAUTÉ À DAKAR ⚡
            - HOMTEK TECH : LES DERNIÈRES INNOVATIONS AU MEILLEUR PRIX 💻
            
            RÉPONSE (SLOGAN UNIQUEMENT) :
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const slogan = response.text().trim().replace(/\"/g, '');

            // Update Supabase site_settings using ADMIN client to bypass RLS
            const updatedContent = { ...marketing, promo_banner: slogan };
            const { error: supabaseError } = await this.supabaseService.getAdminClient()
                .from('site_settings')
                .upsert({ 
                    name: 'lolly_shop_config', 
                    content: updatedContent, 
                    updated_at: new Date() 
                }, { onConflict: 'name' });

            if (supabaseError) {
                this.logger.error(`[AI Banner] Supabase Update Error: ${supabaseError.message}`);
                throw new Error(`Erreur Supabase: ${supabaseError.message}`);
            }

            this.logger.log(`[AI Banner] Successfully updated slogan: ${slogan}`);
            return { slogan };
        } catch (error) {
            this.logger.error(`[AI Banner] Error: ${error.message}`);
            throw error;
        }
    }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) {
            throw new Error('AI Service not initialized.');
        }

        const sessionKey = shopId ? `shop_${shopId}` : 'global';
        
        try {
            // 1. Context Gathering (RAG + Analytics)
            const [relevantProducts, stats, topCustomers, debtStatus, marketing, competition] = await Promise.all([
                this.findRelevantContext(userQuestion, shopId),
                this.getQuickStats(shopId),
                this.getTopCustomers(5, shopId),
                this.getDebtsOverview(shopId),
                this.getMarketingContext(shopId),
                this.getCompetitiveIntelligence()
            ]);

            const systemContext = `
                Tu es l'Intelligence de Croissance LOLLY. Tu as accès aux ventes, dépenses, clients, marketing et tendances.
                
                CONTEXTE RÉEL :
                - PRODUITS PERTINENTS (RAG) : ${JSON.stringify(relevantProducts)}
                - STATS 30J : ${JSON.stringify(stats)}
                - TOP CLIENTS : ${JSON.stringify(topCustomers)}
                - DETTES : ${JSON.stringify(debtStatus)}
                - MARKETING : ${JSON.stringify(marketing)}
                - CONCURRENCE : ${JSON.stringify(competition)}
                
                DONNÉES MARCHÉ (SÉNÉGAL/DAKAR) :
                - Tendances : Forte demande Premium, Digitalisation (Wave/OM).
                - Saisonnalité : Pics pendant les fêtes (Tabaski, Korité, Fin d'année).
                
                MISSION :
                - Sois EXTRÊMEMENT CONCIS. 
                - Analyse la corrélation Marketing/Ventes.
                - Propose des actions pour dépasser la concurrence.
                
                STYLE : Incisif, expert.
            `;

            // 2. Chat Logic (Truncated History for Token Efficiency)
            let chat = this.chatSessions.get(sessionKey);
            if (!chat) {
                const history = [
                    { role: 'user', parts: [{ text: "Initialisation LOLLY Intelligence." }] },
                    { role: 'model', parts: [{ text: "Système prêt. Analyse en cours." }] }
                ];
                chat = this.model.startChat({ history });
                this.chatSessions.set(sessionKey, chat);
            }

            // 3. Persistent History (Background)
            this.supabase.from('ai_chat_history').insert({
                session_key: sessionKey,
                role: 'user',
                content: userQuestion
            }).then();

            const result = await chat.sendMessage(`CONTEXTE MIS À JOUR : ${systemContext}\n\nQUESTION : ${userQuestion}`);
            const response = await result.response;
            const finalAnswer = response.text();

            this.supabase.from('ai_chat_history').insert({
                session_key: sessionKey,
                role: 'model',
                content: finalAnswer
            }).then();

            return finalAnswer;
        } catch (error) {
            this.logger.error(`[AI] Error: ${error.message}`);
            this.chatSessions.delete(sessionKey);
            throw error;
        }
    }

    private async getTopCustomers(limit: number, shopId?: number) {
        let query = this.supabase.from('sales').select('customer_name, total_amount');
        if (shopId) query = query.eq('shop_id', shopId);
        
        const { data } = await query;
        if (!data) return [];

        const aggregated = data.reduce((acc, s) => {
            const name = s.customer_name || 'Anonyme';
            acc[name] = (acc[name] || 0) + Number(s.total_amount);
            return acc;
        }, {});

        return Object.entries(aggregated)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, limit)
            .map(([name, total]) => ({ name, total_revenue: total }));
    }

    private async getDebtsOverview(shopId?: number) {
        let query = this.supabase.from('debts').select('amount, remaining_amount, status');
        // Debts aren't directly shop_id linked in some schemas, verify if needed.
        // Assuming global for now or linked via customers
        const { data } = await query;
        if (!data) return { total: 0, pending: 0 };

        return {
            total_debt: data.reduce((sum, d) => sum + Number(d.amount), 0),
            remaining_to_collect: data.reduce((sum, d) => sum + Number(d.remaining_amount), 0),
            count: data.length
        };
    }

    async suggestProductPhoto(productName: string) {
        this.logger.log(`[AI] Searching real web photos for: ${productName}`);
        
        // Clean and prepare keywords from product name
        const cleanName = productName.toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .split(' ')
            .filter(word => word.length > 2)
            .join(',');

        // We use LoremFlickr which is a reliable source for professional creative-commons images from the net
        // We generate 4 different URLs by adding different search indexes/tags
        const urls = [
            `https://loremflickr.com/800/800/${cleanName}?lock=1`,
            `https://loremflickr.com/800/800/${cleanName}?lock=2`,
            `https://loremflickr.com/800/800/${cleanName}?lock=3`,
            `https://loremflickr.com/800/800/${cleanName}?lock=4`
        ];

        // Ensure we have at least some results by adding broader keywords if needed
        return { urls };
    }

    private async getDetailedSalesAnalytics(days: number, shopId?: number) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        let query = this.supabase.from('sales').select('total_amount, created_at, payment_method, type').gte('created_at', startDate.toISOString());
        if (shopId) query = query.eq('shop_id', shopId);
        
        const { data: sales } = await query;
        if (!sales) return { message: "Aucune vente trouvée" };

        const total = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const count = sales.length;
        const avg = count > 0 ? total / count : 0;

        return {
            period_days: days,
            total_revenue: total,
            sales_count: count,
            average_sale: avg,
            payment_methods: sales.reduce((acc, s) => {
                acc[s.payment_method] = (acc[s.payment_method] || 0) + 1;
                return acc;
            }, {})
        };
    }

    private async getTopProducts(limit: number, shopId?: number) {
        try {
            const { data: items, error } = await this.supabase
                .from('sale_items')
                .select('quantity, price, products!inner(name, shop_id)');
            
            if (error || !items || items.length === 0) return [];

            const filtered = shopId ? items.filter((i: any) => i.products?.shop_id === shopId) : items;
            if (filtered.length === 0) return [];

            const aggregated = filtered.reduce((acc, i: any) => {
                const name = i.products?.name || 'Produit inconnu';
                if (!acc[name]) acc[name] = { name, quantity: 0, revenue: 0 };
                acc[name].quantity += i.quantity;
                acc[name].revenue += (i.quantity * i.price);
                return acc;
            }, {});

            return Object.values(aggregated)
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, limit);
        } catch (e) {
            this.logger.warn(`[AI] Failed to get top products, proceeding with empty list.`);
            return [];
        }
    }

    private async getFinancialHealth(days: number, shopId?: number) {
        const sales = await this.getDetailedSalesAnalytics(days, shopId);
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        let expQuery = this.supabase.from('expenses').select('amount').gte('date', startDate.toISOString());
        if (shopId) expQuery = expQuery.eq('shop_id', shopId);
        const { data: expenses } = await expQuery;

        const totalExp = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const revenue = (sales as any).total_revenue || 0;

        return {
            period: `${days} jours`,
            revenue,
            expenses: totalExp,
            net_profit: revenue - totalExp,
            margin_percent: revenue > 0 ? ((revenue - totalExp) / revenue) * 100 : 0
        };
    }

    private async getDetailedExpenseAnalytics(days: number, shopId?: number) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        let query = this.supabase.from('expenses')
            .select('*')
            .gte('date', startDate.toISOString());
        
        if (shopId) query = query.eq('shop_id', shopId);
        
        const { data: expenses } = await query;
        if (!expenses) return { message: "Aucune dépense trouvée" };

        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const byCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
            return acc;
        }, {});

        const recurring = expenses.filter(e => e.is_recurring);
        const totalRecurring = recurring.reduce((sum, e) => sum + Number(e.amount), 0);

        return {
            period_days: days,
            total_expenses: total,
            total_recurring: totalRecurring,
            categories_breakdown: byCategory,
            recurring_count: recurring.length,
            top_expenses: expenses.sort((a, b) => b.amount - a.amount).slice(0, 5).map(e => ({ desc: e.description, amount: e.amount, date: e.date }))
        };
    }

    private async getDebts(status?: string, shopId?: number) {
        let query = this.supabase.from('debts').select('*, customers(name, phone)');
        if (status) query = query.eq('status', status);
        const { data } = await query;
        return data;
    }

    private async getConversionAnalytics(days: number, shopId?: number) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // 1. Get Views
        let viewsQuery = this.supabase.from('product_views').select('product_id').gte('created_at', startDate.toISOString());
        if (shopId) viewsQuery = viewsQuery.eq('shop_id', shopId);
        const { data: views } = await viewsQuery;

        // 2. Get Sales (Items)
        let salesQuery = this.supabase
            .from('sale_items')
            .select('product_id, quantity, products!inner(name, price)')
            .gte('created_at', startDate.toISOString());
        
        const { data: salesItems } = await salesQuery;

        const viewCounts = (views || []).reduce((acc, v) => {
            acc[v.product_id] = (acc[v.product_id] || 0) + 1;
            return acc;
        }, {});

        const saleCounts = (salesItems || []).reduce((acc, s: any) => {
            if (s.product_id && s.products) {
                const product = Array.isArray(s.products) ? s.products[0] : s.products;
                if (!acc[s.product_id]) {
                    acc[s.product_id] = { 
                        name: product?.name || 'Produit inconnu', 
                        qty: 0, 
                        price: product?.price || 0 
                    };
                }
                acc[s.product_id].qty += s.quantity;
            }
            return acc;
        }, {});

        // 3. Merge and Analyze
        const analysis = Object.keys(viewCounts).map(pid => {
            const vCount = viewCounts[pid];
            const sInfo = saleCounts[pid] || { name: 'Inconnu', qty: 0, price: 0 };
            const conversionRate = vCount > 0 ? (sInfo.qty / vCount) * 100 : 0;

            return {
                id: pid,
                name: sInfo.name,
                views: vCount,
                sales: sInfo.qty,
                conversion_rate: conversionRate.toFixed(1) + '%',
                recommendation: conversionRate < 5 ? 'Alerte : Très vu mais peu acheté. Vérifiez le prix ou la description.' : 
                               (conversionRate > 20 ? 'Excellent : Produit star, augmentez les stocks.' : 'Performance normale.')
            };
        });

        return analysis.sort((a, b) => b.views - a.views).slice(0, 10);
    }

    private async getBusinessContext(shopId?: number) {
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

            // Query ALL products with details
            let productsQuery = this.supabase.from('products').select('id, name, stock, price, cost_price, min_stock, category, type');
            if (shopId) productsQuery = productsQuery.eq('shop_id', shopId);
            const { data: products } = await productsQuery;

            // Group products by category for a clear overview
            const inventoryOverview = products?.reduce((acc, p) => {
                const cat = p.category || 'Général';
                if (!acc[cat]) acc[cat] = { count: 0, stock_total: 0, low_stock: [] };
                acc[cat].count++;
                acc[cat].stock_total += p.stock;
                if (p.stock <= (p.min_stock || 2)) acc[cat].low_stock.push(p.name);
                return acc;
            }, {});

            return {
                period: 'Derniers 30 jours (Résumé rapide)',
                inventory: {
                    total_products: products?.length || 0,
                    detailed_inventory: inventoryOverview,
                    all_products_list: products?.map(p => `[ID: ${p.id}] ${p.name} - Stock: ${p.stock} - Prix: ${p.price} FCFA`)
                },
                shop_context: shopId ? `Boutique ID ${shopId}` : 'Vue Globale (Luxya & Homtek)'
            };
        } catch (error) {
            this.logger.error(`[AI] Error in getBusinessContext: ${error.message}`);
            throw error;
        }
    }
}
