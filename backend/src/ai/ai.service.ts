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
            this.logger.log('AI System: Gemini 2.0 Flash (Fixed Math Mode).');
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
                this.admin.from('debts').select('*, customers(name)'),
                this.admin.from('shops').select('*')
            ]);

            const allSales = salesRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allProducts = productsRes.data || [];
            const allDebts = debtsRes.data || [];

            // CALCULS SANS DOUBLONS
            // 1. On prend le total ABSOLU de toutes les dépenses enregistrées
            const totalDepensesGlobal = allExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
            
            // 2. On identifie la part de la direction (catégorie 'Perso')
            const totalDirection = allExpenses
                .filter((e: any) => e.category === 'Perso' || e.category === 'Personnel')
                .reduce((sum: number, e: any) => sum + Number(e.amount), 0);

            // 3. Le reste, ce sont les charges d'exploitation pures
            const totalExploitationPro = totalDepensesGlobal - totalDirection;

            const context = {
                v: "3.0.7_fixed_math",
                bilan_groupe: {
                    ca_total: allSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0),
                    total_sorties_argent: totalDepensesGlobal,
                    repartition: {
                        part_direction_perso: totalDirection,
                        part_exploitation_pro: totalExploitationPro
                    },
                    profit_net_final: allSales.reduce((sum: number, s: any) => sum + Number(s.total_amount), 0) - totalDepensesGlobal,
                    dettes_clients: allDebts.reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0)
                },
                detail_boutiques: shopsRes.data?.map((shop: any) => ({
                    nom: shop.name,
                    ca: allSales.filter((s: any) => s.shop_id === shop.id).reduce((sum: number, s: any) => sum + Number(s.total_amount), 0),
                    stock: allProducts.filter((p: any) => p.shop_id === shop.id).reduce((sum: number, p: any) => sum + (p.stock * p.price), 0)
                }))
            };

            const systemInstruction = `
                Tu es l'Intelligence de Pilotage de LOLLY SAS.
                STRUCTURE DES DÉPENSES :
                - Les dépenses de LUXYA et HOMTEK sont purement professionnelles.
                - Les dépenses de l'AGENCE incluent les charges pro ET tes dépenses PERSONNELLES (Direction).
                
                CHIFFRES ACTUELS :
                - Total des dépenses enregistrées : ${totalDepensesGlobal} FCFA.
                - Part de la DIRECTION (Perso) au sein de l'Agence : ${totalDirection} FCFA.
                
                CONSIGNE : Analyse le profit de chaque boutique. Rappelle au patron que ses dépenses perso impactent directement la rentabilité de l'AGENCE.
            `;

            let chat = this.chatSessions.get(shopId ? `shop_${shopId}` : 'global');
            if (!chat) {
                chat = this.model.startChat({ history: [] });
                this.chatSessions.set(shopId ? `shop_${shopId}` : 'global', chat);
            }

            const result = await chat.sendMessage(`${systemInstruction}\n\nREQUÊTE : ${userQuestion}`);
            return result.response.text();

        } catch (error: any) {
            return `Erreur : ${error.message}`;
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
    async getStatus() { return { status: 'online' }; }

    // --- RESTAURATION DE LA PRÉVISION ---
    async getForecast(shopId?: number) {
        let avgDaily = 10000;
        try {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { data: sales } = await this.admin
                .from('sales')
                .select('total_amount')
                .gte('created_at', startDate)
                .eq(shopId ? 'shop_id' : '', shopId || '');

            const total = sales?.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0) || 0;
            avgDaily = total / 30;

            const result = await this.model.generateContent(`Prédis le CA pour les 3 prochains jours. CA total 30j: ${total}. Moyenne: ${avgDaily}. Réponds uniquement en JSON: {"predictions": [nb1, nb2, nb3]}`);
            const text = (await result.response).text().trim().replace(/```json|```/g, '');
            return JSON.parse(text);
        } catch (e) { 
            return { predictions: [avgDaily, avgDaily * 1.1, avgDaily * 0.9] }; 
        }
    }
}
