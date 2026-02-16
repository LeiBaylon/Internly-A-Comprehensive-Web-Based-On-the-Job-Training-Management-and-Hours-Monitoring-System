'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, DailyLog, HourStats } from './types';
import * as storage from './storage';
import { calculateHourStats } from './calculations';

interface AppContextType {
    user: User | null;
    logs: DailyLog[];
    stats: HourStats;
    loading: boolean;
    signUp: (name: string, email: string, password: string, hours: number, startDate: string) => Promise<void>;
    login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    addLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateLog: (id: string, updates: Partial<DailyLog>) => void;
    deleteLog: (id: string) => void;
    refreshData: () => void;
    signUpWithGoogle: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    verifyCode: (code: string) => Promise<void>;
    resendCode: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [stats, setStats] = useState<HourStats>({
        totalRequired: 0,
        totalRendered: 0,
        hoursThisWeek: 0,
        remaining: 0,
        progressPercentage: 0,
        weeklyAverage: 0,
        daysLogged: 0,
    });
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(() => {
        const currentUser = storage.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
            const userLogs = storage.getDailyLogs(currentUser.id);
            setLogs(userLogs);
            setStats(calculateHourStats(userLogs, currentUser.totalRequiredHours));
        } else {
            setLogs([]);
            setStats({
                totalRequired: 0,
                totalRendered: 0,
                hoursThisWeek: 0,
                remaining: 0,
                progressPercentage: 0,
                weeklyAverage: 0,
                daysLogged: 0,
            });
        }
    }, []);

    useEffect(() => {
        refreshData();
        setLoading(false);
    }, [refreshData]);

    // Sign up: send verification code to email, store pending data
    const handleSignUp = async (name: string, email: string, password: string, hours: number, startDate: string) => {
        const res = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to send verification code.');
        }

        storage.storePendingSignup({
            name,
            email,
            password,
            totalRequiredHours: hours,
            startDate,
            verificationToken: data.token,
            tokenExpiresAt: data.expiresAt,
        });
    };

    // Verify the 6-digit code, then create Firebase account + localStorage user
    const handleVerifyCode = async (code: string) => {
        const pending = storage.getPendingSignup();
        if (!pending) throw new Error('No pending signup found. Please sign up again.');

        // Verify code with server
        const res = await fetch('/api/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                email: pending.email,
                token: pending.verificationToken,
                expiresAt: pending.tokenExpiresAt,
            }),
        });

        const data = await res.json();
        if (!data.verified) {
            throw new Error(data.error || 'Invalid verification code.');
        }

        let uid: string;

        if (pending.googleUid) {
            // Google signup — Firebase account already exists from signInWithPopup
            uid = pending.googleUid;
        } else {
            // Email/password signup — create Firebase Auth account now
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const { auth } = await import('./firebase');
            const credential = await createUserWithEmailAndPassword(auth, pending.email, pending.password);
            uid = credential.user.uid;
        }

        // Create localStorage user (but don't log them in — they must sign in manually)
        storage.completeSignUp(pending, uid);
        storage.clearPendingSignup();

        // Sign out of Firebase so they aren't auto-logged-in
        try {
            const { signOut } = await import('firebase/auth');
            const { auth } = await import('./firebase');
            await signOut(auth);
        } catch { /* ignore */ }
    };

    // Resend verification code
    const handleResendCode = async () => {
        const pending = storage.getPendingSignup();
        if (!pending) throw new Error('No pending signup found. Please sign up again.');

        const res = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pending.email, name: pending.name }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Failed to resend verification code.');
        }

        storage.storePendingSignup({
            ...pending,
            verificationToken: data.token,
            tokenExpiresAt: data.expiresAt,
        });
    };

    // Login: Firebase Auth first, fallback to localStorage for legacy users
    const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('./firebase');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Firebase account exists (email was verified at signup)
            try {
                const loggedUser = storage.loginByEmail(email, rememberMe);
                setUser(loggedUser);
                refreshData();
            } catch {
                throw new Error('Account data not found on this device. Please sign up again.');
            }
        } catch (err: unknown) {
            const firebaseError = err as { code?: string; message?: string };
            if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-credential') {
                // Fallback: legacy localStorage-only user
                const loggedUser = storage.login(email, password, rememberMe);
                setUser(loggedUser);
                refreshData();
            } else {
                throw err;
            }
        }
    };

    const handleLogout = async () => {
        try {
            const { signOut } = await import('firebase/auth');
            const { auth } = await import('./firebase');
            await signOut(auth);
        } catch { /* ignore Firebase signout errors */ }
        storage.logout();
        setUser(null);
        setLogs([]);
    };

    // Google sign-up: authenticate with Google, then send verification code
    const handleSignUpWithGoogle = async () => {
        const { signInWithPopup } = await import('firebase/auth');
        const { auth, googleProvider } = await import('./firebase');
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
        const email = firebaseUser.email || '';

        // Check if user already has an account
        const existingUser = storage.findUserByEmail(email);
        if (existingUser) {
            throw new Error('An account with this email already exists. Please log in instead.');
        }

        // Send verification code to their Google email
        const res = await fetch('/api/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send verification code.');

        // Store pending signup with Google info
        storage.storePendingSignup({
            name,
            email,
            password: '', // Google users don't need a password
            totalRequiredHours: 480,
            startDate: new Date().toISOString().split('T')[0],
            verificationToken: data.token,
            tokenExpiresAt: data.expiresAt,
            googleUid: firebaseUser.uid,
            profileImage: firebaseUser.photoURL || undefined,
        });
    };

    // Google login: only allow if user already registered
    const handleLoginWithGoogle = async () => {
        const { signInWithPopup } = await import('firebase/auth');
        const { auth, googleProvider } = await import('./firebase');
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const email = firebaseUser.email || '';

        // Check if user has a registered account
        const existingUser = storage.findUserByEmail(email);
        if (!existingUser) {
            throw new Error('No account found with this email. Please sign up first.');
        }

        storage.loginByEmail(email, false);
        refreshData();
    };

    const handleUpdateUser = (updates: Partial<User>) => {
        storage.updateUser(updates);
        refreshData();
    };

    const handleAddLog = (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => {
        storage.addDailyLog(log);
        refreshData();
    };

    const handleUpdateLog = (id: string, updates: Partial<DailyLog>) => {
        storage.updateDailyLog(id, updates);
        refreshData();
    };

    const handleDeleteLog = (id: string) => {
        storage.deleteDailyLog(id);
        refreshData();
    };

    return (
        <AppContext.Provider
            value={{
                user,
                logs,
                stats,
                loading,
                signUp: handleSignUp,
                login: handleLogin,
                logout: handleLogout,
                updateUser: handleUpdateUser,
                addLog: handleAddLog,
                updateLog: handleUpdateLog,
                deleteLog: handleDeleteLog,
                refreshData,
                signUpWithGoogle: handleSignUpWithGoogle,
                loginWithGoogle: handleLoginWithGoogle,
                verifyCode: handleVerifyCode,
                resendCode: handleResendCode,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
