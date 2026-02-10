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
var SupabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let SupabaseService = SupabaseService_1 = class SupabaseService {
    configService;
    supabase;
    logger = new common_1.Logger(SupabaseService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.initClient();
    }
    initClient() {
        if (this.supabase)
            return;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_KEY');
        this.logger.log(`Initializing Supabase with URL: ${supabaseUrl ? 'Defined' : 'UNDEFINED'}`);
        if (!supabaseUrl || !supabaseKey) {
            this.logger.error('CRITICAL: Supabase URL or Key is missing from environment variables!');
            return;
        }
        try {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
            this.logger.log('Supabase client initialized successfully.');
        }
        catch (err) {
            this.logger.error(`Failed to create Supabase client: ${err.message}`);
        }
    }
    getClient() {
        if (!this.supabase) {
            this.initClient();
        }
        if (!this.supabase) {
            throw new Error('Supabase client could not be initialized. Check console for errors.');
        }
        return this.supabase;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = SupabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map