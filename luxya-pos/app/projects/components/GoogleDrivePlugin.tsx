'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Globe, Loader2, Link2, ExternalLink, X } from 'lucide-react'

interface GoogleDrivePluginProps {
    onFileSelect: (files: { name: string; url: string }[]) => void;
    clientId?: string;
    apiKey?: string;
}

// Default keys (Should be replaced by environment variables in production)
const DEFAULT_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

export default function GoogleDrivePlugin({ onFileSelect, clientId = DEFAULT_CLIENT_ID, apiKey = DEFAULT_API_KEY }: GoogleDrivePluginProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isPicking, setIsPicking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Google API Scripts
    useEffect(() => {
        const loadScripts = () => {
            const script1 = document.createElement('script');
            script1.src = 'https://accounts.google.com/gsi/client';
            script1.async = true;
            script1.defer = true;
            document.body.appendChild(script1);

            const script2 = document.createElement('script');
            script2.src = 'https://apis.google.com/js/api.js';
            script2.async = true;
            script2.defer = true;
            script2.onload = () => setIsLoaded(true);
            document.body.appendChild(script2);
        };

        loadScripts();
    }, []);

    const createPicker = useCallback((accessToken: string) => {
        const picker = new (window as any).google.picker.PickerBuilder()
            .addView((window as any).google.picker.ViewId.DOCS)
            .setOAuthToken(accessToken)
            .setDeveloperKey(apiKey)
            .setCallback((data: any) => {
                if (data.action === (window as any).google.picker.Action.PICKED) {
                    const files = data.docs.map((doc: any) => ({
                        name: doc.name,
                        url: doc.url
                    }));
                    onFileSelect(files);
                }
                if (data.action === (window as any).google.picker.Action.CANCEL || data.action === (window as any).google.picker.Action.PICKED) {
                    setIsPicking(false);
                }
            })
            .build();
        picker.setVisible(true);
    }, [apiKey, onFileSelect]);

    const handlePick = () => {
        if (!clientId || !apiKey) {
            setError("Google API Keys non configurées.");
            return;
        }

        setIsPicking(true);
        setError(null);

        try {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (response: any) => {
                    if (response.access_token) {
                        (window as any).gapi.load('picker', () => createPicker(response.access_token));
                    } else {
                        setIsPicking(false);
                        setError("Échec de l'authentification Google.");
                    }
                },
            });
            client.requestAccessToken();
        } catch (err) {
            setIsPicking(false);
            setError("Erreur d'initialisation du Plugin Drive.");
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handlePick}
                disabled={!isLoaded || isPicking}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg
                    ${isPicking ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'}`}
                title="Google Drive Plugin"
            >
                {isPicking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
            </button>

            {error && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-red-500/90 backdrop-blur-md text-white p-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
                </div>
            )}
        </div>
    )
}
