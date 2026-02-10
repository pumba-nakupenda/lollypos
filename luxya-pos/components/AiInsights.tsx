
'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Brain, ArrowUpRight, Target, Lightbulb, Loader2 } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { API_URL } from '@/utils/api';

export default function AiInsights() {
    const { activeShop } = useShop();
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeShop) {
            generateAutoInsight();
        }
    }, [activeShop]);

    const generateAutoInsight = async () => {
        setLoading(true);
        try {
            const shopParam = activeShop && activeShop.id !== 0 ? `?shopId=${activeShop.id}` : '';
            const res = await fetch(`${API_URL}/ai/analyze${shopParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: 'Fais une analyse flash du business. Donne-moi : 1. Une prévision de croissance, 2. Une opportunité à saisir, 3. Un risque à surveiller. Réponds dans un format JSON structuré comme ceci : {"forecast": "...", "opportunity": "...", "risk": "..."}' 
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Try to parse JSON from AI response if it followed instructions
                try {
                    const parsed = JSON.parse(data.answer.replace(/```json|```/g, '').trim());
                    setInsight(parsed);
                } catch (e) {
                    // Fallback if AI didn't return perfect JSON
                    setInsight({
                        forecast: "Analyse en cours...",
                        opportunity: data.answer.substring(0, 100) + "...",
                        risk: "Données à affiner"
                    });
                }
            }
        } catch (error) {
            console.error('AI Insight failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Forecast Card */}
            <div className="glass-panel p-6 rounded-[32px] border-shop/20 bg-gradient-to-br from-shop/10 to-transparent relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-shop" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Prévisions de Croissance</span>
                    </div>
                    {loading && <Loader2 className="w-3 h-3 text-shop animate-spin" />}
                </div>
                <p className="text-sm font-bold text-white/90 leading-relaxed">
                    {loading ? "Calcul des tendances..." : insight?.forecast || "Sélectionnez une boutique pour l'analyse."}
                </p>
                <div className="mt-4 flex items-center text-[8px] font-black uppercase text-shop animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" /> IA Lolly Active
                </div>
            </div>

            {/* Opportunity Card */}
            <div className="glass-panel p-6 rounded-[32px] border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Opportunité Flash</span>
                    </div>
                </div>
                <p className="text-sm font-bold text-white/90 leading-relaxed">
                    {loading ? "Identification des leviers..." : insight?.opportunity || "L'IA analyse vos stocks pour trouver des pépites."}
                </p>
            </div>

            {/* Action Card */}
            <div className="glass-panel p-6 rounded-[32px] border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-transparent relative overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Risque / Alerte</span>
                    </div>
                </div>
                <p className="text-sm font-bold text-white/90 leading-relaxed">
                    {loading ? "Vérification des risques..." : insight?.risk || "Aucun risque critique détecté ce jour."}
                </p>
            </div>
        </div>
    );
}
