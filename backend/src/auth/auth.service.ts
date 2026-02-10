import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(private readonly supabaseService: SupabaseService) {}

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async logConnection(userId: string, email: string, device: string, ip: string) {
        this.logger.log(`[AUTH] Logging connection for ${email}`);
        const { error } = await this.supabase.from('connection_logs').insert({
            user_id: userId,
            email,
            device,
            ip_address: ip
        });
        if (error) this.logger.error(`[AUTH] Log failed: ${error.message}`);
    }

    async getLogs() {
        const { data, error } = await this.supabase
            .from('connection_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        return data;
    }
}
