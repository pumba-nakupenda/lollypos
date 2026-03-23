'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { API_URL, authFetch } from '@/utils/api'
import { useUser } from '@/context/UserContext'

export default function CalendarCallback() {
    const { profile } = useUser()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    useEffect(() => {
        const code = searchParams.get('code')
        if (code && profile) {
            exchangeCode(code)
        }
    }, [searchParams, profile])

    const exchangeCode = async (code: string) => {
        if (!profile?.id) return;
        try {
            await authFetch(`${API_URL}/calendar/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, userId: profile.id })
            })

            setStatus('success')
            setTimeout(() => router.push('/calendar'), 2000)
        } catch (err) {
            // Error handled silently
            setStatus('error')
        }
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#050505]">
            {status === 'loading' && (
                <>
                    <Loader2 className="w-12 h-12 text-shop animate-spin mb-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-white">Connexion à Google...</h2>
                </>
            )}
            {status === 'success' && (
                <>
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-6 animate-bounce">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest text-white">Agenda lié avec succès !</h2>
                    <p className="text-muted-foreground mt-2">Redirection vers votre agenda...</p>
                </>
            )}
            {status === 'error' && (
                <>
                    <AlertCircle className="w-12 h-12 text-red-500 mb-6" />
                    <h2 className="text-xl font-black uppercase tracking-widest text-white">Erreur de liaison</h2>
                    <p className="text-muted-foreground mt-2">Veuillez réessayer plus tard.</p>
                    <button onClick={() => router.push('/calendar')} className="mt-8 px-8 py-3 bg-white text-black rounded-xl font-black uppercase text-xs">Retour</button>
                </>
            )}
        </div>
    )
}
