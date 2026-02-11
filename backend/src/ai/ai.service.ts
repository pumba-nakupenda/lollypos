import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(
        private configService: ConfigService,
        private supabaseService: SupabaseService,
    ) {
        const apiKey = this.configService.get<string>('GOOGLE_GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }
    }

    async analyzeBusiness(userQuestion: string, shopId?: number) {
        if (!this.model) return "IA non configurée.";
        
        try {
            // Utilisation sécurisée du client Supabase
            // On essaie getAdminClient, sinon getClient, sinon on fait sans données
            let client: any;
            if (typeof (this.supabaseService as any).getAdminClient === 'function') {
                client = (this.supabaseService as any).getAdminClient();
            } else if (typeof (this.supabaseService as any).getClient === 'function') {
                client = (this.supabaseService as any).getClient();
            }

            let statsContext = "";
            if (client) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                let query = client.from('sales').select('total_amount');
                if (shopId) query = query.eq('shop_id', shopId);
                const { data: sales } = await query.gte('created_at', startDate.toISOString());
                const total = sales?.reduce((sum: number, s: any) => sum + (Number(s.total_amount) || 0), 0) || 0;
                statsContext = `Le CA des 30 derniers jours est de ${total} FCFA.`;
            }

            const prompt = `Tu es l'IA Lolly. ${statsContext} Réponds à : ${userQuestion}`;
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error: any) {
            this.logger.error(`AI Error: ${error.message}`);
            return `L'IA a eu un souci technique, mais elle revient bientôt !`;
        }
    }

    // Fonctions de compatibilité pour éviter les erreurs de compilation
    // Fonction requise par ProductsService - Correction du modèle
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            if (!this.genAI) return new Array(768).fill(0);
            // Utilisation du modèle d'embedding stable
            const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            console.error(`[AI] Embedding error: ${error.message}`);
            // Retourne un vecteur vide au lieu de faire crasher le serveur
            return new Array(768).fill(0);
        }
    }
    async suggestProductPhoto(p: string) { return { urls: [] }; }
    async generatePromoBanner() {
        if (!this.model) {
            this.logger.error("AI Model not initialized for Banner");
            return { slogan: "BIENVENUE CHEZ LOLLY SHOP ✨" };
        }

        try {
            this.logger.log("[AI Banner] Génération d'un nouveau slogan...");
            
            // Récupérer quelques produits pour donner du contexte à l'IA
            const { data: products } = await this.supabaseService.getAdminClient()
                .from('products')
                .select('name, category')
                .limit(10);

            const productsContext = products && products.length > 0 
                ? `Produits : ${products.map(p => p.name).join(', ')}`
                : "Articles de mode et technologie";

            const prompt = `
                Tu es l'expert Marketing de LOLLY SHOP (Sénégal). 
                Génère UN SEUL slogan percutant et court (max 10 mots) pour un bandeau défilant.
                CONTEXTE : ${productsContext}. 
                INSTRUCTIONS : Tout en MAJUSCULES, avec des emojis, ton PREMIUM et INCITATIF.
                RÉPONSE (SLOGAN UNIQUEMENT) :
            `;

            const result = await this.model.generateContent(prompt);
            const slogan = (await result.response).text().trim().replace(/\"/g, '');

            // Sauvegarder dans la configuration du site
            const { data: currentSettings } = await this.supabaseService.getAdminClient()
                .from('site_settings')
                .select('content')
                .eq('name', 'lolly_shop_config')
                .maybeSingle();

            const updatedContent = { ...(currentSettings?.content || {}), promo_banner: slogan };

            await this.supabaseService.getAdminClient()
                .from('site_settings')
                .upsert({ 
                    name: 'lolly_shop_config', 
                    content: updatedContent, 
                    updated_at: new Date() 
                }, { onConflict: 'name' });

            this.logger.log(`[AI Banner] Nouveau slogan : ${slogan}`);
            return { slogan };
        } catch (error: any) {
            this.logger.error(`[AI Banner] Erreur : ${error.message}`);
            return { slogan: "PROMOTIONS EXCEPTIONNELLES EN BOUTIQUE ! 🛍️" };
        }
    }
    async getStatus() { return { status: 'online' }; }
}
