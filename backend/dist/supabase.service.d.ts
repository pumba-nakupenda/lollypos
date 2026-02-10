import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService implements OnModuleInit {
    private configService;
    private supabase;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private initClient;
    getClient(): SupabaseClient;
}
