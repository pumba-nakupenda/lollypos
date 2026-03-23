import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    // 2. Extract and validate new user data
    const { email, password, role, shopId, shopIds, hasStockAccess } = await req.json()

    if (!email || !password) {
        return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 })
    }

    if (password.length < 6) {
        return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
    }

    if (role && !['admin', 'cashier', 'manager'].includes(role)) {
        return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
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
                shop_ids: shopIds || [],
                has_stock_access: hasStockAccess === true
            })

        if (profileError) {
            // Rollback: delete the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            throw profileError
        }

        return NextResponse.json({ success: true, user: authUser.user })
    } catch {
        return NextResponse.json({ error: 'Erreur lors de la création de l\'utilisateur' }, { status: 500 })
    }
}
