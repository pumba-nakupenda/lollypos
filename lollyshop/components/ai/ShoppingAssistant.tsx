
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, MessageCircle, Bot, User, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAi } from '@/context/AiContext';
import { API_URL } from '@/utils/api';

export default function ShoppingAssistant() {
    const { isAiOpen, setIsAiOpen } = useAi();
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: "Bienvenue chez **Lolly**. Que recherchez-vous aujourd'hui ?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isAiOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading, isAiOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const msg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/ai/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question: `Tu es l'assistant shopping direct de Lolly (Luxya/Homtek). 
                    RÈGLES : 
                    - RÉPONSE TRÈS COURTE (max 2 phrases). 
                    - VA DROIT AU BUT. 
                    - Donne les prix en FCFA immédiatement si tu parles d'un produit. 
                    - Client demande : "${msg}"` 
                })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je rencontre une petite difficulté technique. Posez-moi votre question à nouveau !" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-8 right-8 z-[100] ${isAiOpen ? 'block' : 'hidden lg:block'}`}>
            {!isAiOpen ? (
                <button 
                    onClick={() => setIsAiOpen(true)}
                    className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all group"
                >
                    <div className="absolute -top-2 -right-2 px-2 py-1 bg-[#0055ff] text-[8px] font-black uppercase rounded-full animate-bounce">AI Helper</div>
                    <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                </button>
            ) : (
                <div className="w-96 max-w-[calc(100vw-2rem)] h-[550px] bg-white border border-gray-100 rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <div className="p-6 bg-black text-white flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Bot className="w-5 h-5 text-[#0055ff]" />
                            <span className="text-xs font-black uppercase tracking-widest">Shopping Assistant</span>
                        </div>
                        <button onClick={() => setIsAiOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-[24px] text-sm ${m.role === 'user' ? 'bg-[#0055ff] text-white' : 'bg-white text-black shadow-sm border border-gray-100'}`}>
                                    <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-center space-x-2 text-gray-400 p-4">
                                <Brain className="w-4 h-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase animate-pulse">L'IA réfléchit...</span>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="p-6 bg-white border-t border-gray-50">
                        <div className="relative flex items-center">
                            <input 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder="Posez une question..."
                                className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-5 pr-12 text-sm focus:ring-2 focus:ring-[#0055ff]/20 outline-none"
                            />
                            <button onClick={handleSend} className="absolute right-2 p-2 text-[#0055ff] hover:scale-110 transition-transform"><Send className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
