import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Zod schemas for input validation
const patchUserSchema = z.object({
    userId: z.string().uuid(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['admin', 'cashier', 'manager']).optional(),
    shopId: z.number().int().positive().nullable().optional(),
    shopIds: z.array(z.number().int().positive()).optional(),
    hasStockAccess: z.boolean().optional(),
}).strict()

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

    // Validate input with Zod
    const rawBody = await req.json()
    const parsed = patchUserSchema.safeParse(rawBody)
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { userId, role, shopId, shopIds, hasStockAccess, password, email } = parsed.data

    // 1. Update Auth if password or email is provided
    if (password || email) {
        const updateAuthData: Record<string, string> = {}
        if (password) updateAuthData.password = password
        if (email) updateAuthData.email = email

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updateAuthData
        )
        if (authError) {
            // silently ignore
            return NextResponse.json({ error: authError.message }, { status: 500 })
        }
    }

    // 2. Update Profile using Admin Client to bypass RLS — only allowed fields
    const updateData: Record<string, unknown> = {}
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
        // silently ignore
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

    // Validate userId is a UUID
    const uuidSchema = z.string().uuid()
    const uuidResult = uuidSchema.safeParse(userId)
    if (!uuidResult.success) {
        return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 })
    }

    // Delete from Auth (cascades to profile if FK set, but we delete profile explicitly to be safe)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
        // silently ignore
        return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Profile delete (if not already deleted by cascade)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    return NextResponse.json({ success: true })
}
