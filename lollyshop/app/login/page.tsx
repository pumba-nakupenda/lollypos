
'use client'

import React, { useState, useMemo } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const supabase = useMemo(() => createClient(), []);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push('/');
        } catch (e: any) {
            setError(e.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#eaeded]">
            {/* Header Mini */}
            <div className="p-10 flex flex-col items-center">
                <Link href="/" className="brand-lolly text-5xl italic font-black mb-10">
                    LOLLY<span className="text-lolly">.</span>
                </Link>

                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-gray-200">
                    <h1 className="text-2xl font-bold mb-6">S'identifier</h1>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="email" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-lolly transition-all"
                                    placeholder="nom@exemple.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-lolly transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-[#fde700] hover:bg-[#f5d600] text-black rounded-lg font-black uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuer'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">
                            Accès réservé au personnel Lolly & clients enregistrés
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex items-center space-x-6">
                    <Link href="/" className="text-xs font-bold text-[#007185] hover:underline flex items-center">
                        <ArrowLeft className="w-3 h-3 mr-2" /> Retour à la boutique
                    </Link>
                    <div className="w-px h-4 bg-gray-300" />
                    <span className="text-[10px] font-black uppercase text-gray-400 flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1 text-green-600" /> Sécurisé par Lolly Guard
                    </span>
                </div>
            </div>
        </div>
    );
}
