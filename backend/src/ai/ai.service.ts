import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, ChatSession, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SupabaseService } from '../supabase.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;
    private chatSessions: Map<string, { chat: ChatSession; createdAt: number }> = new Map();
    private readonly SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MAX_SESSIONS = 50;

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
                model: 'gemini-2.0-flash',
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
                ]
            }, { apiVersion: 'v1beta' });
            this.logger.log('AI System: FINANCIAL INTELLIGENCE UNLOCKED.');
        }
    }

    private get admin() {
        return this.supabaseService.getAdminClient();
    }

    private cleanupSessions() {
        const now = Date.now();
        for (const [key, session] of this.chatSessions.entries()) {
            if (now - session.createdAt > this.SESSION_TTL_MS) {
                this.chatSessions.delete(key);
            }
        }
        // Hard cap: remove oldest if over limit
        if (this.chatSessions.size > this.MAX_SESSIONS) {
            const oldest = [...this.chatSessions.entries()]
                .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
            if (oldest) this.chatSessions.delete(oldest[0]);
        }
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "Système financier non initialisé.";

        try {
            this.cleanupSessions();

            // Fetch data scoped to the requested shop (or global if no shopId)
            const [salesRes, productsRes, expensesRes, debtsRes, itemsRes] = await Promise.all([
                shopId
                    ? this.admin.from('sales').select('total_amount, paid_amount, created_at').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(500)
                    : this.admin.from('sales').select('total_amount, paid_amount, shop_id, created_at').order('created_at', { ascending: false }).limit(500),
                shopId
                    ? this.admin.from('products').select('name, price, cost_price, stock').eq('shop_id', shopId)
                    : this.admin.from('products').select('name, price, cost_price, stock, shop_id'),
                shopId
                    ? this.admin.from('expenses').select('amount, category, date').eq('shop_id', shopId).order('date', { ascending: false }).limit(200)
                    : this.admin.from('expenses').select('amount, category, date, shop_id').order('date', { ascending: false }).limit(200),
                shopId
                    ? this.admin.from('debts').select('remaining_amount, type').eq('shop_id', shopId)
                    : this.admin.from('debts').select('remaining_amount, type, shop_id'),
                shopId
                    ? this.admin.from('sale_items').select('quantity, price, products(name, price, cost_price)').eq('products.shop_id', shopId).limit(1000)
                    : this.admin.from('sale_items').select('quantity, price, products(name, price, cost_price)').limit(1000),
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];
            const allItems = itemsRes.data || [];

            // --- CALCULS MATHÉMATIQUES AVANCÉS ---
            const caTotal = allSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0);
            const totalDepenses = allExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            const totalDirection = allExpenses.filter((e: any) => e.category === 'Perso').reduce((sum: number, e: any) => sum + Number(e.amount), 0);

            // Marge Brute Réelle (basée sur les ventes effectives)
            const margeBruteVentes = allItems.reduce((sum: number, item: any) => {
                const profitUnitaire = Number(item.price) - Number(item.products?.cost_price || 0);
                return sum + (profitUnitaire * Number(item.quantity));
            }, 0);

            // BFR (Stock + Créances - Dettes Fournisseurs)
            const valStock = allProducts.reduce((sum: number, p: any) => sum + (Number(p.stock) * Number(p.price)), 0);
            const creancesClients = allDebts.filter((d: any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
            const dettesFournisseurs = allDebts.filter((d: any) => d.type === 'debt').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
            const bfr = (valStock + creancesClients) - dettesFournisseurs;

            const analytics = {
                bilan_general: {
                    ca_ttc: caTotal,
                    tva_collectee: caTotal * 0.18,
                    profit_brut: margeBruteVentes,
                    charges_fixes: totalDepenses - totalDirection,
                    charges_direction: totalDirection,
                    profit_net_final: margeBruteVentes - (totalDepenses - totalDirection) - totalDirection
                },
                tresorerie: {
                    cash_immobilise_stock: valStock,
                    argent_dehors_clients: creancesClients,
                    dettes_a_payer: dettesFournisseurs,
                    besoin_fond_roulement: bfr
                },
                top_produits_rentables: allItems.slice(0, 10).map((i: any) => ({
                    nom: i.products?.name,
                    marge: Number(i.price) - Number(i.products?.cost_price || 0)
                }))
            };

            const systemInstruction = `
                RÔLE : Tu es le DIRECTEUR FINANCIER et STRATÉGIQUE de LOLLY SAS. 
                FORMAT DE RÉPONSE : Réponds en FRANÇAIS CLAIR et BIEN PRÉSENTÉ. 
                Utilise du Markdown (gras, listes à puces, titres) pour rendre ton analyse facile à lire.
                INTERDICTION : Ne réponds JAMAIS en format JSON brut. 
                
                VÉRITÉ : Les chiffres fournis sont réels. Analyse-les avec précision.
                
                INDICATEURS À UTILISER :
                - Profit Net Final : ${analytics.bilan_general.profit_net_final} FCFA.
                - BFR : ${analytics.tresorerie.besoin_fond_roulement} FCFA.
                
                DONNÉES DU REGISTRE : ${JSON.stringify(analytics)}
                
                MISSION : Analyse, conseille, et critique si nécessaire. Sois le bras droit du patron.
            `;

            const sessionKey = shopId ? `shop_${shopId}` : 'global';
            let sessionEntry = this.chatSessions.get(sessionKey);
            if (!sessionEntry || Date.now() - sessionEntry.createdAt > this.SESSION_TTL_MS) {
                const chat = this.model.startChat({ history: [] });
                sessionEntry = { chat, createdAt: Date.now() };
                this.chatSessions.set(sessionKey, sessionEntry);
            }

            const result = await sessionEntry.chat.sendMessage(`${systemInstruction}\n\nPATRON : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            this.logger.error(`[AI] analyzeBusiness error: ${error.message}`);
            return "Une erreur est survenue lors de l'analyse financière.";
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const TARGET_DIM = 1536;
        try {
            if (!this.genAI) return new Array(TARGET_DIM).fill(0);
            const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            const values = result.embedding.values;

            if (values.length === TARGET_DIM) return values;

            // Pad or slice to match target dimension
            if (values.length < TARGET_DIM) {
                return [...values, ...new Array(TARGET_DIM - values.length).fill(0)];
            }
            return values.slice(0, TARGET_DIM);
        } catch (e) {
            this.logger.error(`Embedding generation failed: ${e.message}`);
            return new Array(TARGET_DIM).fill(0);
        }
    }

    async getForecast(shopId?: number) {
        let avgDaily = 10000;
        try {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            let query = this.admin.from('sales').select('total_amount').gte('created_at', startDate);
            if (shopId) query = query.eq('shop_id', shopId);
            const { data: sales } = await query;
            const total = sales?.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0) || 0;
            avgDaily = total / 30;
            const result = await this.model.generateContent(`Prédis le CA pour les 3 prochains jours. CA total 30j: ${total}. Moyenne: ${avgDaily}. Réponds uniquement en JSON: {"predictions": [nb1, nb2, nb3]}`);
            try {
                return JSON.parse((await result.response).text().trim().replace(/```json|```/g, ''));
            } catch {
                return { predictions: [avgDaily, avgDaily * 1.1, avgDaily * 0.9] };
            }
        } catch (e) { return { predictions: [avgDaily, avgDaily * 1.1, avgDaily * 0.9] }; }
    }

    // TODO: implement
    async generatePromoBanner() { return { slogan: "OFFRES EXCLUSIVES ✨" }; }

    async generateDescription(productName: string) {
        if (!this.model) return { description: "" };
        try {
            const prompt = `Génère une description marketing luxueuse, courte et captivante pour un produit nommé "${productName}". 
            Le ton doit être professionnel, élégant et adapté à une boutique haut de gamme nommée LOLLY. 
            Utilise environ 3-4 phrases. Réponds directement avec le texte de la description.`;

            const result = await this.model.generateContent(prompt);
            return { description: result.response.text().trim() };
        } catch (error) {
            this.logger.error("AI Description Generation Error", error);
            return { description: "" };
        }
    }

    // TODO: implement
    async suggestProductPhoto(p: string) { return { urls: [] }; }
    async getStatus() { return { status: 'online' }; }
}
