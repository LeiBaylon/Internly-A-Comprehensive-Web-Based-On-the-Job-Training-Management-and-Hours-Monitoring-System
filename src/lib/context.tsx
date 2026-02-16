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
    signUp: (name: string, email: string, password: string, hours: number, startDate: string) => void;
    login: (email: string, password: string, rememberMe: boolean) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    addLog: (log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateLog: (id: string, updates: Partial<DailyLog>) => void;
    deleteLog: (id: string) => void;
    refreshData: () => void;
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

    const handleSignUp = (name: string, email: string, password: string, hours: number, startDate: string) => {
        const newUser = storage.signUp(name, email, password, hours, startDate);
        setUser(newUser);
        refreshData();
    };

    const handleLogin = (email: string, password: string, rememberMe: boolean) => {
        const loggedUser = storage.login(email, password, rememberMe);
        setUser(loggedUser);
        refreshData();
    };

    const handleLogout = () => {
        storage.logout();
        setUser(null);
        setLogs([]);
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
