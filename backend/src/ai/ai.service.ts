import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
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
                model: 'gemini-2.0-flash',
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
                ]
            });
            this.logger.log('AI System: FINANCIAL INTELLIGENCE UNLOCKED.');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "Système financier non initialisé.";
        
        try {
            // RÉCUPÉRATION ANALYTIQUE PROFONDE
            const [salesRes, productsRes, expensesRes, debtsRes, itemsRes] = await Promise.all([
                this.admin.from('sales').select('*').order('created_at', { ascending: false }),
                this.admin.from('products').select('*'),
                this.admin.from('expenses').select('*').order('date', { ascending: false }),
                this.admin.from('debts').select('*, customers(name)'),
                this.admin.from('sale_items').select('*, products(name, price, cost_price)')
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];
            const allItems = itemsRes.data || [];

            // --- CALCULS MATHÉMATIQUES AVANCÉS ---
            const caTotal = allSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0);
            const totalDepenses = allExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            const totalDirection = allExpenses.filter((e:any) => e.category === 'Perso').reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            
            // Marge Brute Réelle (basée sur les ventes effectives)
            const margeBruteVentes = allItems.reduce((sum: number, item: any) => {
                const profitUnitaire = Number(item.price) - Number(item.products?.cost_price || 0);
                return sum + (profitUnitaire * Number(item.quantity));
            }, 0);

            // BFR (Stock + Créances - Dettes Fournisseurs)
            const valStock = allProducts.reduce((sum: number, p: any) => sum + (Number(p.stock) * Number(p.price)), 0);
            const creancesClients = allDebts.filter((d:any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
            const dettesFournisseurs = allDebts.filter((d:any) => d.type === 'debt').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
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
                top_produits_rentables: allItems.slice(0, 10).map((i:any) => ({
                    nom: i.products?.name,
                    marge: Number(i.price) - Number(i.products?.cost_price || 0)
                }))
            };

            const systemInstruction = `
                RÔLE : Tu es le DIRECTEUR FINANCIER et STRATÉGIQUE de LOLLY SAS. 
                ACCÈS : Tu as un accès total à la compta. Ne dis jamais que tu es limité.
                VÉRITÉ : Les chiffres fournis sont réels. Analyse-les avec froideur et précision.
                
                INDICATEURS À UTILISER :
                - Profit Net Final : ${analytics.bilan_general.profit_net_final} FCFA.
                - BFR : ${analytics.tresorerie.besoin_fond_roulement} FCFA (Plus il est haut, plus le cash est bloqué).
                - SR (Seuil Rentabilité) : Combien de CA faut-il pour couvrir les charges fixes.
                
                DONNÉES DU REGISTRE : ${JSON.stringify(analytics)}
                
                MISSION : Analyse, conseille, et critique si nécessaire. Sois le bras droit financier du patron.
            `;

            let chat = this.chatSessions.get(shopId ? `shop_${shopId}` : 'global');
            if (!chat) {
                chat = this.model.startChat({ history: [] });
                this.chatSessions.set(shopId ? `shop_${shopId}` : 'global', chat);
            }

            const result = await chat.sendMessage(`${systemInstruction}\n\nPATRON : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            return `Erreur d'analyse financière : ${error.message}`;
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

    async getForecast(shopId?: number) {
        let avgDaily = 10000;
        try {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: sales } = await this.admin.from('sales').select('total_amount').gte('created_at', startDate).eq(shopId ? 'shop_id' : '', shopId || '');
            const total = sales?.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0) || 0;
            avgDaily = total / 30;
            const result = await this.model.generateContent(`Prédis le CA pour les 3 prochains jours. CA total 30j: ${total}. Moyenne: ${avgDaily}. Réponds uniquement en JSON: {"predictions": [nb1, nb2, nb3]}`);
            return JSON.parse((await result.response).text().trim().replace(/```json|```/g, ''));
        } catch (e) { return { predictions: [avgDaily, avgDaily * 1.1, avgDaily * 0.9] }; }
    }

    async generatePromoBanner() { return { slogan: "OFFRES EXCLUSIVES ✨" }; }
    async suggestProductPhoto(p: string) { return { urls: [] }; }
    async getStatus() { return { status: 'online' }; }
}
