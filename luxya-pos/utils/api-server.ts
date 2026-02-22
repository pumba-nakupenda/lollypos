'use server'

import { createClient } from './supabase/server'

/**
 * Fetch authentifié côté serveur (Server Actions, API Routes).
 * Récupère le token Supabase depuis les cookies et l'injecte dans le header Authorization.
 */
export async function authFetchServer(url: string, options: RequestInit = {}) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    return fetch(url, {
        ...options,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string> || {}),
        },
    })
}
