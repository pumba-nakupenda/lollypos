
'use client'

import React from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#eaeded]">
                <Loader2 className="w-8 h-8 animate-spin text-lolly" />
            </div>
        );
    }

    return <>{children}</>;
}
