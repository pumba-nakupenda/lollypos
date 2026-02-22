'use client'

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '../utils/supabase/client';

interface UserContextType {
    user: any;
    profile: any;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), []);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);
                        await fetchProfile(session.user.id);
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error("Auth init error:", err);
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (mounted) {
                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                }
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            setProfile(data);
        } catch (e) {
            console.error("Error fetching profile:", e);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const isAdmin = profile?.user_type === 'staff' && (profile?.is_super_admin || profile?.role === 'admin');

    return (
        <UserContext.Provider value={{ user, profile, loading, isAdmin, signOut }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
