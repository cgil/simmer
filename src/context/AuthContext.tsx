import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import config from '../config';

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (
        email: string,
        password: string
    ) => Promise<{
        error: Error | null;
    }>;
    signInWithGoogle: () => Promise<{
        error: Error | null;
        isNewUser?: boolean;
    }>;
    signUp: (
        email: string,
        password: string
    ) => Promise<{
        error: Error | null;
        data: {
            user: User | null;
            session: Session | null;
        } | null;
    }>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get session from Supabase on mount
        const getSession = async () => {
            setIsLoading(true);
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            setIsLoading(false);
        };

        getSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signInWithGoogle = async () => {
        // Use our dedicated callback route so we can parse the hash and then send the user to /collection/all
        let redirectTo = `${window.location.origin}/auth/callback`;

        // For production environment, use the production URL
        if (config.environment === 'production') {
            redirectTo = 'https://simmer-app.vercel.app/auth/callback';
        }

        try {
            // We'll rely on the error response to determine if user exists
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                },
            });

            if (error) {
                // Check if error is related to user not existing (401 Unauthorized)
                const isUserNotFound =
                    error.message?.includes('user not found') ||
                    error.message?.includes('Invalid login credentials') ||
                    error.status === 401;

                return {
                    error,
                    isNewUser: isUserNotFound,
                };
            }

            return { error: null };
        } catch (error) {
            console.error('Error during Google sign-in:', error);
            return {
                error:
                    error instanceof Error
                        ? error
                        : new Error('Unknown error during sign-in'),
            };
        }
    };

    const signUp = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        user,
        session,
        isLoading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
