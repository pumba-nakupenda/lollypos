import { NextRequest, NextResponse } from 'next/server'

// Whitelist of allowed domains (n8n only)
const ALLOWED_DOMAINS = [
    'n8n.lolly.sn',
    'n8n.luxya.sn',
]

// Check if a hostname resolves to a private IP range
function isPrivateHostname(hostname: string): boolean {
    const privatePatterns = [
        /^localhost$/i,
        /^127\.\d+\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
        /^192\.168\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^::1$/,
        /^\[::1\]$/,
        /^0:0:0:0:0:0:0:1$/,
    ]
    return privatePatterns.some(p => p.test(hostname))
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { webhookUrl, payload } = body

        if (!webhookUrl) {
            return NextResponse.json({ error: 'Missing webhookUrl' }, { status: 400 })
        }

        // Validate URL format
        let parsedUrl: URL
        try {
            parsedUrl = new URL(webhookUrl)
        } catch {
            return NextResponse.json({ error: 'Invalid webhookUrl format' }, { status: 400 })
        }

        // Enforce HTTPS only
        if (parsedUrl.protocol !== 'https:') {
            return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
        }

        // Block private/internal IPs
        if (isPrivateHostname(parsedUrl.hostname)) {
            return NextResponse.json({ error: 'Private/internal URLs are not allowed' }, { status: 400 })
        }

        // Whitelist check: only allowed domains
        if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
            return NextResponse.json({ error: 'Domain not in whitelist' }, { status: 403 })
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
        // silently ignore
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
