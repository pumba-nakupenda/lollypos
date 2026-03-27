import { NextResponse } from 'next/server'
import { API_URL } from '@/utils/api'
import { authFetchServer } from '@/utils/api-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist of allowed query parameters
const ALLOWED_PARAMS = ['startDate', 'endDate', 'shopId', 'limit']

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)

    // Filter to only allowed parameters
    const filteredParams = new URLSearchParams()
    for (const key of ALLOWED_PARAMS) {
        const value = searchParams.get(key)
        if (value !== null) {
            filteredParams.set(key, value)
        }
    }
    const params = filteredParams.toString()

    try {
        const res = await authFetchServer(
            `${API_URL}/analytics${params ? '?' + params : ''}`,
            { cache: 'no-store' }
        )
        const data = await res.json()
        return NextResponse.json(data, { status: res.ok ? 200 : 500 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
