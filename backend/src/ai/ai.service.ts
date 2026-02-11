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
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            const [salesRes, productsRes, expensesRes, debtsRes, shopsRes] = await Promise.all([
                this.admin.from('sales').select('*'),
                this.admin.from('products').select('*'),
                this.admin.from('expenses').select('*'),
                this.admin.from('debts').select('*'),
                this.admin.from('shops').select('*')
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];
            const allShops = shopsRes.data || [];

            // --- ANALYSE SEGMENTÉE PAR BOUTIQUE ---
            const shopsStats = allShops.map((shop: any) => {
                const sSales = allSales.filter((s: any) => s.shop_id === shop.id);
                const sProducts = allProducts.filter((p: any) => p.shop_id === shop.id);
                const sExpenses = allExpenses.filter((e: any) => e.shop_id === shop.id);
                const sDebts = allDebts.filter((d: any) => d.shop_id === shop.id);

                const ca = sSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0);
                const exp = sExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
                const valStock = sProducts.reduce((sum: number, p: any) => sum + (p.stock * p.price), 0);
                const costStock = sProducts.reduce((sum: number, p: any) => sum + (p.stock * (p.cost_price || 0)), 0);
                const dClients = sDebts.filter((d:any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
                const dFournisseurs = sDebts.filter((d:any) => d.type === 'debt').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);

                const margeBrute = ca - costStock;
                const tauxMarge = ca > 0 ? (margeBrute / ca) : 0;

                return {
                    nom: shop.name,
                    ca_ttc: ca,
                    tva: ca * 0.18,
                    depenses: exp,
                    profit_net: ca - exp,
                    // --- SEGMENTATION DETTES ---
                    argent_a_recevoir: dClients,
                    argent_a_payer: dFournisseurs,
                    bfr: (valStock + dClients) - dFournisseurs,
                    seuil_rentabilite: tauxMarge > 0 ? (exp / tauxMarge) : 0,
                    alertes_stock: sProducts.filter((p: any) => p.stock < 5).length
                };
            });

            const currentShopName = shopId ? allShops.find((s: any) => s.id === shopId)?.name : "TOUTES LES BOUTIQUES (CONSOLIDÉ)";

            const context = {
                v: "3.1.1_receivable_vs_debt",
                cible: currentShopName,
                analyse_detaillee: shopId ? shopsStats.filter((s: any) => s.nom === currentShopName) : shopsStats,
                totaux_groupe: {
                    ca: shopsStats.reduce((sum, s) => sum + s.ca_ttc, 0),
                    total_creances_clients: shopsStats.reduce((sum, s) => sum + s.argent_a_recevoir, 0),
                    total_dettes_fournisseurs: shopsStats.reduce((sum, s) => sum + s.argent_a_payer, 0)
                }
            };

            const systemInstruction = `
                Tu es l'Intelligence de Pilotage de LOLLY SAS.
                Tu dois être précis sur la différence entre :
                1. CRÉANCES (Argent à recevoir des clients).
                2. DETTES (Argent à payer aux fournisseurs).
                
                Donne ces chiffres boutique par boutique. 
                Si le patron demande pour une boutique, sois spécifique. Si c'est global, fais le bilan du groupe.
            `;

            let chat = this.chatSessions.get(shopId ? `shop_${shopId}` : 'global');
            if (!chat) {
                chat = this.model.startChat({ history: [] });
                this.chatSessions.set(shopId ? `shop_${shopId}` : 'global', chat);
            }

            const result = await chat.sendMessage(`${systemInstruction}\n\nREQUÊTE : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            return `Erreur segmentation : ${error.message}`;
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
