import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    this.initClient();
  }

  private initClient() {
    if (this.supabase) return;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    this.logger.log(`Initializing Supabase with URL: ${supabaseUrl ? 'Defined' : 'UNDEFINED'}`);

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('CRITICAL: Supabase URL or Key is missing from environment variables!');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully.');
    } catch (err) {
      this.logger.error(`Failed to create Supabase client: ${err.message}`);
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      this.initClient();
    }

    if (!this.supabase) {
      throw new Error('Supabase client could not be initialized. Check console for errors.');
    }
    return this.supabase;
  }
}
