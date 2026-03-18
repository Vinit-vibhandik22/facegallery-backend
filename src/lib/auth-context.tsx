'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Studio {
    id: string;
    email: string;
    name: string;
    logo_url: string | null;
    brand_color: string;
    brand_color_secondary: string;
    plan: string;
    api_key: string;
    gallery_title: string;
    gallery_subtitle: string;
    show_powered_by: boolean;
    allow_downloads: boolean;
    allow_social_share: boolean;
    default_link_expiry_days: number;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    studio: Studio | null;
    loading: boolean;
    signUp: (email: string, password: string, studioName: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshStudio: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    studio: null,
    loading: true,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => { },
    refreshStudio: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [studio, setStudio] = useState<Studio | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStudio = async (userId: string) => {
        const { data } = await supabase
            .from('studios')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) setStudio(data as Studio);
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) fetchStudio(s.user.id);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) fetchStudio(s.user.id);
            else setStudio(null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, studioName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { studio_name: studioName } },
        });
        return { error: error?.message ?? null };
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setStudio(null);
    };

    const refreshStudio = async () => {
        if (user) await fetchStudio(user.id);
    };

    return (
        <AuthContext.Provider value={{ user, session, studio, loading, signUp, signIn, signOut, refreshStudio }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
