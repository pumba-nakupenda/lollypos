import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { webhookUrl, payload } = body

        if (!webhookUrl) {
            return NextResponse.json({ error: 'Missing webhookUrl' }, { status: 400 })
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const text = await response.text()
            return NextResponse.json(
                { error: `n8n responded with ${response.status}: ${text}` },
                { status: response.status }
            )
        }

        let data: any
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
            data = await response.json()
        } else {
            data = { message: await response.text() }
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        console.error('[WEBHOOK PROXY] Error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
