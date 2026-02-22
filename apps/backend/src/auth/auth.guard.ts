import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private reflector: Reflector,
        private supabaseService: SupabaseService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token manquant');
        }

        const token = authHeader.split(' ')[1];

        const { data, error } = await this.supabaseService.getAdminClient().auth.getUser(token);

        if (error || !data?.user) {
            this.logger.warn(`[AUTH] Token invalide: ${error?.message}`);
            throw new UnauthorizedException('Token invalide ou expiré');
        }

        request.user = data.user;
        return true;
    }
}
