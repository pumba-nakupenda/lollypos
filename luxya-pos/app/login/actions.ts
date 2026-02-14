
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { API_URL } from '@/utils/api'

export async function login(formData: FormData) {
    console.log('[LoginAction] Starting login process...')
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('[LoginAction] Attempting auth for:', email)
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('[LoginAction] Auth Error:', error.message)
        return redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log('[LoginAction] Auth successful for:', authData.user?.email)

    /* 
    // TEMPORARILY DISABLED TO TROUBLESHOOT CRASH
    // LOG CONNECTION TO BACKEND
    if (authData.user) {
        try {
            const head = await headers();
            const userAgent = head.get('user-agent') || 'Unknown Device';
            const ip = head.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

            console.log('[LoginAction] Logging connection to backend:', API_URL)
            const logRes = await fetch(`${API_URL}/auth/log-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user.id,
                    email: authData.user.email,
                    device: userAgent,
                    ip: ip
                })
            });
            console.log('[LoginAction] Backend log status:', logRes.status)
        } catch (e: any) {
            console.error('[LoginAction] Logging connection failed (non-critical):', e.message);
        }
    }
    */

    console.log('[LoginAction] Revalidating and redirecting...')
    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signUp(data)

    if (error) {
        console.error('Signup Error:', error.message)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Create profile if signup was successful
    if (authData.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    email: authData.user.email,
                    role: 'cashier', // Default role
                    has_stock_access: false
                }
            ])
        if (profileError) {
            console.error('Profile Creation Error:', profileError.message)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
