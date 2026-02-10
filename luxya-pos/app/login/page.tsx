import { login, signup } from './actions'
import { Mail, Lock, LogIn, UserPlus, ShieldCheck, Store } from 'lucide-react'

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
    const error = searchParams?.error

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-shop/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-shop-secondary/10 rounded-full blur-[120px] animate-pulse delay-700" />

            <div className="w-full max-w-md z-10">
                {/* Logo & Header */}
                <div className="text-center mb-10 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-shop/10 border border-shop/20 rounded-[28px] shadow-2xl shadow-shop/20 animate-float">
                        <Store className="w-10 h-10 text-shop" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase shop-gradient-text">
                            Luxya POS
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2">
                            Premium Management System
                        </p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="glass-panel p-10 rounded-[48px] shadow-2xl relative group border-white/10">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent rounded-[48px] pointer-events-none" />
                    
                    <form className="space-y-6 relative z-10">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 text-center">
                                    {error}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">
                                Adresse Email
                            </label>
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-shop transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="admin@lolly.sn"
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-shop/50 focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">
                                Mot de passe
                            </label>
                            <div className="relative group/input">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-shop transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-sm focus:ring-2 focus:ring-shop/50 focus:border-shop/50 outline-none transition-all placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button
                                formAction={login}
                                type="submit"
                                className="w-full group relative flex items-center justify-center py-5 px-4 bg-shop text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-shop/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <LogIn className="w-4 h-4 mr-3" />
                                Se Connecter
                            </button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-[#0a0a0c] px-4 text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground">Ou</span>
                                </div>
                            </div>

                            <button
                                formAction={signup}
                                type="submit"
                                className="w-full flex items-center justify-center py-5 px-4 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                            >
                                <UserPlus className="w-4 h-4 mr-3" />
                                Créer un compte
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-10 flex items-center justify-center space-x-6 opacity-30">
                    <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">SSL Secured</span>
                    </div>
                    <div className="w-1 h-1 bg-white/50 rounded-full" />
                    <span className="text-[8px] font-black uppercase tracking-widest">v2.0 Premium</span>
                </div>
            </div>
        </div>
    )
}