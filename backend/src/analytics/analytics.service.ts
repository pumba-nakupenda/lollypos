import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly supabaseService: SupabaseService) {}

    private get supabase() {
        return (this.supabaseService as any).getAdminClient();
    }

    async getAnalytics(shopId?: string, category?: string, month?: string, year?: string) {
        const isGlobal = !shopId || shopId === 'all';
        const isAgency = shopId === '3';
        const numericShopId = shopId && shopId !== 'all' ? Number(shopId) : undefined;

        const [salesResult, expensesResult, saleItemsResult, debtsResult, productsResult, categoriesResult] = await Promise.all([
            (() => {
                let q = this.supabase
                    .from('sales')
                    .select('id, total_amount, paid_amount, with_tva, shop_id, created_at')
                    .order('created_at', { ascending: false });
                if (numericShopId) q = q.eq('shop_id', numericShopId);
                return q;
            })(),
            (() => {
                let q = this.supabase
                    .from('expenses')
                    .select('id, amount, date, category, shop_id, is_recurring, frequency, description')
                    .order('date', { ascending: false });
                if (numericShopId) q = q.eq('shop_id', numericShopId);
                return q;
            })(),
            (() => {
                let q = this.supabase
                    .from('sale_items')
                    .select('sale_id, quantity, price, products!inner(name, category, cost_price, shop_id)');
                if (numericShopId) q = q.eq('products.shop_id', numericShopId);
                return q;
            })(),
            (() => {
                let q = this.supabase.from('debts').select('remaining_amount, status');
                if (numericShopId) q = q.eq('shop_id', numericShopId);
                return q;
            })(),
            (() => {
                let q = this.supabase.from('products').select('stock, cost_price, id');
                if (numericShopId) q = q.eq('shop_id', numericShopId);
                return q;
            })(),
            this.supabase.from('expense_categories').select('name').eq('shop_id', 3).eq('is_personal', true),
        ]);

        let sales = salesResult.data || [];
        let expenses = expensesResult.data || [];
        const allExpenses = [...expenses];
        let saleItems = saleItemsResult.data || [];
        const debts = debtsResult.data || [];
        const products = productsResult.data || [];
        const personalCategories = categoriesResult.data || [];
        const personalCategoryNames = personalCategories.map((c: any) => (c.name || '').toLowerCase());

        // Monthly filtering
        if (month && year) {
            sales = sales.filter((s: any) => {
                const d = new Date(s.created_at);
                return (d.getMonth() + 1).toString().padStart(2, '0') === month && d.getFullYear().toString() === year;
            });
            expenses = expenses.filter((e: any) => {
                const d = new Date(e.date);
                return (d.getMonth() + 1).toString().padStart(2, '0') === month && d.getFullYear().toString() === year;
            });
            const validSaleIds = new Set(sales.map((s: any) => s.id));
            saleItems = saleItems.filter((item: any) => validSaleIds.has(item.sale_id));
        }

        // 1. Revenue (TVA)
        const tvaRate = 0.18;
        let totalSalesTTC = 0, totalSalesHT = 0, totalTVA = 0, totalActualCash = 0;
        sales.forEach((s: any) => {
            const amount = Number(s.total_amount) || 0;
            const withTva = s.with_tva !== false;
            const paid = Number(s.paid_amount) || 0;
            totalSalesTTC += amount;
            totalActualCash += paid;
            if (withTva) {
                const ht = amount / (1 + tvaRate);
                totalSalesHT += ht;
                totalTVA += (amount - ht);
            } else {
                totalSalesHT += amount;
            }
        });

        // 2. COGS
        const saleToShopMap = new Map();
        sales.forEach((s: any) => saleToShopMap.set(s.id, Number(s.shop_id)));
        const totalCOGS = saleItems.reduce((acc: number, item: any) => {
            const cost = Number(item.products?.cost_price || 0);
            return acc + (item.quantity * cost);
        }, 0);

        // 3. Expenses refinement
        const periodExpenses = expenses.filter((e: any) => {
            const catName = (e.category || '').toLowerCase();
            const isPersonalCategory = e.shop_id === 3 && personalCategoryNames.includes(catName);
            const isPerso = catName === 'perso' || isPersonalCategory;
            if (e.shop_id !== 3 && isPerso) return false;
            return true;
        });

        const operationalVariableCosts = periodExpenses
            .filter((e: any) => e.is_recurring !== true)
            .reduce((acc: number, e: any) => acc + Number(e.amount), 0);
        const totalVariableCosts = totalCOGS + operationalVariableCosts;
        const totalExpenses = periodExpenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);

        // Fixed costs (deduped recurring templates)
        const uniqueRecurringTemplates = new Map();
        allExpenses.forEach((e: any) => {
            if (e.is_recurring !== true) return;
            const catName = (e.category || '').toLowerCase();
            const isPersonalCategory = e.shop_id === 3 && personalCategoryNames.includes(catName);
            const isPerso = catName === 'perso' || isPersonalCategory;
            if (e.shop_id !== 3 && isPerso) return;
            
            // Key by shop and description to avoid deduplicating same-named expenses across shops
            const key = `${e.shop_id}-${e.description}`;
            const existing = uniqueRecurringTemplates.get(key);
            if (!existing || new Date(e.date) > new Date(existing.date)) {
                uniqueRecurringTemplates.set(key, e);
            }
        });

        const timescale = month ? 1 : 12;
        const recurringByShop = Array.from(uniqueRecurringTemplates.values()).reduce((acc: any, e: any) => {
            const sid = String(e.shop_id);
            if (!acc[sid]) acc[sid] = 0;
            let amount = Number(e.amount) || 0;
            if (e.frequency === 'daily') amount *= 30;
            else if (e.frequency === 'weekly') amount *= 4;
            else if (e.frequency === 'yearly') amount /= 12;
            acc[sid] += amount;
            return acc;
        }, {});

        const fixedCostsAgency = (recurringByShop['3'] || 0) * timescale;
        const fixedCostsOthers = Object.entries(recurringByShop)
            .filter(([id]) => id !== '3')
            .reduce((sum, [, amt]) => sum + (amt as number), 0) * timescale;

        const fixedCosts = fixedCostsAgency + fixedCostsOthers;
        const seuilRentabilite = fixedCostsAgency + (fixedCostsOthers / 0.40);
        
        const mcvRatio = isGlobal 
            ? (seuilRentabilite > 0 ? fixedCosts / seuilRentabilite : 0.40)
            : (isAgency ? 1.0 : 0.40);
        const realMcvRatio = totalSalesHT > 0 ? ((totalSalesHT - totalVariableCosts) / totalSalesHT) : 0;
        const margeBrute = totalSalesHT - totalCOGS;
        const margeNet = totalSalesHT - totalExpenses - totalCOGS;

        // Break-even point
        const pointMortDays = totalSalesHT > 0 ? ((seuilRentabilite / totalSalesHT) * 365) : 0;
        let pointMortDate: Date;
        let isPointMortOutOfRange = false;

        if (month && year) {
            const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
            const ratio = totalSalesHT > 0 ? (seuilRentabilite / totalSalesHT) : 0;
            if (ratio > 1.2) isPointMortOutOfRange = true;
            pointMortDate = new Date(Number(year), Number(month) - 1, Math.max(1, Math.round(ratio * daysInMonth)));
        } else {
            const currentYear = year ? Number(year) : new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            if (totalSalesHT > 0 && (seuilRentabilite / totalSalesHT) > 1.5) isPointMortOutOfRange = true;
            pointMortDate = new Date(startOfYear);
            pointMortDate.setDate(startOfYear.getDate() + Math.round(pointMortDays));
        }

        const totalRemainingDebts = debts.reduce((acc: number, d: any) => acc + Number(d.remaining_amount), 0);
        const totalStockValue = products.reduce((acc: number, p: any) =>
            acc + ((Number(p.stock) || 0) * (Number(p.cost_price) || 0)), 0);
        const stockRotation = totalStockValue > 0 ? (totalCOGS / totalStockValue) : 0;
        const stockDurationDays = stockRotation > 0 ? (365 / stockRotation) : 0;

        // Trend
        let daysToTrack: string[] = [];
        if (month && year) {
            const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
            daysToTrack = Array.from({ length: daysInMonth }, (_, i) =>
                `${year}-${month}-${(i + 1).toString().padStart(2, '0')}`);
        } else {
            daysToTrack = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();
        }

        const trend = daysToTrack.map(date => ({
            date,
            income: sales.filter((s: any) => new Date(s.created_at).toISOString().split('T')[0] === date)
                .reduce((acc: number, s: any) => acc + Number(s.total_amount), 0),
            outcome: expenses.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === date)
                .reduce((acc: number, e: any) => acc + Number(e.amount), 0),
        }));

        // Top products
        let filteredItems = saleItems;
        if (category && category !== 'Toutes') {
            filteredItems = saleItems.filter((item: any) => item.products?.category === category);
        }

        const productStats: Record<string, { name: string; totalQuantity: number; totalRevenue: number }> = {};
        filteredItems?.forEach((item: any) => {
            const p = item.products;
            if (!p) return;
            if (!productStats[p.name]) productStats[p.name] = { name: p.name, totalQuantity: 0, totalRevenue: 0 };
            productStats[p.name].totalQuantity += item.quantity;
            productStats[p.name].totalRevenue += (item.quantity * Number(item.price));
        });

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        const availableCategories = Array.from(new Set(
            saleItems.map((item: any) => item.products?.category || 'Général')
        ));

        return {
            metrics: {
                totalSales: totalSalesTTC,
                totalSalesHT,
                totalExpenses,
                profit: margeNet,
                tva: totalTVA,
                margeBrute,
                margeNet,
                totalDebts: totalRemainingDebts,
                stockValue: totalStockValue,
                stockRotation,
                stockDurationDays,
                seuilRentabilite,
                tauxMarge: totalSalesHT > 0 ? (margeBrute / totalSalesHT) : 0,
                mcvRatio,
                realMcvRatio,
                pointMortDays,
                pointMortDate: pointMortDate.toISOString(),
                isPointMortOutOfRange,
                bfr: totalStockValue + totalRemainingDebts,
                caf: margeNet,
                actualCash: totalActualCash,
                totalFixedCosts: fixedCosts,
                totalVariableCosts,
            },
            topProducts,
            trend,
            availableCategories,
        };
    }

    async getHistory(shopId?: string, year?: string) {
        const currentYear = year || new Date().getFullYear().toString();
        const isAgency = shopId === '3';
        const numericShopId = shopId && shopId !== 'all' ? Number(shopId) : undefined;

        const [salesResult, expensesResult, saleItemsResult, categoriesResult] = await Promise.all([
            (() => {
                let q = this.supabase
                    .from('sales')
                    .select('id, total_amount, paid_amount, with_tva, created_at')
                    .order('created_at', { ascending: false });
                if (numericShopId) q = q.eq('shop_id', numericShopId);
                return q;
            })(),
            (() => {
                let q = this.supabase
                    .from('expenses')
                    .select('id, amount, date, category, shop_id, is_recurring, frequency, description')
                    .order('date', { ascending: false });
                if (numericShopId) q = q.eq('shop_id', numericShopId);
                return q;
            })(),
            (() => {
                let q = this.supabase
                    .from('sale_items')
                    .select('sale_id, quantity, price, products!inner(name, category, cost_price, shop_id)');
                if (numericShopId) q = q.eq('products.shop_id', numericShopId);
                return q;
            })(),
            this.supabase.from('expense_categories').select('name').eq('shop_id', 3).eq('is_personal', true),
        ]);

        const allSales = salesResult.data || [];
        const allExpensesData = expensesResult.data || [];
        const allSaleItems = saleItemsResult.data || [];
        const personalCategories = categoriesResult.data || [];
        const personalCategoryNames = personalCategories.map((c: any) => (c.name || '').toLowerCase());

        const tvaRate = 0.18;

        const history = Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const monthlySales = allSales.filter((s: any) => {
                const d = new Date(s.created_at);
                return (d.getMonth() + 1) === m && d.getFullYear().toString() === currentYear;
            });

            const monthlyExpenses = allExpensesData.filter((e: any) => {
                const d = new Date(e.date);
                if (!((d.getMonth() + 1) === m && d.getFullYear().toString() === currentYear)) return false;
                const catName = (e.category || '').toLowerCase();
                const isPersonalCategory = Number(e.shop_id) === 3 && personalCategoryNames.includes(catName);
                const isPerso = catName === 'perso' || isPersonalCategory;
                if (Number(e.shop_id) !== 3 && isPerso) return false;
                return true;
            });

            const saleIds = new Set(monthlySales.map((s: any) => s.id));
            const monthlyItems = allSaleItems.filter((item: any) => saleIds.has(item.sale_id));

            let totalSalesHT = 0, totalActualCash = 0;
            monthlySales.forEach((s: any) => {
                const amount = Number(s.total_amount) || 0;
                totalActualCash += Number(s.paid_amount) || 0;
                if (s.with_tva !== false) {
                    totalSalesHT += amount / (1 + tvaRate);
                } else {
                    totalSalesHT += amount;
                }
            });

            const totalCOGS = monthlyItems.reduce((acc: number, item: any) =>
                acc + (item.quantity * Number(item.products?.cost_price || 0)), 0);

            const operationalVariableCosts = monthlyExpenses
                .filter((e: any) => e.is_recurring !== true)
                .reduce((acc: number, e: any) => acc + Number(e.amount), 0);

            const totalExpenses = monthlyExpenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0);

            // Per-shop threshold calculation for true consolidated sum
            const uniqueRecurringTemplates = new Map();
            allExpensesData.forEach((e: any) => {
                if (e.is_recurring !== true) return;
                const catName = (e.category || '').toLowerCase();
                const isPersonalCategory = Number(e.shop_id) === 3 && personalCategoryNames.includes(catName);
                const isPerso = catName === 'perso' || isPersonalCategory;
                if (Number(e.shop_id) !== 3 && isPerso) return;
                const key = `${e.shop_id}-${e.description}`;
                const existing = uniqueRecurringTemplates.get(key);
                if (!existing || new Date(e.date) > new Date(existing.date)) {
                    uniqueRecurringTemplates.set(key, e);
                }
            });

            const recurringByShop = Array.from(uniqueRecurringTemplates.values()).reduce((acc: any, e: any) => {
                const sid = String(e.shop_id);
                if (!acc[sid]) acc[sid] = 0;
                let amt = Number(e.amount) || 0;
                if (e.frequency === 'daily') amt *= 30;
                else if (e.frequency === 'weekly') amt *= 4;
                else if (e.frequency === 'yearly') amt /= 12;
                acc[sid] += amt;
                return acc;
            }, {});

            const fixedAgency = recurringByShop['3'] || 0;
            const fixedOthers = Object.entries(recurringByShop)
                .filter(([id]) => id !== '3')
                .reduce((sum, [, amt]) => sum + (amt as number), 0);

            const seuilRentabilite = fixedAgency + (fixedOthers / 0.40);
            const totalVariableCosts = totalCOGS + operationalVariableCosts;
            const realMcvRatio = totalSalesHT > 0 ? ((totalSalesHT - totalVariableCosts) / totalSalesHT) : 0;

            return {
                month: m,
                monthName: new Date(Number(currentYear), m - 1).toLocaleDateString('fr-FR', { month: 'long' }),
                year: Number(currentYear),
                totalSalesHT,
                totalExpenses,
                margeNet: totalSalesHT - totalExpenses - totalCOGS,
                seuilRentabilite,
                actualCash: totalActualCash,
                realMcvRatio,
                isProfitable: totalSalesHT > 0 && totalSalesHT >= seuilRentabilite,
                progress: seuilRentabilite > 0
                    ? Math.min((totalSalesHT / seuilRentabilite) * 100, 100)
                    : (totalSalesHT > 0 ? 100 : 0),
            };
        });

        const currentMonthNum = new Date().getMonth() + 1;
        const currentYearNum = new Date().getFullYear();

        return history.filter(h => {
            if (h.year < currentYearNum) return true;
            if (h.year === currentYearNum) return h.month <= currentMonthNum;
            return false;
        });
    }
}
