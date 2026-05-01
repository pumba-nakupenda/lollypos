import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type ShopAccessProfile = {
  id: string;
  shop_id: number | null;
  shop_ids: number[] | null;
  is_super_admin: boolean | null;
  is_active: boolean | null;
};

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: ReturnType<typeof createClient>;
  private adminClient: ReturnType<typeof createClient>;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initClient();
  }

  private initClient() {
    if (this.supabase) return;

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const serviceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this.logger.log(`[SUPABASE] Initialization Check:`);
    this.logger.log(` - URL: ${supabaseUrl ? 'OK' : 'MISSING'}`);
    this.logger.log(
      ` - Anon Key: ${supabaseKey ? 'OK (length: ' + supabaseKey.length + ')' : 'MISSING'}`,
    );
    this.logger.log(
      ` - Service Key: ${serviceKey ? 'OK (length: ' + serviceKey.length + ')' : 'MISSING'}`,
    );

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'CRITICAL: Supabase URL or Key is missing from environment variables!',
      );
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
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to create Supabase client: ${message}`);
    }
  }

  getClient(): SupabaseClient {
    if (!this.supabase) this.initClient();
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    if (!this.adminClient) this.initClient();
    if (!this.adminClient) {
      this.logger.error(
        'CRITICAL: Admin client requested but SUPABASE_SERVICE_ROLE_KEY is missing!',
      );
      throw new Error('Service indisponible : clé service Supabase manquante.');
    }
    return this.adminClient;
  }

  async assertGlobalShopAccess(userId: string): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('Utilisateur requis');
    }

    const admin = this.getAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, is_super_admin, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile || profile.is_active === false || !profile.is_super_admin) {
      throw new ForbiddenException('Vue globale réservée au super admin');
    }
  }

  async assertShopAccess(userId: string, shopId: number): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('Utilisateur requis');
    }

    if (!Number.isInteger(shopId) || shopId <= 0) {
      throw new BadRequestException('shopId invalide');
    }

    const admin = this.getAdminClient();

    const [
      { data: shop, error: shopError },
      { data: profile, error: profileError },
    ] = await Promise.all([
      admin.from('shops').select('id').eq('id', shopId).maybeSingle(),
      admin
        .from('profiles')
        .select('id, shop_id, shop_ids, is_super_admin, is_active')
        .eq('id', userId)
        .maybeSingle(),
    ]);

    if (shopError) throw shopError;
    if (!shop) throw new NotFoundException('Boutique introuvable');

    if (profileError) throw profileError;
    if (!profile || profile.is_active === false) {
      throw new ForbiddenException('Accès boutique refusé');
    }

    const typedProfile = profile as ShopAccessProfile;
    if (typedProfile.is_super_admin) return;

    const authorizedShopIds = new Set<number>();
    if (typedProfile.shop_id)
      authorizedShopIds.add(Number(typedProfile.shop_id));
    typedProfile.shop_ids?.forEach((id) => authorizedShopIds.add(Number(id)));

    if (!authorizedShopIds.has(shopId)) {
      throw new ForbiddenException('Accès boutique refusé');
    }
  }
}
