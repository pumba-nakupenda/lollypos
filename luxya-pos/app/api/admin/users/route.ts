import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
    const supabaseAdmin = await createAdminClient()

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

    const { userId, role, shopId, shopIds, hasStockAccess, password, email } = await req.json()

    // 1. Update Auth if password or email is provided
    if (password || email) {
        const updateAuthData: any = {}
        if (password) updateAuthData.password = password
        if (email) updateAuthData.email = email

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updateAuthData
        )
        if (authError) {
            console.error('[Admin/Users] Auth Update Error:', authError)
            return NextResponse.json({ error: authError.message }, { status: 500 })
        }
    }

    // 2. Update Profile using Admin Client to bypass RLS
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (shopId !== undefined) updateData.shop_id = shopId
    if (shopIds !== undefined) updateData.shop_ids = shopIds
    if (hasStockAccess !== undefined) updateData.has_stock_access = hasStockAccess
    if (email !== undefined) updateData.email = email

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()

    if (error) {
        console.error('[Admin/Users] Profile Update Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(req: Request) {
    const supabase = await createClient()
    const supabaseAdmin = await createAdminClient()

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

    // Delete from Auth (cascades to profile if FK set, but we delete profile explicitly to be safe)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
        console.error('[Admin/Users] Auth Delete Error:', authError)
        return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Profile delete (if not already deleted by cascade)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    return NextResponse.json({ success: true })
}
