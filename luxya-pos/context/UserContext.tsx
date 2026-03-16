'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'admin' | 'manager' | 'lead' | 'inventory' | 'cashier' | 'client'
export type UserAppType = 'staff' | 'client'

export interface UserProfile {
    id: string
    email: string | null
    role: UserRole
    user_type: UserAppType
    shop_id: number | null
    shop_ids?: number[]
    has_stock_access?: boolean
    is_super_admin?: boolean
}

interface UserContextType {
    profile: UserProfile | null
    loading: boolean
    error: string | null
    refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
    children,
    initialProfile
}: {
    children: React.ReactNode,
    initialProfile: UserProfile | null
}) {
    const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
    const [loading, setLoading] = useState(!initialProfile)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile', { cache: 'no-store' })
            const contentType = res.headers.get('content-type')

            // PROTECTION AGAINST COLD START / HTML REDIRECTS
            if (contentType && contentType.includes('text/html')) {
                setError("Le serveur de profil est en cours de démarrage. Veuillez patienter...")
                return
            }

            if (res.ok && contentType?.includes('application/json')) {
                const data = await res.json()

                // BLOQUER SI C'EST UN CLIENT (Lolly Shop only)
                if (data.user_type === 'client') {
                    setProfile(null)
                    setError("Accès refusé : Cette application est réservée au personnel Lolly.")
                    return
                }

                setProfile(data)
                setError(null)
            } else {
                const isJson = contentType?.includes('application/json')
                const errData = isJson ? await res.json().catch(() => ({})) : {}
                setError(errData.error || `Réponse invalide (${res.status})`)
            }
        } catch (err: any) {
            console.error('Failed to fetch profile:', err)
            setError(err.message || 'Erreur de connexion au profil')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile)
            setLoading(false)
        } else {
            fetchProfile()
        }
    }, [initialProfile])

    const refreshProfile = async () => {
        setLoading(true)
        await fetchProfile()
    }

    return (
        <UserContext.Provider value={{ profile, loading, error, refreshProfile }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
