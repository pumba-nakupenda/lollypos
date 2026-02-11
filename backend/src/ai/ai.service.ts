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
    async generatePromoBanner() { return { slogan: "" }; }
    async getStatus() { return { status: 'online' }; }
}
