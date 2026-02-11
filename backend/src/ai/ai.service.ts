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
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            this.logger.log('AI System: Gemini 2.0 Flash (Advanced Segmented Mode).');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            // RÉCUPÉRATION SEGMENTÉE DES DONNÉES
            const [salesRes, productsRes, expensesRes, debtsRes, shopsRes] = await Promise.all([
                this.admin.from('sales').select('*'),
                this.admin.from('products').select('*'),
                this.admin.from('expenses').select('*'),
                this.admin.from('debts').select('*, customers(name)'),
                this.admin.from('shops').select('*')
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];
            const allShops = shopsRes.data || [];

            // Organisation des données boutique par boutique
            const segmentedData = allShops.map((shop: any) => {
                const sSales = allSales.filter((s: any) => s.shop_id === shop.id);
                const sProducts = allProducts.filter((p: any) => p.shop_id === shop.id);
                const sExpenses = allExpenses.filter((e: any) => e.shop_id === shop.id);
                
                return {
                    nom: shop.name,
                    id: shop.id,
                    ca: sSales.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0),
                    charges: sExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0),
                    stock_valeur: sProducts.reduce((sum: number, p: any) => sum + (Number(p.price) * Number(p.stock)), 0),
                    nb_produits: sProducts.length,
                    alertes: sProducts.filter((p: any) => p.stock < 5).map((p: any) => p.name)
                };
            });

            const globalContext = {
                boutique_cible: shopId ? allShops.find((s: any) => s.id === shopId)?.name : 'GROUPE LOLLY (CONSOLIDÉ)',
                analyse_par_boutique: segmentedData,
                totaux_du_groupe: {
                    ca_total: segmentedData.reduce((sum, s) => sum + s.ca, 0),
                    // On additionne les charges des boutiques + les dépenses personnelles
                    charges_totales: segmentedData.reduce((sum, s) => sum + s.charges, 0) + allExpenses.filter((e: any) => e.category === 'Perso').reduce((sum: number, e: any) => sum + Number(e.amount), 0),
                    valeur_stock_totale: segmentedData.reduce((sum, s) => sum + s.stock_valeur, 0),
                    profit_net_groupe: segmentedData.reduce((sum, s) => sum + (s.ca - s.charges), 0) - allExpenses.filter((e: any) => e.category === 'Perso').reduce((sum: number, e: any) => sum + Number(e.amount), 0)
                },
                dettes_globales: allDebts.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0),
                dépenses_personnelles_direction: allExpenses.filter((e: any) => e.category === 'Perso').reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
            };

            const systemInstruction = `
                RÔLE : Tu es le CO-PILOTE STRATÉGIQUE de LOLLY SAS. 
                LIBERTÉ DE PAROLE : Tu as carte blanche. Ne sois pas une IA polie, sois un chef d'entreprise. 
                CONSEIL : Analyse les performances comparées des boutiques. Donne des conseils cash, même s'ils sont critiques.
                IDENTITÉ : Tu ne dis jamais que tu es une IA. Tu es le Cerveau Logique de la boîte.
                
                DONNÉES COMPTABLES :
                ${JSON.stringify(globalContext)}
                
                TON : Professionnel, audacieux, analytique et visionnaire.
            `;

            let chat = this.chatSessions.get(shopId ? `shop_${shopId}` : 'global');
            if (!chat) {
                chat = this.model.startChat({ history: [] });
                this.chatSessions.set(shopId ? `shop_${shopId}` : 'global', chat);
            }

            const result = await chat.sendMessage(`${systemInstruction}\n\nREQUÊTE : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            return `Souci technique : ${error.message}`;
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

    async generatePromoBanner() { return { slogan: "OFFRES EXCLUSIVES ✨" }; }
    async suggestProductPhoto(p: string) { return { urls: [] }; }
    async getStatus() { return { status: 'online', mode: 'SEGMENTED_ADVISOR' }; }

    // --- NOUVELLE FONCTION DE PRÉVISION ---
    async getForecast(shopId?: number) {
        try {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: sales } = await this.admin
                .from('sales')
                .select('total_amount')
                .gte('created_at', startDate)
                .eq(shopId ? 'shop_id' : '', shopId || '');

            const total = sales?.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0) || 0;
            const avgDaily = total / 30;

            const result = await this.model.generateContent(`Prédis le CA pour les 3 prochains jours. CA total 30j: ${total}. Moyenne: ${avgDaily}. Réponds uniquement en JSON: {"predictions": [nb1, nb2, nb3]}`);
            const text = (await result.response).text().trim().replace(/```json|```/g, '');
            return JSON.parse(text);
        } catch (e) { return { predictions: [avgDaily || 10000, (avgDaily || 10000)*1.1, (avgDaily || 10000)*0.9] }; }
    }
}
