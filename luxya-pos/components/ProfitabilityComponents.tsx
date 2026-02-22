import React from 'react'
import {
    Calendar,
    BarChart3,
    TrendingUp,
    TrendingDown
} from 'lucide-react'

export function InfoTooltip({ text }: { text: string }) {
    return (
        <div className="group/tooltip relative inline-block ml-2 cursor-help">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] sm:text-[9px] font-black text-muted-foreground group-hover/tooltip:bg-shop group-hover/tooltip:text-white transition-colors">
                ?
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-bold text-white opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-[100] shadow-2xl leading-relaxed text-center">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
            </div>
        </div>
    )
}

export function ProfitabilityIndicator({ currentTurnover, breakEvenPoint, pointMortDate, isOutOfRange, actualCash }: { currentTurnover: number, breakEvenPoint: number, pointMortDate?: string, isOutOfRange?: boolean, actualCash?: number }) {
    const isProfitable = currentTurnover >= breakEvenPoint;
    const difference = Math.abs(breakEvenPoint - currentTurnover);
    const progress = breakEvenPoint > 0 ? Math.min((currentTurnover / breakEvenPoint) * 100, 100) : (currentTurnover > 0 ? 100 : 0);

    const formattedDate = pointMortDate ? new Date(pointMortDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }) : '';

    return (
        <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border-white/5 bg-white/[0.01] relative overflow-hidden group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
                <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center">
                        <BarChart3 className={`w-5 h-5 sm:w-6 sm:h-6 mr-3 ${isProfitable ? 'text-green-400' : 'text-red-500'}`} />
                        Indicateur de Rentabilité
                    </h3>
                    <div className="text-[9px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center">
                        Logique de Coûts Fixes vs Variables
                        <InfoTooltip text="Calcul raffiné : Charges Fixes (récurrentes) vs Marge sur Coûts Variables (CA HT - COGS - Charges périodiques)." />
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-xs sm:text-sm font-black uppercase tracking-widest ${isProfitable ? 'text-green-400' : 'text-red-500'}`}>
                        {isProfitable ? 'Objectif Atteint' : 'En progression'}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black tracking-tighter">
                        {Math.round(progress)}%
                    </p>
                </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
                <div className="relative h-4 sm:h-6 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                        className={`h-full transition-all duration-1000 ease-out rounded-full shadow-[0_0_20px_rgba(var(--color-rgb),0.3)] ${isProfitable
                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                            : 'bg-gradient-to-r from-red-600 to-orange-500'
                            }`}
                        style={{
                            width: `${progress}%`,
                            ['--color-rgb' as any]: isProfitable ? '74, 222, 128' : '239, 68, 68'
                        }}
                    />
                </div>

                <div className={`p-4 rounded-2xl border ${isProfitable ? 'bg-green-500/5 border-green-500/10' : 'bg-white/5 border-white/10'} flex items-center justify-between`}>
                    <div className="flex items-center space-x-3">
                        <Calendar className={`w-5 h-5 ${isProfitable ? 'text-green-400' : 'text-muted-foreground'}`} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Point Mort (Estimation)</p>
                            <p className="text-sm font-bold">
                                {isProfitable
                                    ? `Atteint le : ${formattedDate}`
                                    : isOutOfRange
                                        ? "Non atteignable ce mois-ci au rythme actuel"
                                        : `Prévu pour le : ${formattedDate}`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 pt-2">
                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 mb-1 sm:mb-2 text-muted-foreground">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">CA Actuel (HT)</p>
                                <InfoTooltip text="Total des ventes HT (TVA calculée dynamiquement par vente)." />
                            </div>
                            <p className="text-xl sm:text-2xl font-black">{currentTurnover.toLocaleString()} <span className="text-[10px] sm:text-xs opacity-50">FCFA</span></p>
                            {actualCash !== undefined && (
                                <p className="text-[10px] font-bold mt-1 text-shop/80">
                                    Encaissé Réel: {actualCash.toLocaleString()} FCFA
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 mb-1 sm:mb-2 text-muted-foreground">
                                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Seuil de Rentabilité</p>
                                <InfoTooltip text="Calculé sur la base de vos charges FIXES (récurrentes) divisé par votre taux de marge sur coûts variables." />
                            </div>
                            <p className="text-xl sm:text-2xl font-black">{breakEvenPoint.toLocaleString()} <span className="text-[10px] sm:text-xs opacity-50">FCFA</span></p>
                        </div>
                    </div>
                </div>

                <div className={`mt-2 sm:mt-4 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] text-center border-2 ${isProfitable
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                    <p className="text-xs sm:text-sm font-black uppercase tracking-widest mb-1">
                        {isProfitable ? 'Marge Nette (Période)' : 'Manque à gagner'}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black tracking-tighter">
                        {isProfitable ? '+' : '-'}{difference.toLocaleString()} FCFA
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-bold mt-2 opacity-70 uppercase tracking-tight leading-relaxed">
                        {isProfitable
                            ? "Objectif atteint ! Vous couvrez maintenant l'ensemble de vos coûts de structure."
                            : "Encore un effort ! Ce montant est nécessaire pour couvrir vos charges et commencer à dégager du profit net."}
                    </p>
                </div>
            </div>
        </div>
    )
}

export function ProfitabilityHistory({ history }: { history: any[] }) {
    if (!history || history.length === 0) return null

    return (
        <div className="glass-panel rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 border-white/5 bg-white/[0.01] relative overflow-hidden">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
                <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">Historique de Rentabilité</h3>
                    <p className="text-[9px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest">Performance mensuelle du Point Mort</p>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <div className="flex items-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 mr-2" />
                        Rentable
                    </div>
                    <div className="flex items-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mr-2" />
                        En progression
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 font-bold">
                {history.map((item, index) => (
                    <div key={index} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center text-center group cursor-default hover:bg-white/[0.08] transition-colors relative">
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 sm:mb-3">{item.monthName}</p>
                        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${item.isProfitable ? 'bg-green-500/20 text-green-400 shadow-green-500/10' : 'bg-red-500/20 text-red-500 shadow-red-500/10'}`}>
                            {item.isProfitable ? <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" /> : <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6" />}
                        </div>
                        <p className="text-xs sm:text-sm font-black">{Math.round(item.progress)}%</p>

                        {/* Hover Details */}
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-2 sm:p-3 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] leading-tight uppercase tracking-tighter z-10 pointer-events-none">
                            <p className="text-muted-foreground mb-1">CA HT: {Math.round(item.totalSalesHT).toLocaleString()} FCFA</p>
                            <p className="text-white">Seuil: {Math.round(item.seuilRentabilite).toLocaleString()} FCFA</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
