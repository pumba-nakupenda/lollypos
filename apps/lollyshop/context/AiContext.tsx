
'use client'

import React, { createContext, useContext, useState } from 'react';

interface AiContextType {
    isAiOpen: boolean;
    setIsAiOpen: (open: boolean) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export function AiProvider({ children }: { children: React.ReactNode }) {
    const [isAiOpen, setIsAiOpen] = useState(false);

    return (
        <AiContext.Provider value={{ isAiOpen, setIsAiOpen }}>
            {children}
        </AiContext.Provider>
    );
}

export function useAi() {
    const context = useContext(AiContext);
    if (context === undefined) {
        throw new Error('useAi must be used within an AiProvider');
    }
    return context;
}
