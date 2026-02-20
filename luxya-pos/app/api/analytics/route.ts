import { NextResponse } from 'next/server'
import { API_URL } from '@/utils/api'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get('shopId')
    const category = searchParams.get('category')
    const month = searchParams.get('month') // Format: MM
    const year = searchParams.get('year')   // Format: YYYY

    const query = shopId && shopId !== 'all' ? `?shopId=${shopId}` : ''

    try {
        const supabase = await createClient()
        const isGlobal = !shopId || shopId === 'all'
        const isAgency = shopId === '3'

        let expensesUrl = `${API_URL}/expenses${query}`
        if (isGlobal || isAgency) {
            expensesUrl += (query ? '&' : '?') + 'includePersonal=true'
        }

        // Fetch from NestJS Backend and Supabase
        const [salesRes, expensesRes, saleItemsRes, debtsRes, productsRes] = await Promise.all([
            fetch(`${API_URL}/sales${query}`, { cache: 'no-store' }),
            fetch(expensesUrl, { cache: 'no-store' }),
            fetch(`${API_URL}/sales/items${query}`, { cache: 'no-store' }),
            shopId && shopId !== 'all'
                ? supabase.from('debts').select('remaining_amount, status').eq('shop_id', shopId)
                : supabase.from('debts').select('remaining_amount, status'),
            // NEW: Fetch products for Stock Value Calculation
            shopId && shopId !== 'all'
                ? supabase.from('products').select('stock, cost_price, id').eq('shop_id', shopId)
                : supabase.from('products').select('stock, cost_price, id')
        ])

        if (!salesRes.ok || !expensesRes.ok || !saleItemsRes.ok) {
            throw new Error(`Backend Error`)
        }

        let sales = await salesRes.json()
        let expenses = await expensesRes.json()
        let saleItems = await saleItemsRes.json()
        const debts = debtsRes.data || []
        const products = productsRes.data || []

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

        // 1. Filter items by category if provided
        let filteredItems = saleItems
        if (category && category !== 'Toutes') {
            filteredItems = saleItems.filter((item: any) => item.products?.category === category)
        }

        // 2. Metrics calculation
        const totalSalesTTC = (category && category !== 'Toutes')
            ? filteredItems.reduce((acc: number, item: any) => acc + (item.quantity * Number(item.price)), 0)
            : (sales || []).reduce((acc: number, s: any) => acc + Number(s.total_amount), 0)

        const tvaRate = 0.18
        const totalSalesHT = totalSalesTTC / (1 + tvaRate)
        const totalTVA = totalSalesTTC - totalSalesHT

        const totalCOGS = filteredItems.reduce((acc: number, item: any) => {
            const p = item.products?.name ? item.products : item.products?.[0];
            const cost = Number(p?.cost_price || 0)
            return acc + (item.quantity * cost)
        }, 0)

        const margeBrute = totalSalesHT - totalCOGS

        // TOTAL EXPENSES (Manual override check for Shop 3)
        let totalExpenses = (expenses || []).reduce((acc: number, e: any) => acc + Number(e.amount), 0)

        const margeNet = margeBrute - totalExpenses

        // Debt calculation (only unpaid remaining amounts)
        const totalRemainingDebts = debts.reduce((acc, d) => acc + Number(d.remaining_amount), 0)

        // --- NEW FINANCIAL INDICATORS ---

        // 1. Stock Value (Valeur du Stock)
        // Only consider products with valid cost (fallback to 0)
        const totalStockValue = products.reduce((acc: number, p: any) => {
            return acc + ((Number(p.stock) || 0) * (Number(p.cost_price) || 0))
        }, 0)

        // 2. Rotation des Stocks (Stock Turnover)
        // Formula: COGS / Average Stock (Using End Stock as proxy if Avg not avail)
        // Improved: If stock value is 0, avoid division by zero
        const stockRotation = totalStockValue > 0 ? (totalCOGS / totalStockValue) : 0
        const stockDurationDays = stockRotation > 0 ? (365 / stockRotation) : 0

        // 3. Seuil de Rentabilité (Break-even Point)
        // SR = Charges Fixes / Taux de Marge sur Coût Variable
        // Assumption: All Expenses are "Fixed" for this simplified model, COGS are "Variable".
        // Taux Marge = (Sales HT - COGS) / Sales HT
        const tauxMarge = totalSalesHT > 0 ? ((totalSalesHT - totalCOGS) / totalSalesHT) : 0
        const seuilRentabilite = tauxMarge > 0 ? (totalExpenses / tauxMarge) : 0

        // 4. Point Mort (Break-even Date)
        // Point Mort (in days) = (Seuil de Rentabilité / Chiffre d'Affaires HT) * 365
        const pointMortDays = totalSalesHT > 0 ? ((seuilRentabilite / totalSalesHT) * 365) : 0

        // Calculate the actual date from start of year (simplified)
        // If filtering by month, this might need adjustment, but standard is annual View.
        // For monthly view, we map it to day of month.
        const currentYear = year ? Number(year) : new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const pointMortDate = new Date(startOfYear);
        pointMortDate.setDate(startOfYear.getDate() + Math.round(pointMortDays));

        // 5. BFR (Besoin en Fonds de Roulement)
        // BFR = Stocks + Créances Clients (Dettes) - Dettes Fournisseurs (Not tracked yet, assume 0)
        const bfr = totalStockValue + totalRemainingDebts // + 0 (Payables)

        // 6. FR (Fonds de Roulement - Working Capital) & Trésorerie Nette
        // Without Balance Sheet (Assets/Liabilities), we can't fully calc FR.
        // Proxy: FR might be approximated if we had Capital/LongTermDebt.
        // For now, will skip FR unless user inputs Capital.

        // 7. CAF (Capacité d'Autofinancement)
        // CAF = Résultat Net + Charges non décaissables (Amortissements)
        // Assuming no Amortization tracking yet:
        const caf = margeNet // + Amortissements (0)

        const financialMetics = {
            stockValue: totalStockValue,
            stockRotation: stockRotation,
            stockDurationDays: stockDurationDays,
            seuilRentabilite: seuilRentabilite,
            tauxMarge: tauxMarge,
            pointMortDays: pointMortDays,
            pointMortDate: pointMortDate.toISOString(),
            bfr: bfr,
            caf: caf
        }

        // 3. Trend Data
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

        // 4. Top Products
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
                totalExpenses,
                profit: margeNet,
                tva: totalTVA,
                margeBrute,
                margeNet,
                totalDebts: totalRemainingDebts,
                ...financialMetics // Add new metrics
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