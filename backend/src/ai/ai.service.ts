import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from '../supabase.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;
    private chatSessions: Map<string, any> = new Map();

    constructor(
        private configService: ConfigService,
        private supabaseService: SupabaseService,
        @Inject(forwardRef(() => ProductsService))
        private productsService: ProductsService,
    ) {
        const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ 
                model: 'gemini-3-flash',
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            });
            this.logger.log('AI System: GOD MODE UNLOCKED (Gemini 3).');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            this.logger.log(`[GOD MODE] Analyzing request...`);

            // RÉCUPÉRATION BRUTE DE TOUTES LES DONNÉES (Plus fiable)
            const [salesRes, productsRes, expensesRes, debtsRes, itemsRes] = await Promise.all([
                this.admin.from('sales').select('*').limit(50),
                this.admin.from('products').select('*'),
                this.admin.from('expenses').select('*'),
                this.admin.from('debts').select('*, customers(name)'),
                this.admin.from('sale_items').select('*, products(name)').limit(100)
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];
            const allItems = itemsRes.data || [];

            // Filtrage par shop côté code (plus sûr que SQL dynamique parfois)
            const fSales = shopId ? allSales.filter(s => s.shop_id === shopId) : allSales;
            const fProducts = shopId ? allProducts.filter(p => p.shop_id === shopId) : allProducts;
            const fExpenses = shopId ? allExpenses.filter(e => e.shop_id === shopId) : allExpenses;

            const context = {
                vision: shopId ? `Boutique ${shopId}` : 'Globale',
                statistiques: {
                    ca_total: fSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
                    depenses_pro: fExpenses.filter(e => e.category !== 'Perso').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
                    depenses_direction_type_b: fExpenses.filter(e => e.category === 'Perso').reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
                    dettes_total: allDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
                },
                liste_dettes_detaillees: allDebts.filter(d => d.remaining_amount > 0).map(d => ({
                    client: d.customers?.name || 'Inconnu',
                    du: d.remaining_amount,
                    date: d.created_at
                })),
                liste_depenses_recentes: fExpenses.slice(0, 20).map(e => ({
                    objet: e.description,
                    prix: e.amount,
                    cat: e.category === 'Perso' ? 'DIRECTION_TYPE_B' : e.category
                })),
                inventaire: fProducts.map(p => ({ n: p.name, s: p.stock, p: p.price }))
            };

            const systemInstruction = `
                RÈGLE CRITIQUE : Tu es l'Intelligence de Gestion de LOLLY SAS. 
                Tu as ACCÈS TOTAL aux chiffres. Ne mens jamais en disant que tu n'as pas accès.
                Les dépenses "DIRECTION_TYPE_B" sont les dépenses personnelles du patron. Traite-les avec respect mais analyse leur impact sur le cash.
                
                DONNÉES COMPTABLES :
                ${JSON.stringify(context)}
                
                TON : Expert, bref, sans filtre. Réponds précisément à la question avec ces chiffres.
            `;

            let chat = this.chatSessions.get(shopId ? `shop_${shopId}` : 'global');
            if (!chat) {
                chat = this.model.startChat({ history: [] });
                this.chatSessions.set(shopId ? `shop_${shopId}` : 'global', chat);
            }

            const result = await chat.sendMessage(`${systemInstruction}\n\nQUESTION DU PATRON : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            this.logger.error(`Analysis crash: ${error.message}`);
            return `Erreur technique : ${error.message}`;
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        try {
            if (!this.genAI) return new Array(768).fill(0);
            const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (e) { return new Array(768).fill(0); }
    }

    async generatePromoBanner() {
        try {
            const { data: products } = await this.admin.from('products').select('name, stock').lt('stock', 5).limit(5);
            const result = await this.model.generateContent(`Crée un slogan PREMIUM pour : ${products?.map(p => p.name).join(', ')}`);
            const slogan = (await result.response).text().trim().replace(/\"/g, '');
            const { data } = await this.admin.from('site_settings').select('content').eq('name', 'lolly_shop_config').maybeSingle();
            await this.admin.from('site_settings').upsert({ name: 'lolly_shop_config', content: { ...(data?.content || {}), promo_banner: slogan }, updated_at: new Date() });
            return { slogan };
        } catch (e) { return { slogan: "OFFRES EXCLUSIVES LOLLY ✨" }; }
    }

    async suggestProductPhoto(p: string) { return { urls: [1,2,3,4].map(i => `https://loremflickr.com/800/800/${p.split(' ').join(',')}?lock=${i}`) }; }
    async getStatus() { return { status: 'online', model: 'Gemini 3 Flash', analytical_power: 'MAX' }; }
}
