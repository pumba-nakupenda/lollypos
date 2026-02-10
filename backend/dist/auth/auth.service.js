"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase.service");
let AuthService = AuthService_1 = class AuthService {
    supabaseService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    get supabase() {
        return this.supabaseService.getClient();
    }
    async logConnection(userId, email, device, ip) {
        this.logger.log(`[AUTH] Logging connection for ${email}`);
        const { error } = await this.supabase.from('connection_logs').insert({
            user_id: userId,
            email,
            device,
            ip_address: ip
        });
        if (error)
            this.logger.error(`[AUTH] Log failed: ${error.message}`);
    }
    async getLogs() {
        const { data, error } = await this.supabase
            .from('connection_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error)
            throw error;
        return data;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map