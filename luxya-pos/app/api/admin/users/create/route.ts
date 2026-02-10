import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'

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

    // 2. Extract new user data
    const { email, password, role, shopId, hasStockAccess } = await req.json()

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    try {
        // 3. Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (authError) throw authError

        // 4. Create/Update profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                email,
                role: role || 'cashier',
                shop_id: shopId || null,
                has_stock_access: hasStockAccess || false
            })

        if (profileError) throw profileError

        return NextResponse.json({ success: true, user: authUser.user })
    } catch (err: any) {
        console.error('[Admin/CreateUser] Error:', err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
