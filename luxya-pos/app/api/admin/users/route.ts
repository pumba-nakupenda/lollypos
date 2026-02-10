import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// Admin client with service role to manage auth users
const getAdminClient = () => createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function GET() {
    // ... (existing GET remains same)
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(users)
}

export async function PATCH(req: Request) {
    const supabase = await createClient()

    // Check if requester is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, role, shopId, hasStockAccess, password, email } = await req.json()

    // 1. Update Auth if password or email is provided
    if (password || email) {
        const supabaseAdmin = getAdminClient()
        const updateAuthData: any = {}
        if (password) updateAuthData.password = password
        if (email) updateAuthData.email = email

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updateAuthData
        )
        if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2. Update Profile
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (shopId !== undefined) updateData.shop_id = shopId
    if (hasStockAccess !== undefined) updateData.has_stock_access = hasStockAccess
    if (email !== undefined) updateData.email = email

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
}

export async function DELETE(req: Request) {
    const supabase = await createClient()

    // Check if requester is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    if (userId === user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })

    const supabaseAdmin = getAdminClient()

    // Delete from Auth (cascades to profile if FK set, but we delete profile explicitly to be safe)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    // Profile delete (if not already deleted by cascade)
    await supabase.from('profiles').delete().eq('id', userId)

    return NextResponse.json({ success: true })
}
