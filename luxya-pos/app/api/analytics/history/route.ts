import { NextResponse } from 'next/server'
import { API_URL } from '@/utils/api'
import { authFetchServer } from '@/utils/api-server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    const query = shopId && shopId !== 'all' ? `?shopId=${shopId}` : ''

    try {
        const supabase = await createClient()
        const isGlobal = !shopId || shopId === 'all'

        let expensesUrl = `${API_URL}/expenses${query}`
        if (isGlobal || shopId === '3') {
            expensesUrl += (query ? '&' : '?') + 'includePersonal=true'
        }

        // Fetch all data for the year in one go to be efficient
        const [salesRes, expensesRes, saleItemsRes, categoriesRes] = await Promise.all([
            authFetchServer(`${API_URL}/sales${query}`, { cache: 'no-store' }),
            authFetchServer(expensesUrl, { cache: 'no-store' }),
            authFetchServer(`${API_URL}/sales/items${query}`, { cache: 'no-store' }),
            supabase.from('expense_categories').select('name').eq('shop_id', 3).eq('is_personal', true)
        ])

        if (!salesRes.ok || !expensesRes.ok || !saleItemsRes.ok) {
            throw new Error(`Backend Error`)
        }

        const allSales = await salesRes.json()
        const allExpensesData = await expensesRes.json()
        const allSaleItems = await saleItemsRes.json()
        const personalCategories = categoriesRes.data || []
        const personalCategoryNames = personalCategories.map((c: any) => (c.name || '').toLowerCase())

        const tvaRate = 0.18
        const months = Array.from({ length: 12 }, (_, i) => i + 1)
        const isAgencyShop = shopId === '3'

        const history = months.map(m => {
            const monthStr = m.toString().padStart(2, '0')

            // Filter for this specific month
            const monthlySales = allSales.filter((s: any) => {
                const date = new Date(s.created_at)
                return (date.getMonth() + 1) === m && date.getFullYear().toString() === year
            })

            const monthlyExpenses = allExpensesData.filter((e: any) => {
                const date = new Date(e.date)
                const isCorrectMonth = (date.getMonth() + 1) === m && date.getFullYear().toString() === year
                if (!isCorrectMonth) return false
                const catName = (e.category || '').toLowerCase()
                const isPersonalCategory = e.shop_id === 3 && personalCategoryNames.includes(catName)
                const isPerso = catName === 'perso' || isPersonalCategory
                if (!isAgencyShop && isPerso) return false
                return true
            })

            const saleIds = new Set(monthlySales.map((s: any) => s.id))
            const monthlyItems = allSaleItems.filter((item: any) => saleIds.has(item.sale_id))

            // 1. Dynamic Revenue (Per-sale TVA)
            let totalSalesTTC = 0
            let totalSalesHT = 0
            let totalActualCash = 0

            monthlySales.forEach((s: any) => {
                const amount = Number(s.total_amount) || 0
                const withTva = s.with_tva !== false
                const paid = Number(s.paid_amount) || 0

                totalSalesTTC += amount
                totalActualCash += paid

                if (withTva) {
                    const ht = amount / (1 + tvaRate)
                    totalSalesHT += ht
                } else {
                    totalSalesHT += amount
                }
            })

            // 2. COGS & Variable Costs
            const totalCOGS = monthlyItems.reduce((acc: number, item: any) => {
                const p = item.products?.name ? item.products : item.products?.[0];
                return acc + (item.quantity * Number(p?.cost_price || 0))
            }, 0)

            const operationalVariableCosts = monthlyExpenses
                .filter((e: any) => e.is_recurring !== true)
                .reduce((acc: number, e: any) => acc + Number(e.amount), 0)

            const totalVariableCosts = totalCOGS + operationalVariableCosts
            const totalExpenses = monthlyExpenses.reduce((acc: number, e: any) => acc + Number(e.amount), 0)

            // 3. Fixed Costs (Monthly Templates)
            // Deduplicate by description to avoid double counting across the year
            const uniqueRecurringTemplates = new Map();
            allExpensesData.forEach((e: any) => {
                if (e.is_recurring !== true) return;
                const catName = (e.category || '').toLowerCase()
                const isPersonalCategory = e.shop_id === 3 && personalCategoryNames.includes(catName)
                const isPerso = catName === 'perso' || isPersonalCategory;
                if (e.shop_id !== 3 && isPerso) return;

                // Only keep the template definition (most recent based on date)
                const existing = uniqueRecurringTemplates.get(e.description);
                if (!existing || new Date(e.date) > new Date(existing.date)) {
                    uniqueRecurringTemplates.set(e.description, e);
                }
            });

            const fixedCosts = Array.from(uniqueRecurringTemplates.values())
                .reduce((acc: number, e: any) => {
                    let monthlyAmount = Number(e.amount) || 0
                    if (e.frequency === 'daily') monthlyAmount *= 30
                    else if (e.frequency === 'weekly') monthlyAmount *= 4
                    else if (e.frequency === 'yearly') monthlyAmount /= 12
                    return acc + monthlyAmount
                }, 0)

            // 4. MCV Ratio & SR
            // Business Rule: Fixed 40% TMCV
            const mcvRatio = 0.40
            const mcv = totalSalesHT - totalVariableCosts
            const realMcvRatio = totalSalesHT > 0 ? (mcv / totalSalesHT) : 0
            const seuilRentabilite = fixedCosts / mcvRatio

            return {
                month: m,
                monthName: new Date(Number(year), m - 1).toLocaleDateString('fr-FR', { month: 'long' }),
                year: Number(year),
                totalSalesHT,
                totalExpenses,
                margeNet: totalSalesHT - totalExpenses - totalCOGS,
                seuilRentabilite,
                actualCash: totalActualCash,
                realMcvRatio,
                isProfitable: totalSalesHT > 0 && totalSalesHT >= seuilRentabilite,
                progress: seuilRentabilite > 0 ? Math.min((totalSalesHT / seuilRentabilite) * 100, 100) : (totalSalesHT > 0 ? 100 : 0)
            }
        })

        // Only return months that have passed or are current
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()

        const filteredHistory = history.filter(h => {
            if (h.year < currentYear) return true
            if (h.year === currentYear) return h.month <= currentMonth
            return false
        })

        return NextResponse.json(filteredHistory)

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
