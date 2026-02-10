import { SupabaseService } from '../supabase.service';
export declare class AuthService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    private get supabase();
    logConnection(userId: string, email: string, device: string, ip: string): Promise<void>;
    getLogs(): Promise<any[]>;
}
