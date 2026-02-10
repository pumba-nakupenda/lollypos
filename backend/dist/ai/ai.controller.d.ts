import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    analyze(question: string, shopId?: string): Promise<{
        answer: string;
    }>;
    suggestPhoto(name: string): Promise<{
        urls: string[];
    }>;
}
