import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET() {
    try {
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

        if (error) return NextResponse.json({ error: 'Erreur lors du chargement des utilisateurs' }, { status: 500 })

        return NextResponse.json(users)
    } catch {
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
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

        if (!userId || !UUID_REGEX.test(userId)) {
            return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 })
        }

        if (role !== undefined && !['admin', 'cashier', 'manager'].includes(role)) {
            return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
        }

        if (password !== undefined && password.length < 6) {
            return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 })
        }

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
                return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'authentification' }, { status: 500 })
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
            return NextResponse.json({ error: 'Erreur lors de la mise à jour du profil' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
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

        if (!userId || !UUID_REGEX.test(userId)) {
            return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 })
        }
        if (userId === user.id) return NextResponse.json({ error: 'Impossible de supprimer votre propre compte' }, { status: 400 })

        // Delete profile first (non-critical if cascade handles it)
        await supabaseAdmin.from('profiles').delete().eq('id', userId)

        // Delete from Auth (this is the authoritative delete)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authError) {
            return NextResponse.json({ error: 'Erreur lors de la suppression de l\'utilisateur' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
    }
}
