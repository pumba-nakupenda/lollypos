import { NextResponse } from 'next/server'
import { API_URL } from '@/utils/api'
import { authFetchServer } from '@/utils/api-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    // Remove internal cache-busting param before forwarding
    searchParams.delete('_')
    const params = searchParams.toString()

    try {
        const res = await authFetchServer(
            `${API_URL}/analytics/history${params ? '?' + params : ''}`,
            { cache: 'no-store' }
        )
        const data = await res.json()
        return NextResponse.json(data, { status: res.ok ? 200 : 500 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
