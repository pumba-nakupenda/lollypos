import { NextResponse } from 'next/server'
import { API_URL } from '@/utils/api'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')
    const category = searchParams.get('category')
    const month = searchParams.get('month') // Format: MM
    const year = searchParams.get('year')   // Format: YYYY

    const query = shopId && shopId !== 'all' ? `?shopId=${shopId}` : ''

    console.log(`[AnalyticsAPI] Request: Shop=${shopId}, Month=${month}, Year=${year}`)

    try {
        const supabase = await createClient()
        const isGlobal = !shopId || shopId === 'all'
        const isAgency = shopId === '3'

        let expensesUrl = `${API_URL}/expenses${query}`
        if (isGlobal || isAgency) {
            expensesUrl += (query ? '&' : '?') + 'includePersonal=true'
        }

        // Fetch from NestJS Backend and Supabase
        const [salesRes, expensesRes, saleItemsRes, debtsRes, productsRes, categoriesRes] = await Promise.all([
            fetch(`${API_URL}/sales${query}`, { cache: 'no-store' }),
            fetch(expensesUrl, { cache: 'no-store' }),
            fetch(`${API_URL}/sales/items${query}`, { cache: 'no-store' }),
            shopId && shopId !== 'all'
                ? supabase.from('debts').select('remaining_amount, status').eq('shop_id', shopId)
                : supabase.from('debts').select('remaining_amount, status'),
            // NEW: Fetch products for Stock Value Calculation
            shopId && shopId !== 'all'
                ? supabase.from('products').select('stock, cost_price, id').eq('shop_id', shopId)
                : supabase.from('products').select('stock, cost_price, id'),
            // NEW: Fetch personal categories for Shop 3
            supabase.from('expense_categories').select('name').eq('shop_id', 3).eq('is_personal', true)
        ])

        if (!salesRes.ok || !expensesRes.ok || !saleItemsRes.ok) {
            throw new Error(`Backend Error`)
        }

        let sales = await salesRes.json()
        let expenses = await expensesRes.json()
        const allExpenses = [...expenses]
        let saleItems = await saleItemsRes.json()
        const debts = debtsRes.data || []
        const products = productsRes.data || []
        const personalCategories = categoriesRes.data || []
        const personalCategoryNames = personalCategories.map((c: any) => (c.name || '').toLowerCase())

        // --- Monthly Filtering Logic ---
        if (month && year) {
            sales = sales.filter((s: any) => {
                const date = new Date(s.created_at)
                return (date.getMonth() + 1).toString().padStart(2, '0') === month && date.getFullYear().toString() === year
            })
            expenses = expenses.filter((e: any) => {
                const date = new Date(e.date)
                return (date.getMonth() + 1).toString().padStart(2, '0') === month && date.getFullYear().toString() === year
            })
            const validSaleIds = new Set(sales.map((s: any) => s.id))
            saleItems = saleItems.filter((item: any) => validSaleIds.has(item.sale_id))
        }

        // 1. DYNAMIC REVENUE CALCULATION (Per-sale TVA)
        const tvaRate = 0.18
        let totalSalesTTC = 0
        let totalSalesHT = 0
        let totalTVA = 0
        let totalActualCash = 0 // Based on paid_amount

        sales.forEach((s: any) => {
            const amount = Number(s.total_amount) || 0
            const withTva = s.with_tva !== false // Default true
            const paid = Number(s.paid_amount) || 0

            totalSalesTTC += amount
            totalActualCash += paid

            if (withTva) {
                const ht = amount / (1 + tvaRate)
                totalSalesHT += ht
                totalTVA += (amount - ht)
            } else {
                totalSalesHT += amount
            }
        })

        // 2. COGS CALCULATION (Per-shop mapping for Global View)
        const saleToShopMap = new Map();
        sales.forEach((s: any) => saleToShopMap.set(s.id, Number(s.shop_id)));

        const totalCOGS = saleItems.reduce((acc: number, item: any) => {
            const saleId = item.sale_id
            const itemShopId = saleToShopMap.get(saleId) || (shopId && shopId !== 'all' ? Number(shopId) : null)

            // Skip COGS for Lolly Agency (Shop 3)
            if (itemShopId === 3) return acc

            const p = item.products?.name ? item.products : item.products?.[0];
            const cost = Number(p?.cost_price || 0)
            return acc + (item.quantity * cost)
        }, 0)

        // 3. EXPENSES REFINEMENT (Fixed vs Variable)

        // Filter expenses for this period
        const periodExpenses = expenses.filter((e: any) => {
            const catName = (e.category || '').toLowerCase()
            const isPersonalCategory = e.shop_id === 3 && personalCategoryNames.includes(catName)
            const isPerso = catName === 'perso' || isPersonalCategory
            // For any shop other than Shop 3, we exclude personal expenses
            if (e.shop_id !== 3 && isPerso) return false
            return true
        })

        // Variable Costs (Operational) = Non-recurring period expenses
        const operationalVariableCosts = periodExpenses
            .filter((e: any) => e.is_recurring !== true)
            .reduce((acc: number, e: any) => acc + Number(e.amount), 0)

        const totalVariableCosts = totalCOGS + operationalVariableCosts
        const totalExpenses = periodExpenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0)

        // Fixed Costs (Structural) = sum of all recurring templates normalized to monthly
        // We deduplicate by description to avoid summing multiple instances of the same template
        const uniqueRecurringTemplates = new Map();
        allExpenses.forEach((e: any) => {
            if (e.is_recurring !== true) return;
            const catName = (e.category || '').toLowerCase()
            const isPersonalCategory = e.shop_id === 3 && personalCategoryNames.includes(catName)
            const isPerso = catName === 'perso' || isPersonalCategory;
            if (e.shop_id !== 3 && isPerso) return;

            // Only keep the most recent template for each description
            const existing = uniqueRecurringTemplates.get(e.description);
            if (!existing || new Date(e.date) > new Date(existing.date)) {
                uniqueRecurringTemplates.set(e.description, e);
            }
        });

        const monthlyFixedCosts = Array.from(uniqueRecurringTemplates.values())
            .reduce((acc: number, e: any) => {
                let amount = Number(e.amount) || 0
                if (e.frequency === 'daily') amount *= 30
                else if (e.frequency === 'weekly') amount *= 4
                else if (e.frequency === 'yearly') amount /= 12
                return acc + amount
            }, 0)

        // Scale Fixed Costs if viewing whole year (no month param)
        const timescale = month ? 1 : 12;
        // const fixedCosts = monthlyFixedCosts * timescale; // Original line

        // 4. FINANCIAL INDICATORS RECALCULATION
        // Split Fixed Costs by Shop to apply individual SR rules (Agency=100%, Others=40%)
        const recurringByShop = Array.from(uniqueRecurringTemplates.values()).reduce((acc: any, e: any) => {
            const sid = String(e.shop_id)
            if (!acc[sid]) acc[sid] = 0
            let amount = Number(e.amount) || 0
            if (e.frequency === 'daily') amount *= 30
            else if (e.frequency === 'weekly') amount *= 4
            else if (e.frequency === 'yearly') amount /= 12
            acc[sid] += amount
            return acc
        }, {})

        const fixedCostsAgency = (recurringByShop['3'] || 0) * timescale
        const fixedCostsOthers = Object.entries(recurringByShop)
            .filter(([id]) => id !== '3')
            .reduce((sum, [_, amt]) => sum + (amt as number), 0) * timescale

        // Seuil de Rentabilite (SR) = (Agency Fixed Costs / 1.0) + (Others Fixed Costs / 0.40)
        const seuilRentabilite = fixedCostsAgency + (fixedCostsOthers / 0.40)
        const fixedCosts = fixedCostsAgency + fixedCostsOthers

        const realMcv = totalSalesHT - totalVariableCosts
        const realMcvRatio = totalSalesHT > 0 ? (realMcv / totalSalesHT) : 0

        // MCV Ratio for display (Weighted ratio in global view)
        const isAgencyShop = shopId === '3'
        const mcvRatio = isAgencyShop ? 1.0 : (shopId === 'all' || !shopId ? (totalSalesHT > 0 ? (totalSalesHT - totalCOGS) / totalSalesHT : 0.40) : 0.40)

        // Net Margin
        const margeBrute = totalSalesHT - totalCOGS
        const margeNet = totalSalesHT - totalExpenses - totalCOGS

        console.log(`[AnalyticsAPI] Calc: FixedCosts=${fixedCosts}, SR=${seuilRentabilite}, MCV=${mcvRatio}`)

        // Point Mort (Break-even Date)
        const pointMortDays = totalSalesHT > 0 ? ((seuilRentabilite / totalSalesHT) * 365) : 0

        // Calculate actual date
        let pointMortDate: Date;
        let isPointMortOutOfRange = false;

        if (month && year) {
            const daysInMonth = new Date(Number(year), Number(month), 0).getDate()
            const ratio = totalSalesHT > 0 ? (seuilRentabilite / totalSalesHT) : 0
            if (ratio > 1.2) isPointMortOutOfRange = true;
            const pointMortDayOfMonth = ratio * daysInMonth
            pointMortDate = new Date(Number(year), Number(month) - 1, Math.max(1, Math.round(pointMortDayOfMonth)));
        } else {
            const currentYear = year ? Number(year) : new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            if (totalSalesHT > 0 && (seuilRentabilite / totalSalesHT) > 1.5) isPointMortOutOfRange = true;
            pointMortDate = new Date(startOfYear);
            pointMortDate.setDate(startOfYear.getDate() + Math.round(pointMortDays));
        }

        const totalRemainingDebts = debts.reduce((acc, d) => acc + Number(d.remaining_amount), 0)
        const totalStockValue = products.reduce((acc: number, p: any) => acc + ((Number(p.stock) || 0) * (Number(p.cost_price) || 0)), 0)
        const stockRotation = totalStockValue > 0 ? (totalCOGS / totalStockValue) : 0
        const stockDurationDays = stockRotation > 0 ? (365 / stockRotation) : 0
        const bfr = totalStockValue + totalRemainingDebts
        const caf = margeNet

        const financialMetrics = {
            stockValue: totalStockValue,
            stockRotation: stockRotation,
            stockDurationDays: stockDurationDays,
            seuilRentabilite: seuilRentabilite,
            tauxMarge: totalSalesHT > 0 ? (margeBrute / totalSalesHT) : 0,
            mcvRatio: mcvRatio, // Target Rule (28%)
            realMcvRatio: realMcvRatio, // Actual Performance
            pointMortDays: pointMortDays,
            pointMortDate: pointMortDate.toISOString(),
            isPointMortOutOfRange: isPointMortOutOfRange,
            bfr: bfr,
            caf: caf,
            actualCash: totalActualCash,
            totalFixedCosts: fixedCosts,
            totalVariableCosts: totalVariableCosts
        }

        // 5. Trend Data
        let daysToTrack: string[] = []
        if (month && year) {
            const daysInMonth = new Date(Number(year), Number(month), 0).getDate()
            daysToTrack = Array.from({ length: daysInMonth }, (_, i) => `${year}-${month}-${(i + 1).toString().padStart(2, '0')}`)
        } else {
            daysToTrack = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - i)
                return d.toISOString().split('T')[0]
            }).reverse()
        }

        const trend = daysToTrack.map(date => {
            const income = (sales || []).filter((s: any) => new Date(s.created_at).toISOString().split('T')[0] === date).reduce((acc: number, s: any) => acc + Number(s.total_amount), 0)
            const outcome = (expenses || []).filter((e: any) => new Date(e.date).toISOString().split('T')[0] === date).reduce((acc: number, e: any) => acc + Number(e.amount), 0)
            return { date, income, outcome }
        })

        // 6. Top Products
        let filteredItems = saleItems
        if (category && category !== 'Toutes') {
            filteredItems = saleItems.filter((item: any) => item.products?.category === category)
        }

        const productStats: Record<string, { name: string, totalQuantity: number, totalRevenue: number }> = {}
        filteredItems?.forEach((item: any) => {
            const p = item.products?.name ? item.products : item.products?.[0];
            if (!p) return
            if (!productStats[p.name]) {
                productStats[p.name] = { name: p.name, totalQuantity: 0, totalRevenue: 0 }
            }
            productStats[p.name].totalQuantity += item.quantity
            productStats[p.name].totalRevenue += (item.quantity * Number(item.price))
        })

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5)

        const availableCategories = Array.from(new Set(saleItems.map((item: any) => {
            const p = item.products?.name ? item.products : item.products?.[0];
            return p?.category || 'Général';
        })))

        return NextResponse.json({
            metrics: {
                totalSales: totalSalesTTC,
                totalSalesHT: totalSalesHT,
                totalExpenses,
                profit: margeNet,
                tva: totalTVA,
                margeBrute,
                margeNet,
                totalDebts: totalRemainingDebts,
                ...financialMetrics // Add new metrics
            },
            topProducts,
            trend,
            availableCategories
        })

    } catch (err: any) {
        console.error('[AnalyticsAPI] Error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}