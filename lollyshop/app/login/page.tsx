
'use client'

import React, { useState, useMemo } from 'react';
import { createClient } from '../../utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const supabase = useMemo(() => createClient(), []);
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignup) {
                // 1. Sign up user
                const { data: authData, error: signupError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signupError) throw signupError;

                if (authData.user) {
                    // 2. Update the profile with mandatory info
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({
                            full_name: fullName,
                            phone: phone,
                            user_type: 'client'
                        })
                        .eq('id', authData.user.id);
                    
                    if (profileError) throw profileError;
                }
                alert("Compte créé avec succès !");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
            router.push('/');
        } catch (e: any) {
            setError(e.message || "Erreur d'authentification");
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

                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-gray-200 transition-all">
                    <h1 className="text-2xl font-bold mb-6">{isSignup ? 'Créer un compte' : 'S\'identifier'}</h1>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-6">
                        {isSignup && (
                            <>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Nom Complet</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-lolly transition-all"
                                        placeholder="Prénom Nom"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Téléphone</label>
                                    <input 
                                        type="tel" 
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-lolly transition-all"
                                        placeholder="77 000 00 00"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

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
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignup ? 'Créer mon compte' : 'Continuer'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col space-y-4">
                        <button 
                            onClick={() => setIsSignup(!isSignup)}
                            className="text-xs text-center font-bold text-[#007185] hover:underline"
                        >
                            {isSignup ? 'Déjà un compte ? Connectez-vous' : 'Nouveau client ? Créez un compte'}
                        </button>
                        <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">
                            {isSignup ? 'Informations obligatoires pour la livraison' : 'Accès réservé au personnel Lolly & clients enregistrés'}
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
