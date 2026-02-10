
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { API_URL } from '@/utils/api'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        console.error('Login Error:', error.message)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // LOG CONNECTION TO BACKEND
    if (authData.user) {
        try {
            const head = await headers();
            const userAgent = head.get('user-agent') || 'Unknown Device';
            const ip = head.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

            await fetch(`${API_URL}/auth/log-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user.id,
                    email: authData.user.email,
                    device: userAgent,
                    ip: ip
                })
            });
        } catch (e) {
            console.error('Logging connection failed', e);
        }
    }

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
