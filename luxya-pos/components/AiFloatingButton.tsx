
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Trash2, X, Minimize2, Maximize2, Brain, Minus } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useToast } from '@/context/ToastContext';
import ReactMarkdown from 'react-markdown';
import Portal from './Portal';
import { API_URL } from '@/utils/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AiFloatingButton() {
    const { activeShop } = useShop();
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Product Filter State
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Bonjour ! Je suis **Lolly AI**. Sélectionnez un produit ci-dessous pour le modifier rapidement, ou posez-moi une question générale.",
            timestamp: new Date()
        }
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isLoading, isOpen, isMinimized]);

    useEffect(() => {
        if (isOpen && products.length === 0) {
            fetchProducts();
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        try {
            const shopId = activeShop?.id === 0 ? '' : activeShop?.id;
            const res = await fetch(`${API_URL}/products?shopId=${shopId || 1}`);
            if (res.ok) setProducts(await res.json());
        } catch (e) {}
    };

    const filteredProducts = searchQuery.trim() === '' 
        ? products.slice(0, 20) 
        : products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        // If a product is selected, we inject its context
        const contextPrefix = selectedProduct 
            ? `[ACTION SUR PRODUIT ID: ${selectedProduct.id} (${selectedProduct.name})] ` 
            : "";

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
            const shopParam = activeShop && activeShop.id !== 0 ? `?shopId=${activeShop.id}` : '';
            const res = await fetch(`${API_URL}/ai/analyze${shopParam}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: contextPrefix + text })
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
                throw new Error('Erreur API');
            }
        } catch (error) {
            showToast("L'IA est temporairement indisponible.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* The Trigger Button - Moved to right-8 */}
            <div className="fixed bottom-8 right-8 z-[100]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95
                        ${isOpen ? 'bg-red-500 rotate-90' : 'bg-shop animate-float'}
                    `}
                >
                    {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
                </button>
            </div>

            {/* The Chat Window - Moved to right-8 */}
            {isOpen && (
                <Portal>
                    <div className={`
                        fixed bottom-28 right-8 z-[200] w-[450px] max-w-[calc(100vw-4rem)] bg-[#0a0a0c] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden transition-all duration-500 flex flex-col
                        ${isMinimized ? 'h-16' : 'h-[650px] max-h-[calc(100vh-12rem)]'}
                    `}>
                        {/* Header */}
                        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-shop/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-shop" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-white">Lolly AI</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground transition-colors">
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-muted-foreground transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Product Filter Bar */}
                                <div className="p-3 bg-white/[0.02] border-b border-white/5 relative">
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                            placeholder="Chercher un produit à modifier..."
                                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-[10px] focus:border-shop/50 outline-none transition-all"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {isSearchFocused && filteredProducts.length > 0 && (
                                        <div className="absolute top-full left-3 right-3 mt-1 bg-[#121214] border border-white/10 rounded-xl shadow-2xl z-[210] overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {filteredProducts.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProduct(p);
                                                        setSearchQuery('');
                                                        setIsSearchFocused(false);
                                                    }}
                                                    className="w-full p-2 text-left hover:bg-shop/10 flex items-center justify-between group transition-colors border-b border-white/5 last:border-0"
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-bold truncate text-white/80 group-hover:text-shop uppercase">{p.name}</span>
                                                        <span className="text-[7px] text-muted-foreground">{p.category || 'Général'} • {p.stock} en stock</span>
                                                    </div>
                                                    <span className="text-[8px] text-muted-foreground font-black uppercase ml-2">ID: {p.id}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Active Selection Badge */}
                                {selectedProduct && (
                                    <div className="mx-4 mt-3 p-2 bg-shop/10 border border-shop/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-6 h-6 rounded-lg bg-shop flex items-center justify-center text-white text-[10px] font-black italic">ID</div>
                                            <span className="text-[10px] font-bold text-shop truncate max-w-[200px] uppercase">{selectedProduct.name}</span>
                                        </div>
                                        <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-shop/20 rounded-md text-shop">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map((m) => (
                                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex items-start max-w-[90%] space-x-2 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-[10px] ${
                                                    m.role === 'assistant' ? 'bg-shop/10 border-shop/20 text-shop' : 'bg-white/10 border-white/10 text-white'
                                                }`}>
                                                    {m.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                </div>
                                                <div className={`p-4 rounded-2xl leading-relaxed shadow-xl ${
                                                    m.role === 'assistant' 
                                                    ? 'bg-white/[0.03] border border-white/10 text-white/90' 
                                                    : 'bg-shop text-white'
                                                }`}>
                                                    <div className="prose prose-invert max-w-none prose-sm">
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({children}) => <p className="mb-2 last:mb-0 text-xs sm:text-sm">{children}</p>,
                                                                strong: ({children}) => <strong className="font-black text-shop-secondary">{children}</strong>,
                                                                h1: ({children}) => <h1 className="text-lg font-black uppercase tracking-tight mb-2 text-white border-b border-white/10 pb-1">{children}</h1>,
                                                                h2: ({children}) => <h2 className="text-md font-black uppercase tracking-tight mb-2 text-white/90">{children}</h2>,
                                                                h3: ({children}) => <h3 className="text-sm font-black uppercase tracking-tight mb-1 text-white/80">{children}</h3>,
                                                                ul: ({children}) => <ul className="space-y-1 mb-3 list-disc pl-4">{children}</ul>,
                                                                ol: ({children}) => <ol className="space-y-1 mb-3 list-decimal pl-4">{children}</ol>,
                                                                li: ({children}) => <li className="text-xs sm:text-sm">{children}</li>,
                                                                code: ({children}) => <code className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] font-mono text-shop-secondary">{children}</code>,
                                                            }}
                                                        >
                                                            {m.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex items-center space-x-2 p-3 rounded-2xl bg-white/5 animate-pulse">
                                                <Brain className="w-3 h-3 text-shop" />
                                                <div className="flex space-x-1">
                                                    <div className="w-1 h-1 bg-shop rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <div className="w-1 h-1 bg-shop rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <div className="w-1 h-1 bg-shop rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form 
                                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                                    className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center space-x-2"
                                >
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Une question ou une action ?"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-xs focus:border-shop/50 outline-none transition-all"
                                    />
                                    <button 
                                        disabled={!input.trim() || isLoading}
                                        className="p-2 bg-shop text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </Portal>
            )}
        </>
    );
}
