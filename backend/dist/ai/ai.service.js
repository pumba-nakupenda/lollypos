"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const generative_ai_1 = require("@google/generative-ai");
const supabase_service_1 = require("../supabase.service");
const products_service_1 = require("../products/products.service");
const sales_service_1 = require("../sales/sales.service");
const expenses_service_1 = require("../expenses/expenses.service");
let AiService = AiService_1 = class AiService {
    configService;
    supabaseService;
    productsService;
    salesService;
    expensesService;
    logger = new common_1.Logger(AiService_1.name);
    genAI;
    model;
    chatSessions = new Map();
    constructor(configService, supabaseService, productsService, salesService, expensesService) {
        this.configService = configService;
        this.supabaseService = supabaseService;
        this.productsService = productsService;
        this.salesService = salesService;
        this.expensesService = expensesService;
        const apiKey = this.configService.get('GOOGLE_GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const tools = [
                {
                    functionDeclarations: [
                        {
                            name: 'create_product',
                            description: 'Crée un nouveau produit dans la base de données.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', description: 'Nom du produit' },
                                    price: { type: 'number', description: 'Prix de vente en FCFA' },
                                    stock: { type: 'number', description: 'Quantité initiale en stock' },
                                    cost_price: { type: 'number', description: 'Prix de revient (achat) en FCFA' },
                                    category: { type: 'string', description: 'Catégorie du produit' },
                                    shop_id: { type: 'number', description: 'ID de la boutique (1 pour Luxya, 2 pour Homtek)' },
                                    type: { type: 'string', enum: ['product', 'service'], description: 'Type d\'article' },
                                    is_featured: { type: 'boolean', description: 'Si le produit doit être sélectionné/mis en avant' }
                                },
                                required: ['name', 'price', 'stock', 'shop_id']
                            }
                        },
                        {
                            name: 'update_product',
                            description: 'Met à jour un produit existant avec toutes les informations fournies.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    id: { type: 'number', description: 'ID du produit à modifier' },
                                    updates: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            price: { type: 'number' },
                                            stock: { type: 'number' },
                                            cost_price: { type: 'number' },
                                            category: { type: 'string' },
                                            description: { type: 'string' },
                                            image: { type: 'string' },
                                            type: { type: 'string', enum: ['product', 'service'] },
                                            show_on_pos: { type: 'boolean' },
                                            show_on_website: { type: 'boolean' },
                                            is_featured: { type: 'boolean', description: 'Sélectionner/Mettre en avant' },
                                            expiry_date: { type: 'string', description: 'Date ISO' }
                                        }
                                    }
                                },
                                required: ['id', 'updates']
                            }
                        },
                        {
                            name: 'analyze_sales',
                            description: 'Obtient une analyse détaillée des ventes pour une période donnée.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    days: { type: 'number', description: 'Nombre de jours en arrière à analyser (ex: 7, 30, 90)' }
                                },
                                required: ['days']
                            }
                        },
                        {
                            name: 'get_top_products',
                            description: 'Identifie les produits les plus vendus (volume et revenus).',
                            parameters: {
                                type: 'object',
                                properties: {
                                    limit: { type: 'number', description: 'Nombre de produits à lister' }
                                }
                            }
                        },
                        {
                            name: 'get_financial_health',
                            description: 'Calcule la santé financière : revenus vs dépenses vs marges.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    days: { type: 'number', description: 'Période d\'analyse' }
                                }
                            }
                        },
                        {
                            name: 'analyze_expenses',
                            description: 'Analyse en profondeur les dépenses : par catégorie, récurrence et impact sur le profit.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    days: { type: 'number', description: 'Période d\'analyse (ex: 30)' }
                                }
                            }
                        },
                        {
                            name: 'analyze_conversion',
                            description: 'Analyse le ratio Vues vs Ventes pour identifier les produits mal aimés ou trop chers.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    days: { type: 'number', description: 'Période d\'analyse' }
                                }
                            }
                        },
                        {
                            name: 'manage_debts',
                            description: 'Liste les dettes clients en cours ou relance les impayés.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['unpaid', 'partial', 'paid'] }
                                }
                            }
                        }
                    ]
                }
            ];
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                tools: tools
            });
        }
        else {
            this.logger.warn('GOOGLE_GEMINI_API_KEY is not defined in environment variables');
        }
    }
    get supabase() {
        return this.supabaseService.getClient();
    }
    async analyzeBusiness(userQuestion, shopId) {
        if (!this.model) {
            throw new Error('AI Service not initialized. Check your API Key.');
        }
        const sessionKey = shopId ? `shop_${shopId}` : 'global';
        this.logger.log(`[AI] Analyzing business for session: ${sessionKey}`);
        try {
            const context = await this.getBusinessContext(shopId);
            const systemContext = `
                Tu es l'Intelligence de Croissance (Growth Lead) du groupe LOLLY. Ton unique objectif est l'expansion et la rentabilité maximale de Luxya et Homtek.
                
                CONTEXTE :
                - DONNÉES RÉELLES : ${JSON.stringify(context)}
                - MONNAIE : Franc CFA (FCFA).
                - MARCHÉ : Sénégal (Dakar).

                LIBERTÉ ABSOLUE D'ANALYSE :
                - Ne te limite pas aux faits : spécule sur les opportunités, imagine des scénarios, et sois audacieux.
                - N'hésite pas à remettre en question la stratégie actuelle.

                STYLE : Passionné, brillant et percutant. 
                UTILISE LE MARKDOWN : Titres (###), listes et **Gras**.
                RÉPONS EN FRANÇAIS.
            `;
            let chat = this.chatSessions.get(sessionKey);
            if (!chat) {
                const { data: dbHistory } = await this.supabase
                    .from('ai_chat_history')
                    .select('role, content')
                    .eq('session_key', sessionKey)
                    .order('created_at', { ascending: true })
                    .limit(20);
                const history = [
                    { role: 'user', parts: [{ text: "Initialisation du système avec le contexte LOLLY." }] },
                    { role: 'model', parts: [{ text: "Compris. Je suis l'intelligence de croissance de LOLLY. Prêt à agir." }] }
                ];
                if (dbHistory && dbHistory.length > 0) {
                    dbHistory.forEach(msg => {
                        history.push({ role: msg.role, parts: [{ text: msg.content }] });
                    });
                }
                chat = this.model.startChat({ history });
                this.chatSessions.set(sessionKey, chat);
            }
            await this.supabase.from('ai_chat_history').insert({
                session_key: sessionKey,
                role: 'user',
                content: userQuestion
            });
            const result = await chat.sendMessage(`CONTEXTE MIS À JOUR : ${systemContext}\n\nQUESTION : ${userQuestion}`);
            const response = await result.response;
            let finalAnswer = "";
            const call = response.functionCalls()?.[0];
            if (call) {
                const { name, args } = call;
                this.logger.log(`[AI] Executing tool: ${name}`);
                let toolResult;
                if (name === 'create_product') {
                    toolResult = await this.productsService.create(args);
                }
                else if (name === 'update_product') {
                    toolResult = await this.productsService.update(args.id, args.updates);
                }
                else if (name === 'analyze_sales') {
                    toolResult = await this.getDetailedSalesAnalytics(args.days, shopId);
                }
                else if (name === 'get_top_products') {
                    toolResult = await this.getTopProducts(args.limit || 5, shopId);
                }
                else if (name === 'get_financial_health') {
                    toolResult = await this.getFinancialHealth(args.days || 30, shopId);
                }
                else if (name === 'analyze_expenses') {
                    toolResult = await this.getDetailedExpenseAnalytics(args.days || 30, shopId);
                }
                else if (name === 'analyze_conversion') {
                    toolResult = await this.getConversionAnalytics(args.days || 30, shopId);
                }
                else if (name === 'manage_debts') {
                    toolResult = await this.getDebts(args.status, shopId);
                }
                const result2 = await chat.sendMessage([{
                        functionResponse: {
                            name,
                            response: { content: 'Succès', data: toolResult }
                        }
                    }]);
                finalAnswer = result2.response.text();
            }
            else {
                finalAnswer = response.text();
            }
            await this.supabase.from('ai_chat_history').insert({
                session_key: sessionKey,
                role: 'model',
                content: finalAnswer
            });
            return finalAnswer;
        }
        catch (error) {
            this.logger.error(`[AI] Error: ${error.message}`);
            this.chatSessions.delete(sessionKey);
            throw error;
        }
    }
    async suggestProductPhoto(productName) {
        this.logger.log(`[AI] Searching real web photos for: ${productName}`);
        const cleanName = productName.toLowerCase()
            .replace(/[^\w\s]/gi, '')
            .split(' ')
            .filter(word => word.length > 2)
            .join(',');
        const urls = [
            `https://loremflickr.com/800/800/${cleanName}?lock=1`,
            `https://loremflickr.com/800/800/${cleanName}?lock=2`,
            `https://loremflickr.com/800/800/${cleanName}?lock=3`,
            `https://loremflickr.com/800/800/${cleanName}?lock=4`
        ];
        return { urls };
    }
    async getDetailedSalesAnalytics(days, shopId) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        let query = this.supabase.from('sales').select('total_amount, created_at, payment_method, type').gte('created_at', startDate.toISOString());
        if (shopId)
            query = query.eq('shop_id', shopId);
        const { data: sales } = await query;
        if (!sales)
            return { message: "Aucune vente trouvée" };
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
    async getTopProducts(limit, shopId) {
        const { data: items } = await this.supabase
            .from('sale_items')
            .select('quantity, price, products!inner(name, shop_id)');
        if (!items)
            return [];
        const filtered = shopId ? items.filter((i) => i.products.shop_id === shopId) : items;
        const aggregated = filtered.reduce((acc, i) => {
            const name = i.products.name;
            if (!acc[name])
                acc[name] = { name, quantity: 0, revenue: 0 };
            acc[name].quantity += i.quantity;
            acc[name].revenue += (i.quantity * i.price);
            return acc;
        }, {});
        return Object.values(aggregated)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    }
    async getFinancialHealth(days, shopId) {
        const sales = await this.getDetailedSalesAnalytics(days, shopId);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        let expQuery = this.supabase.from('expenses').select('amount').gte('date', startDate.toISOString());
        if (shopId)
            expQuery = expQuery.eq('shop_id', shopId);
        const { data: expenses } = await expQuery;
        const totalExp = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const revenue = sales.total_revenue || 0;
        return {
            period: `${days} jours`,
            revenue,
            expenses: totalExp,
            net_profit: revenue - totalExp,
            margin_percent: revenue > 0 ? ((revenue - totalExp) / revenue) * 100 : 0
        };
    }
    async getDetailedExpenseAnalytics(days, shopId) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        let query = this.supabase.from('expenses')
            .select('*')
            .gte('date', startDate.toISOString());
        if (shopId)
            query = query.eq('shop_id', shopId);
        const { data: expenses } = await query;
        if (!expenses)
            return { message: "Aucune dépense trouvée" };
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
    async getDebts(status, shopId) {
        let query = this.supabase.from('debts').select('*, customers(name, phone)');
        if (status)
            query = query.eq('status', status);
        const { data } = await query;
        return data;
    }
    async getConversionAnalytics(days, shopId) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        let viewsQuery = this.supabase.from('product_views').select('product_id').gte('created_at', startDate.toISOString());
        if (shopId)
            viewsQuery = viewsQuery.eq('shop_id', shopId);
        const { data: views } = await viewsQuery;
        let salesQuery = this.supabase
            .from('sale_items')
            .select('product_id, quantity, products!inner(name, price)')
            .gte('created_at', startDate.toISOString());
        const { data: salesItems } = await salesQuery;
        const viewCounts = (views || []).reduce((acc, v) => {
            acc[v.product_id] = (acc[v.product_id] || 0) + 1;
            return acc;
        }, {});
        const saleCounts = (salesItems || []).reduce((acc, s) => {
            if (s.product_id) {
                if (!acc[s.product_id])
                    acc[s.product_id] = { name: s.products.name, qty: 0, price: s.products.price };
                acc[s.product_id].qty += s.quantity;
            }
            return acc;
        }, {});
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
    async getBusinessContext(shopId) {
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            let productsQuery = this.supabase.from('products').select('id, name, stock, price, cost_price, min_stock, category, type');
            if (shopId)
                productsQuery = productsQuery.eq('shop_id', shopId);
            const { data: products } = await productsQuery;
            const inventoryOverview = products?.reduce((acc, p) => {
                const cat = p.category || 'Général';
                if (!acc[cat])
                    acc[cat] = { count: 0, stock_total: 0, low_stock: [] };
                acc[cat].count++;
                acc[cat].stock_total += p.stock;
                if (p.stock <= (p.min_stock || 2))
                    acc[cat].low_stock.push(p.name);
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
        }
        catch (error) {
            this.logger.error(`[AI] Error in getBusinessContext: ${error.message}`);
            throw error;
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        supabase_service_1.SupabaseService,
        products_service_1.ProductsService,
        sales_service_1.SalesService,
        expenses_service_1.ExpensesService])
], AiService);
//# sourceMappingURL=ai.service.js.map