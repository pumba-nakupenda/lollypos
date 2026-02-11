
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
            this.logger.log('AI Expert Accountant Mode Active.');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            const [salesRes, productsRes, expensesRes, debtsRes] = await Promise.all([
                this.admin.from('sales').select('*'),
                this.admin.from('products').select('*'),
                this.admin.from('expenses').select('*'),
                this.admin.from('debts').select('*')
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];

            // --- CALCULS FINANCIERS AVANCÉS ---
            const caTotal = allSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0);
            const totalDepenses = allExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            const valeurStock = allProducts.reduce((sum: number, p: any) => sum + (p.stock * p.price), 0);
            const coutStock = allProducts.reduce((sum: number, p: any) => sum + (p.stock * (p.cost_price || 0)), 0);
            const dettesClients = allDebts.filter((d:any) => d.type === 'receivable').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);
            const dettesFournisseurs = allDebts.filter((d:any) => d.type === 'debt').reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0);

            // Formules
            const tvaCollectee = caTotal * 0.18; // TVA 18%
            const margeBrute = caTotal - coutStock;
            const bfr = (valeurStock + dettesClients) - dettesFournisseurs;
            const chargesFixes = totalDepenses;
            const tauxMarge = caTotal > 0 ? (margeBrute / caTotal) : 0;
            const seuilRentabilite = tauxMarge > 0 ? (chargesFixes / tauxMarge) : 0;

            const context = {
                ca_ttc: caTotal,
                tva_due: tvaCollectee,
                ca_ht: caTotal - tvaCollectee,
                charges_totales: totalDepenses,
                patrimoine: {
                    valeur_stock: valeurStock,
                    dettes_clients: dettesClients,
                    dettes_fournisseurs: dettesFournisseurs,
                    bfr: bfr // Besoin en Fond de Roulement
                },
                rentabilite: {
                    marge_brute: margeBrute,
                    seuil_rentabilite: seuilRentabilite,
                    profit_net: caTotal - totalDepenses
                }
            };

            const systemInstruction = `
                Tu es l'EXPERT-COMPTABLE et ANALYSTE FINANCIER de LOLLY SAS.
                FORMULES QUE TU DOIS UTILISER :
                - TVA : 18% du CA TTC.
                - BFR (Besoin en Fond de Roulement) : (Stock + Dettes Clients) - Dettes Fournisseurs.
                - Seuil de Rentabilité (SR) : Charges Fixes / Taux de Marge.
                - Profit Net : CA - Toutes les dépenses.
                
                DONNÉES COMPTABLES : ${JSON.stringify(context)}
                
                MISSION : Analyse la santé financière. Si le BFR est trop haut, alerte le patron. Si le CA est en dessous du SR, alerte-le.
                Réponds avec précision et expertise.
            `;

            let chat = this.chatSessions.get(shopId ? `shop_${shopId}` : 'global');
            if (!chat) {
                chat = this.model.startChat({ history: [] });
                this.chatSessions.set(shopId ? `shop_${shopId}` : 'global', chat);
            }

            const result = await chat.sendMessage(`${systemInstruction}\n\nQUESTION DU PATRON : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            return `Erreur comptable : ${error.message}`;
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
