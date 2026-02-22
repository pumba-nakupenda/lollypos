
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Trash2, TrendingUp, Package, Coins, MessageSquare, Brain } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/context/ToastContext';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '@/utils/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTIONS = [
    "Analyse mes performances des 30 derniers jours",
    "Quels produits sont en rupture ou presque ?",
    "Comment optimiser mes dépenses ?",
    "Donne-moi 3 conseils pour booster Luxya cette semaine",
    "Fais-moi un résumé financier Homtek"
];

export default function AiAssistantPage() {
    const { activeShop } = useShop();
    const { showToast } = useToast();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Système Réinitialisé. **Lolly AI** est prêt. Posez-moi une question sur vos ventes ou vos stocks.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Utilisation d'une URL propre sans shopParam si id est 0
            const url = new URL(`${API_URL}/ai/analyze`);
            if (activeShop && activeShop.id !== 0) {
                url.searchParams.append('shopId', activeShop.id.toString());
            }

            const res = await fetch(url.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: text })
            });

            if (res.ok) {
                const data = await res.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.answer,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const errorData = await res.text();
                const detail = `Status ${res.status} sur ${url.pathname}`;
                console.error('AI API Error Details:', {
                    status: res.status,
                    statusText: res.statusText,
                    body: errorData,
                    url: url.toString()
                });
                throw new Error(detail);
            }
        } catch (error: any) {
            console.error('AI Fetch Catch:', error);
            showToast(`Erreur : ${error.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] p-4 sm:p-6 space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-shop rounded-2xl flex items-center justify-center shadow-lg shadow-shop/20 animate-float">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter shop-gradient-text">
                            Lolly AI <span className="text-xs font-bold text-muted-foreground ml-2 opacity-50 uppercase tracking-widest">Business Intelligence</span>
                        </h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Analyse en temps réel • {activeShop?.name || 'Groupe Lolly'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setMessages([messages[0]])}
                    className="p-3 glass-card rounded-xl text-muted-foreground hover:text-red-400 transition-all"
                    title="Effacer la conversation"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </header>

            <div className="flex-1 flex flex-col min-h-0 bg-white/[0.01] border border-white/5 rounded-[40px] overflow-hidden">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start max-w-[85%] space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                    m.role === 'assistant' 
                                    ? 'bg-shop/10 border-shop/20 text-shop' 
                                    : 'bg-white/10 border-white/10 text-white'
                                }`}>
                                    {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </div>
                                <div className={`p-4 rounded-[24px] text-sm leading-relaxed ${
                                    m.role === 'assistant' 
                                    ? 'bg-white/5 border border-white/5 text-white/90' 
                                    : 'bg-shop text-white font-medium shadow-lg shadow-shop/10'
                                }`}>
                                    <div className="prose prose-invert prose-xs max-w-none">
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                    <p className={`text-[8px] mt-2 opacity-40 uppercase font-black ${m.role === 'user' ? 'text-right' : ''}`}>
                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-xl bg-shop/10 border border-shop/20 flex items-center justify-center text-shop animate-pulse">
                                    <Brain className="w-4 h-4" />
                                </div>
                                <div className="p-4 rounded-[24px] bg-white/5 border border-white/5 flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-shop rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-shop rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-shop rounded-full animate-bounce" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
                    {/* Suggestions */}
                    {messages.length === 1 && !isLoading && (
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSendMessage(s)}
                                    className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-muted-foreground hover:bg-shop/10 hover:text-shop hover:border-shop/20 transition-all active:scale-95"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                        className="relative flex items-center"
                    >
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Posez une question sur votre business..."
                            className="w-full bg-black/20 border border-white/10 rounded-[24px] py-4 pl-6 pr-14 text-sm font-medium focus:border-shop/50 outline-none transition-all placeholder:opacity-30"
                        />
                        <button 
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 p-3 bg-shop text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
