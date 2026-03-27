import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Zod schema for user creation input validation
const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'cashier', 'manager']).optional().default('cashier'),
    shopId: z.number().int().positive().nullable().optional(),
    shopIds: z.array(z.number().int().positive()).optional().default([]),
    hasStockAccess: z.boolean().optional().default(false),
}).strict()

export async function POST(req: Request) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    const serverSupabase = await createServerClient()

    // 1. Verify requester is ADMIN
    const { data: { user: requester } } = await serverSupabase.auth.getUser()
    if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await serverSupabase
        .from('profiles')
        .select('role')
        .eq('id', requester.id)
        .single()

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Validate input with Zod
    const rawBody = await req.json()
    const parsed = createUserSchema.safeParse(rawBody)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { email, password, role, shopId, shopIds, hasStockAccess } = parsed.data

    try {
        // 3. Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (authError) throw authError

        // 4. Create/Update profile — only allowed fields
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                email,
                role,
                shop_id: shopId || null,
                shop_ids: shopIds,
                has_stock_access: hasStockAccess
            })

        if (profileError) throw profileError

        return NextResponse.json({ success: true, user: authUser.user })
    } catch (err: any) {
        void err
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
