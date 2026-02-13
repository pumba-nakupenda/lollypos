'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Brain, ArrowUpRight, Target, Lightbulb, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { API_URL } from '@/utils/api';

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 heures en millisecondes

export default function AiInsights() {
    const { activeShop } = useShop();
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeShop) {
            checkCacheAndGenerate();
        }
    }, [activeShop]);

    const checkCacheAndGenerate = () => {
        const shopId = activeShop?.id || 0;
        const cacheKey = `lolly_insight_cache_${shopId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            const age = Date.now() - timestamp;

            if (age < CACHE_DURATION) {
                setInsight(data);
                return;
            }
        }

        generateAutoInsight();
    };

    const generateAutoInsight = async () => {
        setLoading(true);
        try {
            const shopId = activeShop?.id || 0;
            const shopParam = shopId !== 0 ? `?shopId=${shopId}` : '';
            const res = await fetch(`${API_URL}/ai/analyze${shopParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: 'Fais une analyse flash CONCISE du business (25 mots max par point). Donne : 1. Une prévision, 2. Une opportunité, 3. Un risque. Pour chaque point, définis un "status" parmi: "good", "warning", "danger". Réponds UNIQUEMENT en JSON: {"forecast": {"text": "...", "status": "..."}, "opportunity": {"text": "...", "status": "..."}, "risk": {"text": "...", "status": "..."}}' 
                })
            });

            if (res.ok) {
                const data = await res.json();
                try {
                    const parsed = JSON.parse(data.answer.replace(/```json|```/g, '').trim());
                    setInsight(parsed);
                    
                    // Sauvegarde en cache
                    const cacheKey = `lolly_insight_cache_${shopId}`;
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: parsed,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    const fallback = {
                        forecast: { text: "Croissance stable prévue.", status: "good" },
                        opportunity: { text: "Optimiser les stocks actuels.", status: "warning" },
                        risk: { text: "Surveiller les ruptures.", status: "danger" }
                    };
                    setInsight(fallback);
                }
            }
        } catch (error) {
            console.error('AI Insight failed');
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'good': return 'border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent text-green-400';
            case 'warning': return 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent text-orange-400';
            case 'danger': return 'border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent text-red-400';
            default: return 'border-shop/20 bg-gradient-to-br from-shop/10 to-transparent text-shop';
        }
    };

    const getIcon = (status: string, defaultIcon: any) => {
        if (status === 'good') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
        if (status === 'danger') return <AlertTriangle className="w-4 h-4 text-red-400" />;
        return defaultIcon;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Forecast Card */}
            <div className={`glass-panel p-6 rounded-[32px] relative overflow-hidden group border transition-all duration-500 ${getStatusStyles(insight?.forecast?.status)}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        {getIcon(insight?.forecast?.status, <TrendingUp className="w-4 h-4" />)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Prévisions</span>
                    </div>
                    {loading && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
                </div>
                <p className="text-sm font-bold text-white/90 leading-relaxed min-h-[3rem]">
                    {loading ? "Calcul des tendances..." : insight?.forecast?.text || "Sélectionnez une boutique."}
                </p>
                <div className="mt-4 flex items-center text-[8px] font-black uppercase opacity-60">
                    <Sparkles className="w-3 h-3 mr-1" /> IA Lolly Active
                </div>
            </div>

            {/* Opportunity Card */}
            <div className={`glass-panel p-6 rounded-[32px] relative overflow-hidden group border transition-all duration-500 ${getStatusStyles(insight?.opportunity?.status)}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        {getIcon(insight?.opportunity?.status, <Lightbulb className="w-4 h-4" />)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Opportunité</span>
                    </div>
                </div>
                <p className="text-sm font-bold text-white/90 leading-relaxed min-h-[3rem]">
                    {loading ? "Identification des leviers..." : insight?.opportunity?.text || "Analyse des stocks en cours..."}
                </p>
            </div>

            {/* Action Card */}
            <div className={`glass-panel p-6 rounded-[32px] relative overflow-hidden group border transition-all duration-500 ${getStatusStyles(insight?.risk?.status)}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        {getIcon(insight?.risk?.status, <Target className="w-4 h-4" />)}
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Risque / Alerte</span>
                    </div>
                </div>
                <p className="text-sm font-bold text-white/90 leading-relaxed min-h-[3rem]">
                    {loading ? "Vérification des risques..." : insight?.risk?.text || "Analyse de sécurité financière..."}
                </p>
            </div>
        </div>
    );
}
