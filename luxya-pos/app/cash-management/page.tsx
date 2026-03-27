'use client'

import React, { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Lock,
    Unlock,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Calendar,
    ChevronRight,
    AlertCircle,
    Plus,
    X,
    Loader2
} from 'lucide-react'
import { useShop } from '@/context/ShopContext'
import { useUser } from '@/context/UserContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/client'
import { CashSession, CashMovement } from '@/types/models'

type SessionRow = Pick<CashSession, 'id' | 'status' | 'opening_balance' | 'closed_at' | 'closing_balance_actual' | 'closing_balance_theoretical'>
type MovementRow = Pick<CashMovement, 'id' | 'type' | 'amount' | 'description' | 'source' | 'payment_method' | 'created_at'>

export default function CashManagementPage() {
    const { activeShop } = useShop()
    const { profile } = useUser()
    const { showToast } = useToast()
    const supabase = createClient()

    const [currentSession, setCurrentSession] = useState<SessionRow | null>(null)
    const [lastSessions, setLastSessions] = useState<SessionRow[]>([])
    const [movements, setMovements] = useState<MovementRow[]>([])
    const [loading, setLoading] = useState(true)
    const [isActionModalOpen, setIsActionModalOpen] = useState(false)
    const [actionType, setActionType] = useState<'income' | 'outcome' | 'deposit' | 'withdrawal' | 'open' | 'close'>('income')

    // Form states
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [processing, setProcessing] = useState(false)
    const [payMethod, setPayMethod] = useState<'cash' | 'wave' | 'om'>('cash')

    useEffect(() => {
        if (activeShop) {
            fetchCurrentSession()
            fetchHistory()
        }
    }, [activeShop])

    const fetchCurrentSession = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('cash_sessions')
                .select('id, status, opening_balance, closed_at, closing_balance_actual, closing_balance_theoretical')
                .eq('shop_id', activeShop?.id)
                .eq('status', 'open')
                .maybeSingle()

            if (data) {
                setCurrentSession(data)
                fetchMovements(data.id)
            } else {
                setCurrentSession(null)
                setMovements([])
            }
        } catch (err) {
            // silently ignore
        } finally {
            setLoading(false)
        }
    }

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('cash_sessions')
            .select('id, status, opening_balance, closed_at, closing_balance_actual, closing_balance_theoretical')
            .eq('shop_id', activeShop?.id)
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(5)
        if (data) setLastSessions(data)
    }

    const fetchMovements = async (sessionId: string) => {
        const { data } = await supabase
            .from('cash_movements')
            .select('id, type, amount, description, source, payment_method, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
        if (data) setMovements(data)
    }

    const handleOpenSession = async () => {
        if (!amount || isNaN(parseFloat(amount))) return showToast("Saisissez le fond de caisse", "warning")

        setProcessing(true)
        try {
            const { data, error } = await supabase
                .from('cash_sessions')
                .insert([{
                    shop_id: activeShop?.id,
                    opening_balance: parseFloat(amount),
                    status: 'open',
                    opened_by: profile?.id
                }])
                .select()
                .single()

            if (error) throw error
            showToast("Caisse ouverte !", "success")
            setCurrentSession(data)
            setIsActionModalOpen(false)
            setAmount('')
            fetchCurrentSession()
        } catch (err) {
            showToast("Erreur d'ouverture", "error")
        } finally {
            setProcessing(false)
        }
    }

    const handleCloseSession = async () => {
        if (!amount || isNaN(parseFloat(amount))) return showToast("Saisissez le montant réel en caisse", "warning")

        setProcessing(true)
        try {
            const theoretical = metrics.theoreticalCash
            const { error } = await supabase
                .from('cash_sessions')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    closing_balance_theoretical: theoretical,
                    closing_balance_actual: parseFloat(amount),
                    closed_by: profile?.id
                })
                .eq('id', currentSession!.id)

            if (error) throw error
            showToast("Caisse clôturée !", "success")
            setCurrentSession(null)
            setIsActionModalOpen(false)
            setAmount('')
            fetchHistory()
        } catch (err) {
            showToast("Erreur de clôture", "error")
        } finally {
            setProcessing(false)
        }
    }

    const handleMovement = async () => {
        if (!amount || !description) return showToast("Remplissez tous les champs", "warning")

        setProcessing(true)
        try {
            const { error } = await supabase
                .from('cash_movements')
                .insert([{
                    session_id: currentSession!.id,
                    shop_id: activeShop?.id,
                    type: actionType,
                    amount: parseFloat(amount),
                    description,
                    source: 'manual',
                    payment_method: payMethod
                }])

            if (error) throw error
            showToast("Mouvement enregistré", "success")
            setIsActionModalOpen(false)
            setAmount('')
            setDescription('')
            fetchMovements(currentSession!.id)
        } catch (err) {
            showToast("Erreur d'enregistrement", "error")
        } finally {
            setProcessing(false)
        }
    }

    const metrics = movements.reduce((acc, m) => {
        const val = Number(m.amount)
        const method = m.payment_method || 'cash'

        if (m.type === 'income' || m.type === 'deposit') {
            acc.in += val
            acc.wallets[method] = (acc.wallets[method] || 0) + val
        }
        if (m.type === 'outcome' || m.type === 'withdrawal') {
            acc.out += val
            acc.wallets[method] = (acc.wallets[method] || 0) - val
        }
        return acc
    }, {
        in: 0,
        out: 0,
        theoreticalCash: currentSession ? Number(currentSession.opening_balance) : 0,
        wallets: {} as Record<string, number>
    })

    // Initialize wallets with opening balance if it exists
    if (currentSession && metrics.theoreticalCash > 0) {
        metrics.wallets['cash'] = (metrics.wallets['cash'] || 0) + metrics.theoreticalCash
    }

    metrics.theoreticalCash = (currentSession ? Number(currentSession.opening_balance) : 0) + metrics.in - metrics.out

    if (loading && !currentSession && lastSessions.length === 0) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-shop animate-spin opacity-20" />
        </div>
    )

    return (
        <div className="min-h-screen flex flex-col p-4 sm:p-8 space-y-8 bg-[#050505] text-white">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-shop/20 rounded-2xl flex items-center justify-center text-shop shadow-xl border border-shop/20">
                        <LayoutDashboard className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter shop-gradient-text">
                            Ma Caisse
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            {activeShop?.name} • Flux Physique
                        </p>
                    </div>
                </div>

                {currentSession ? (
                    <div className="flex items-center space-x-4">
                        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-[10px] font-black uppercase flex items-center">
                            <Unlock className="w-3.5 h-3.5 mr-2" /> Session Ouverte
                        </div>
                        <button
                            onClick={() => { setActionType('close'); setIsActionModalOpen(true); }}
                            className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-500/20"
                        >
                            Clôturer la Caisse
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { setActionType('open'); setIsActionModalOpen(true); }}
                        className="px-8 py-3.5 bg-shop text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-shop/20"
                    >
                        Ouvrir la Caisse
                    </button>
                )}
            </header>

            {currentSession && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard title="Fond de Caisse" value={currentSession.opening_balance} icon={<Calendar className="w-6 h-6" />} color="blue" />
                    <MetricCard title="Total Entrées" value={metrics.in} icon={<TrendingUp className="w-6 h-6" />} color="green" />
                    <MetricCard title="Total Sorties" value={metrics.out} icon={<TrendingDown className="w-6 h-6" />} color="red" />
                    <MetricCard title="Solde Théorique" value={metrics.theoreticalCash} icon={<DollarSign className="w-6 h-6" />} color="shop" highlight />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                {/* Session Actions & Recent History */}
                <div className="lg:col-span-2 space-y-8">
                    {currentSession ? (
                        <div className="glass-panel p-8 rounded-[40px] border-white/5 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Journal des Mouvements</h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Aujourd'hui • Session #{currentSession.id}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => { setActionType('withdrawal'); setIsActionModalOpen(true); }}
                                        className="p-2.5 bg-white/5 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 rounded-xl transition-all border border-white/5"
                                        title="Retrait Manuel"
                                    >
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => { setActionType('deposit'); setIsActionModalOpen(true); }}
                                        className="p-2.5 bg-white/5 hover:bg-green-500/10 text-muted-foreground hover:text-green-400 rounded-xl transition-all border border-white/5"
                                        title="Dépôt Manuel"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                {movements.map((move: MovementRow) => (
                                    <div key={move.id} className="flex items-center justify-between p-5 glass-card rounded-2xl hover:border-white/10 transition-all border-transparent">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${move.type === 'income' || move.type === 'deposit'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {move.type === 'income' || move.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase">{move.description}</p>
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{move.source}</p>
                                                    <span className="text-[8px] text-white/20">•</span>
                                                    <p className="text-[9px] text-shop font-black uppercase tracking-widest">{move.payment_method || 'cash'}</p>
                                                    <span className="text-[8px] text-white/20">•</span>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{new Date(move.created_at).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`text-right font-black text-sm ${move.type === 'income' || move.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                            {move.type === 'income' || move.type === 'deposit' ? '+' : '-'}{Number(move.amount).toLocaleString()} CFA
                                        </div>
                                    </div>
                                ))}
                                {movements.length === 0 && (
                                    <div className="h-40 flex flex-col items-center justify-center opacity-20">
                                        <History className="w-12 h-12 mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest">Aucun mouvement</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-12 rounded-[40px] flex flex-col items-center justify-center text-center space-y-6 border-white/5 border-dashed bg-white/[0.01]">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                <Lock className="w-10 h-10 text-muted-foreground opacity-20" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase">
                                    Caisse Fermée
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto">
                                    Veuillez démarrer une session pour enregistrer les flux aujourd'hui.
                                </p>
                            </div>
                            <button
                                onClick={() => { setActionType('open'); setIsActionModalOpen(true); }}
                                className="px-10 py-4 bg-shop text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-shop/20 hover:scale-105 transition-all"
                            >
                                Commencer la Journée
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: History & Tips */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-[40px] border-white/5 bg-white/[0.01]">
                        <h3 className="text-sm font-black uppercase tracking-tight mb-6">Dernières Clôtures</h3>
                        <div className="space-y-4">
                            {lastSessions.map((session: SessionRow) => (
                                <div key={session.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-muted-foreground">{session.closed_at ? new Date(session.closed_at).toLocaleDateString() : '—'}</span>
                                        <div className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${Number(session.closing_balance_actual) >= Number(session.closing_balance_theoretical)
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {Number(session.closing_balance_actual) >= Number(session.closing_balance_theoretical) ? 'Équilibrée' : 'Écart'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-muted-foreground">Théorique</p>
                                            <p className="text-xs font-black text-white">{Number(session.closing_balance_theoretical).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase text-muted-foreground">Réel</p>
                                            <p className="text-xs font-black text-shop">{Number(session.closing_balance_actual).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {isActionModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-background/40 animate-in fade-in duration-300">
                    <div className="relative glass-card w-full max-w-md p-10 rounded-[48px] shadow-2xl border-white/10 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsActionModalOpen(false)} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6 text-white" /></button>

                        <div className="flex items-center space-x-5 mb-10">
                            <div className={`w-16 h-16 ${actionType === 'close' || actionType === 'outcome' || actionType === 'withdrawal'
                                ? 'bg-red-500/20 text-red-400 border-red-500/20'
                                : 'bg-shop/20 text-shop border-shop/20'
                                } rounded-3xl flex items-center justify-center border shadow-2xl`}>
                                {actionType === 'open' ? <Unlock className="w-8 h-8" /> : actionType === 'close' ? <Lock className="w-8 h-8" /> : <DollarSign className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                                    {actionType === 'open' ? 'Ouverture Caisse' :
                                        actionType === 'close' ? 'Clôture Caisse' :
                                            actionType === 'deposit' ? 'Dépôt Manuel' : 'Retrait Manuel'}
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">Saisie de mouvement</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">
                                    {actionType === 'open' ? 'Fond de caisse initial' :
                                        actionType === 'close' ? 'Somme réelle en caisse' : 'Montant'}
                                </label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-white transition-colors" />
                                    <input
                                        type="number"
                                        aria-label="Montant"
                                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 pl-14 pr-6 text-2xl font-black outline-none focus:border-white/20 transition-all text-white"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {actionType !== 'open' && actionType !== 'close' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Description / Motif</label>
                                    <textarea
                                        aria-label="Description"
                                        className="w-full bg-white/5 border border-white/10 rounded-[24px] py-5 px-6 text-sm font-bold outline-none focus:border-white/20 transition-all text-white min-h-[100px]"
                                        placeholder="Ex: Achat fournitures bureau..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            )}

                            {actionType !== 'open' && actionType !== 'close' && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-3">Mode / Wallet</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['cash', 'wave', 'om'].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setPayMethod(m as 'cash' | 'wave' | 'om')}
                                                className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${payMethod === m
                                                        ? 'bg-shop text-white border-shop'
                                                        : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {actionType === 'close' && (
                                <div className="p-5 bg-red-400/5 rounded-[24px] border border-red-400/10 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">Solde Théorique calculé :</span>
                                        <span className="text-sm font-black text-white">{metrics.theoreticalCash.toLocaleString()} CFA</span>
                                    </div>
                                    <p className="text-[8px] text-red-400/60 font-medium italic">
                                        Assurez-vous de compter tout le cash physiquement présent dans votre tiroir.
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={actionType === 'open' ? handleOpenSession : actionType === 'close' ? handleCloseSession : handleMovement}
                                disabled={processing}
                                className={`w-full py-6 ${actionType === 'close' || actionType === 'outcome' || actionType === 'withdrawal'
                                    ? 'bg-red-600 shadow-red-600/40'
                                    : 'bg-shop shadow-shop/40'
                                    } text-white font-black uppercase tracking-[0.2em] rounded-[28px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl text-xs disabled:opacity-50`}
                            >
                                {processing ? 'Opération...' : 'Valider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

interface MetricCardProps {
    title: string
    value: number
    icon: React.ReactNode
    color: 'shop' | 'green' | 'red' | 'blue'
    highlight?: boolean
}

function MetricCard({ title, value, icon, color, highlight }: MetricCardProps) {
    const colorMap: Record<string, string> = {
        shop: 'text-shop bg-shop/10 border-shop/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    }

    return (
        <div className={`glass-panel p-6 rounded-[32px] border-white/5 relative overflow-hidden group ${highlight ? 'ring-1 ring-shop/20' : ''}`}>
            <div className={`absolute -right-2 -top-2 opacity-[0.03] group-hover:scale-110 transition-all`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-20 h-20' })}
            </div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{title}</p>
            <div className="flex items-baseline space-x-2 relative z-10">
                <h2 className={`text-2xl font-black tracking-tight ${colorMap[color].split(' ')[0]}`}>{value.toLocaleString()}</h2>
                <span className="text-[10px] font-bold opacity-30">CFA</span>
            </div>
            {highlight && (
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-[8px] font-black uppercase text-muted-foreground">
                    <AlertCircle className="w-3 h-3 mr-1.5 opacity-50" /> Basé sur les flux enregistrés
                </div>
            )}
        </div>
    )
}
