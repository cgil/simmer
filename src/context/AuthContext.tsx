import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import config from '../config';
import posthog from 'posthog-js';

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

// Helper function for deep equality check of user objects
const isUserEqual = (
    currentUser: User | null,
    newUser: User | null
): boolean => {
    if (currentUser === newUser) return true;
    if (!currentUser || !newUser) return false;

    return (
        currentUser.id === newUser.id &&
        currentUser.email === newUser.email &&
        currentUser.role === newUser.role &&
        JSON.stringify(currentUser.user_metadata) ===
            JSON.stringify(newUser.user_metadata)
    );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Update user state only if the user data has actually changed
    const updateUser = useCallback((newUser: User | null) => {
        setUser((currentUser) => {
            if (isUserEqual(currentUser, newUser)) {
                // console.log('User data unchanged, preserving reference'); // DEBUG
                return currentUser; // Return same reference if equal
            }
            // console.log('User data changed, updating reference'); // DEBUG
            return newUser;
        });
    }, []);

    useEffect(() => {
        // Get session from Supabase on mount
        const getSession = async () => {
            setIsLoading(true);
            // console.log('Getting initial session'); // DEBUG
            const { data } = await supabase.auth.getSession();
            setSession((prevSession) => {
                // Only update if session ID changed
                if (prevSession?.access_token === data.session?.access_token) {
                    // console.log('Session unchanged, preserving reference'); // DEBUG
                    return prevSession;
                }
                // console.log('Session changed, updating reference'); // DEBUG
                return data.session;
            });
            updateUser(data.session?.user ?? null);
            setIsLoading(false);
        };

        getSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            // console.log('Auth state change detected, event:', _event); // DEBUG

            setSession((prevSession) => {
                // Only update if session ID changed
                if (prevSession?.access_token === newSession?.access_token) {
                    // console.log('Session unchanged in auth state change, preserving reference'); // DEBUG
                    return prevSession;
                }
                // console.log('Session changed in auth state change, updating reference'); // DEBUG
                return newSession;
            });

            const currentUser = newSession?.user ?? null;
            updateUser(currentUser);
            setIsLoading(false);

            // Identify user or reset PostHog in production
            if (config.environment === 'production' && config.posthog?.key) {
                if (currentUser) {
                    posthog.identify(currentUser.id, {
                        email: currentUser.email,
                        // Add name if available in user_metadata
                        name: currentUser.user_metadata?.full_name,
                    });
                } else {
                    posthog.reset();
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [updateUser]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    }, []);

    const signInWithGoogle = useCallback(async () => {
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
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(
        () => ({
            user,
            session,
            isLoading,
            signIn,
            signInWithGoogle,
            signUp,
            signOut,
        }),
        [user, session, isLoading, signIn, signInWithGoogle, signUp, signOut]
    );

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
