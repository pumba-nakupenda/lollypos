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
        const [salesRes, expensesRes, saleItemsRes, debtsRes] = await Promise.all([
            fetch(`${API_URL}/sales${query}`, { cache: 'no-store' }),
            fetch(expensesUrl, { cache: 'no-store' }),
            fetch(`${API_URL}/sales/items${query}`, { cache: 'no-store' }),
            shopId && shopId !== 'all' 
                ? supabase.from('debts').select('remaining_amount, status').eq('shop_id', shopId)
                : supabase.from('debts').select('remaining_amount, status')
        ])

        if (!salesRes.ok || !expensesRes.ok || !saleItemsRes.ok) {
            throw new Error(`Backend Error`)
        }

        let sales = await salesRes.json()
        let expenses = await expensesRes.json()
        let saleItems = await saleItemsRes.json()
        const debts = debtsRes.data || []

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
                totalDebts: totalRemainingDebts
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