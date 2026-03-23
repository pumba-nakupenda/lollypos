import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = (process.env.WEBHOOK_ALLOWED_HOSTS || '').split(',').filter(Boolean)

function isUrlAllowed(urlStr: string): boolean {
    try {
        const url = new URL(urlStr)
        // Block private/internal IPs
        if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(url.hostname)) {
            return false
        }
        // If an allowlist is configured, enforce it
        if (ALLOWED_HOSTS.length > 0) {
            return ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host))
        }
        // Block common internal ranges
        if (url.hostname.startsWith('10.') || url.hostname.startsWith('192.168.') || url.hostname.startsWith('169.254.')) {
            return false
        }
        return true
    } catch {
        return false
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { webhookUrl, payload } = body

        if (!webhookUrl) {
            return NextResponse.json({ error: 'Missing webhookUrl' }, { status: 400 })
        }

        if (!isUrlAllowed(webhookUrl)) {
            return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 })
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload ?? {})
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Le webhook a répondu avec le statut ${response.status}` },
                { status: 502 }
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
    } catch {
        return NextResponse.json({ error: 'Erreur lors de l\'appel au webhook' }, { status: 500 })
    }
}
