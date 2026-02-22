'use client'

import { API_URL } from '@/utils/api'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function DiagPage() {
    const [status, setStatus] = useState<'testing' | 'ok' | 'fail'>('testing')
    const [msg, setMsg] = useState('')
    const supabase = createClient()

    useEffect(() => {
        async function check() {
            try {
                const res = await fetch(`${API_URL}/health`)
                if (res.ok) {
                    setStatus('ok')
                    setMsg('Connexion au backend réussie')
                } else {
                    setStatus('fail')
                    setMsg(`Erreur backend: ${res.status}`)
                }
            } catch (e: any) {
                setStatus('fail')
                setMsg(`Échec de connexion au backend: ${e.message}`)
            }
        }
        check()
    }, [])

    return (
        <div className="p-10 space-y-4 font-mono text-xs">
            <h1 className="text-xl font-bold">Diagnostics POS</h1>
            <div className="space-y-2 bg-black/50 p-4 rounded border border-white/10">
                <p>NEXT_PUBLIC_API_URL: <span className="text-shop">{API_URL}</span></p>
                <p>NEXT_PUBLIC_SUPABASE_URL: <span className="text-blue-400">{process.env.NEXT_PUBLIC_SUPABASE_URL || 'MISSING'}</span></p>
            </div>

            <div className={`p-4 rounded border ${status === 'ok' ? 'bg-green-500/10 border-green-500/30' : status === 'fail' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                <p className="font-bold uppercase tracking-widest text-[10px]">Statut Connexion Backend:</p>
                <p className="mt-1">{msg}</p>
            </div>

            <div className="text-muted-foreground pt-4">
                <p>Si NEXT_PUBLIC_API_URL est "http://127.0.0.1:3005", alors les variables d'environnement Vercel ne sont pas activées ou manquent.</p>
                <p className="mt-2">Veuillez vérifier que vous avez ajouté NEXT_PUBLIC_API_URL=https://lollypos-backend.onrender.com dans les réglages de votre projet Vercel.</p>
            </div>
        </div>
    )
}
