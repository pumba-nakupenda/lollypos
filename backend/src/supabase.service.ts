import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    this.initClient();
  }

  private initClient() {
    if (this.supabase) return;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.logger.log(`Initializing Supabase with URL: ${supabaseUrl ? 'Defined' : 'UNDEFINED'}`);

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('CRITICAL: Supabase URL or Key is missing from environment variables!');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      if (serviceKey) {
        this.adminClient = createClient(supabaseUrl, serviceKey);
        this.logger.log('Supabase admin client initialized.');
      }
      this.logger.log('Supabase client initialized successfully.');
    } catch (err) {
      this.logger.error(`Failed to create Supabase client: ${err.message}`);
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) this.initClient();
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) this.initClient();
    if (!this.adminClient) {
      this.logger.warn('Admin client requested but service key is missing. Falling back to regular client.');
      return this.getClient();
    }
    return this.adminClient;
  }
}
