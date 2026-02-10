"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const ai_controller_1 = require("./ai.controller");
const supabase_module_1 = require("../supabase.module");
const products_module_1 = require("../products/products.module");
const sales_module_1 = require("../sales/sales.module");
const expenses_module_1 = require("../expenses/expenses.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, products_module_1.ProductsModule, sales_module_1.SalesModule, expenses_module_1.ExpensesModule],
        providers: [ai_service_1.AiService],
        controllers: [ai_controller_1.AiController]
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map