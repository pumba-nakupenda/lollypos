
'use client'

import React from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Loader2 } from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const { isAdmin, loading } = useUser();
    const router = useRouter();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#eaeded]">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 animate-spin text-lolly mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Vérification des droits...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#eaeded] p-6">
                <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-red-100 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Zone Réservée</h1>
                    <p className="text-gray-500 text-sm mb-10 font-medium">Vous n'avez pas l'autorisation d'accéder au panneau d'administration Lolly SAS.</p>
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all"
                    >
                        Retourner au site
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
