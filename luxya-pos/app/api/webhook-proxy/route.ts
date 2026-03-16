import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_WEBHOOK_HOSTS = ['n8n.lolly.sn', 'hooks.n8n.cloud', 'localhost', '127.0.0.1']

function isAllowedWebhookUrl(url: string): boolean {
    try {
        const parsed = new URL(url)
        return ALLOWED_WEBHOOK_HOSTS.some(
            host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)
        )
    } catch {
        return false
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { webhookUrl, payload } = body

        if (!webhookUrl || !isAllowedWebhookUrl(webhookUrl)) {
            return NextResponse.json({ error: 'webhookUrl non autorisée' }, { status: 400 })
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
