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
            this.logger.log('AI System: VERSION ULTIME ACTIVÉE.');
        }
    }

    private get admin() {
        return (this.supabaseService as any).getAdminClient();
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            console.log('[AI] Lancement de l\'analyse God Mode...');

            // RÉCUPÉRATION TOTALE
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

            console.log(`[AI] Données récupérées : ${allSales.length} ventes, ${allExpenses.length} dépenses.`);

            const context = {
                v: "VERSION_GOD_MODE_v3",
                finance: {
                    entrees: allSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
                    sorties: allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
                    dettes: allDebts.reduce((sum, d) => sum + (Number(d.remaining_amount) || 0), 0)
                },
                detail_sorties: allExpenses.map(e => ({ desc: e.description, mnt: e.amount, type: e.category })),
                detail_dettes: allDebts.filter(d => d.remaining_amount > 0).map(d => ({ client: d.customers?.name, du: d.remaining_amount })),
                stock: allProducts.map(p => ({ n: p.name, s: p.stock }))
            };

            const prompt = `
                Tu es l'Intelligence de LOLLY SAS. 
                TU AS ACCÈS À TOUT. NE DIS JAMAIS LE CONTRAIRE.
                Voici les données du registre : ${JSON.stringify(context)}
                
                RÉPONDS DIRECTEMENT À : ${userQuestion}
            `;

            const result = await this.model.generateContent(prompt);
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

    async generatePromoBanner() { return { slogan: "OFFRES EXCLUSIVES LOLLY ✨" }; }
    async suggestProductPhoto(p: string) { return { urls: [] }; }
    async getStatus() { return { status: 'online', version: 'v3_god_mode' }; }
}
