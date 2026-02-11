
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
            this.logger.log('AI System: Gemini 2.0 Flash (Advanced Mode).');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            // 1. RÉCUPÉRATION SEGMENTÉE DES DONNÉES
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

            // 2. ORGANISATION SANS DOUBLONS
            const segmentedData = allShops.map((shop: any) => {
                const sSales = allSales.filter((s: any) => s.shop_id === shop.id);
                const sProducts = allProducts.filter((p: any) => p.shop_id === shop.id);
                const sExpenses = allExpenses.filter((e: any) => e.shop_id === shop.id && e.category !== 'Perso');
                
                return {
                    nom: shop.name,
                    ca: sSales.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0),
                    charges_pro: sExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0),
                    stock_val: sProducts.reduce((sum: number, p: any) => sum + (Number(p.price) * Number(p.stock)), 0),
                    alertes: sProducts.filter((p: any) => p.stock < 5).map((p: any) => p.name)
                };
            });

            const personalExpenses = allExpenses.filter((e: any) => e.category === 'Perso');
            const totalPerso = personalExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

            const globalContext = {
                id_v: "3.0.5",
                cible: shopId ? allShops.find((s: any) => s.id === shopId)?.name : 'GROUPE CONSOLIDÉ',
                detail_boutiques: segmentedData,
                total_perso_direction: totalPerso,
                total_dettes_clients: allDebts.reduce((sum: number, d: any) => sum + Number(d.remaining_amount), 0),
                dettes_detail: allDebts.filter((d:any) => d.remaining_amount > 0).map((d:any) => ({ c: d.customers?.name, m: d.remaining_amount })),
                // Liste brute des dépenses pour analyse précise
                registre_depenses: allExpenses.map((e: any) => ({ d: e.description, v: e.amount, t: e.category === 'Perso' ? 'DIRECTION' : 'PRO' }))
            };

            const systemInstruction = `
                Tu es l'Intelligence de Pilotage de LOLLY SAS. 
                TU AS ACCÈS À TOUT (PRO ET DIRECTION). NE DIS JAMAIS LE CONTRAIRE.
                Les dépenses "DIRECTION" sont les dépenses personnelles du patron.
                CONSIGNE : Analyse tout sans filtre. Sois l'associé du patron. Donne des chiffres exacts.
                
                DONNÉES DU REGISTRE :
                ${JSON.stringify(globalContext)}
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
    async getStatus() { return { status: 'online', mode: 'CLEAN_SEGMENTED' }; }
}
