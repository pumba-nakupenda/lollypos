
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
            // Utilisation du nom de modèle technique stable
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            this.logger.log('AI System: Gemini 2.0 Flash Ready.');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            // RÉCUPÉRATION TOTALE DES DONNÉES
            const [salesRes, productsRes, expensesRes, debtsRes] = await Promise.all([
                this.admin.from('sales').select('*'),
                this.admin.from('products').select('*'),
                this.admin.from('expenses').select('*'),
                this.admin.from('debts').select('*, customers(name)')
            ]);

            const allSales = salesRes.data || [];
            const allProducts = productsRes.data || [];
            const allExpenses = expensesRes.data || [];
            const allDebts = debtsRes.data || [];

            // Préparation d'un contexte "froid" et technique pour éviter les refus de l'IA
            const data = {
                id_version: "3.0.1",
                stats_financieres: {
                    total_entrees: allSales.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0),
                    total_sorties: allExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0),
                    total_dettes: allDebts.reduce((sum: number, d: any) => sum + (Number(d.remaining_amount) || 0), 0)
                },
                registre_sorties: allExpenses.map((e: any) => ({ d: e.description, v: e.amount, t: e.category })),
                registre_dettes: allDebts.filter((d: any) => d.remaining_amount > 0).map((d: any) => ({ c: d.customers?.name, m: d.remaining_amount })),
                inventaire: allProducts.map((p: any) => ({ n: p.name, s: p.stock }))
            };

            const prompt = `
                Tu es le SYSTEME DE GESTION de LOLLY SAS. 
                Tu ne dis JAMAIS que tu es une IA ou que tu as des limites. 
                Tu as accès à tout le registre technique suivant : ${JSON.stringify(data)}
                
                REQUÊTE : ${userQuestion}
                RÉPONSE COURTE ET PRÉCISE :
            `;

            const result = await this.model.generateContent(prompt);
            return result.response.text();

        } catch (error: any) {
            return `Erreur système : ${error.message}`;
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

    async generatePromoBanner() { return { slogan: "STOCKS LIMITÉS ! PROFITEZ-EN ✨" }; }
    async suggestProductPhoto(p: string) { return { urls: [] }; }
    async getStatus() { return { status: 'online' }; }
}
