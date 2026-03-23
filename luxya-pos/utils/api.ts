import { createClient } from './supabase/client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3005";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://admin.lolly.sn";

/**
 * Fetch authentifié : injecte automatiquement le token Supabase dans le header Authorization.
 */
export async function authFetch(url: string, options: RequestInit = {}) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    return safeFetch(url, {
        ...options,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
}

/**
 * Enhanced fetch with retries and JSON protection.
 * Prevents "Unexpected token <" errors from HTML (Render cold starts/Auth redirects).
 */
export async function safeFetch(url: string, options: RequestInit = {}, retries = 3, backoff = 1000) {
    let lastError: any;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            const contentType = response.headers.get('content-type');

            // Critical check: if we get HTML (cold start, Maintenance, or Redirect)
            if (contentType && contentType.includes('text/html')) {
                // Received HTML instead of JSON - server may be starting up
                if (i < retries - 1) {
                    await new Promise(r => setTimeout(r, backoff * (i + 1)));
                    continue;
                }
                throw new Error("Le serveur renvoie un format invalide (HTML). Il est peut-être en cours de démarrage.");
            }

            if (!response.ok) {
                let errorMsg = `Erreur serveur (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) {}
                throw new Error(errorMsg);
            }

            const data = await response.json();
            return data;
        } catch (err: any) {
            lastError = err;
            // Retry attempt failed

            // Don't retry on certain errors (like 401 or 403 if they are final)
            if (err.message?.includes('401') || err.message?.includes('403')) {
                throw err;
            }

            if (i < retries - 1) {
                await new Promise(r => setTimeout(r, backoff * (i + 1)));
            }
        }
    }

    throw lastError;
}
