import { User, DailyLog, WeeklyReport } from './types';
import { v4 as uuidv4 } from 'uuid';

const KEYS = {
    USERS: 'internly_users',
    CURRENT_USER: 'internly_current_user',
    DAILY_LOGS: 'internly_daily_logs',
    WEEKLY_REPORTS: 'internly_weekly_reports',
    REMEMBER_ME: 'internly_remember_me',
};

function getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

function setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
}

// --- Auth ---
export function signUp(
    name: string,
    email: string,
    password: string,
    totalRequiredHours: number,
    startDate: string
): User {
    const users = getItem<User[]>(KEYS.USERS, []);
    if (users.find((u) => u.email === email)) {
        throw new Error('An account with this email already exists.');
    }
    const user: User = {
        id: uuidv4(),
        name,
        email,
        password,
        totalRequiredHours,
        startDate,
        createdAt: new Date().toISOString(),
        supervisors: [],
        reminderEnabled: true,
    };
    users.push(user);
    setItem(KEYS.USERS, users);
    setItem(KEYS.CURRENT_USER, user);
    return user;
}

export function login(email: string, password: string, rememberMe: boolean): User {
    const users = getItem<User[]>(KEYS.USERS, []);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid email or password.');
    setItem(KEYS.CURRENT_USER, user);
    if (rememberMe) setItem(KEYS.REMEMBER_ME, email);
    else localStorage.removeItem(KEYS.REMEMBER_ME);
    return user;
}

export function logout(): void {
    localStorage.removeItem(KEYS.CURRENT_USER);
}

export function getCurrentUser(): User | null {
    return getItem<User | null>(KEYS.CURRENT_USER, null);
}

export function getRememberedEmail(): string {
    return getItem<string>(KEYS.REMEMBER_ME, '');
}

export function updateUser(updates: Partial<User>): User {
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const users = getItem<User[]>(KEYS.USERS, []);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) throw new Error('User not found');
    const updated = { ...users[idx], ...updates };
    users[idx] = updated;
    setItem(KEYS.USERS, users);
    setItem(KEYS.CURRENT_USER, updated);
    return updated;
}

// --- Daily Logs ---
export function getDailyLogs(userId: string): DailyLog[] {
    return getItem<DailyLog[]>(KEYS.DAILY_LOGS, []).filter((l) => l.userId === userId);
}

export function addDailyLog(log: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt'>): DailyLog {
    const logs = getItem<DailyLog[]>(KEYS.DAILY_LOGS, []);
    const newLog: DailyLog = {
        ...log,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    logs.push(newLog);
    setItem(KEYS.DAILY_LOGS, logs);

    // Auto-save supervisor
    if (log.supervisor) {
        const user = getCurrentUser();
        if (user && !user.supervisors.includes(log.supervisor)) {
            updateUser({ supervisors: [...user.supervisors, log.supervisor] });
        }
    }

    return newLog;
}

export function updateDailyLog(id: string, updates: Partial<DailyLog>): DailyLog {
    const logs = getItem<DailyLog[]>(KEYS.DAILY_LOGS, []);
    const idx = logs.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Log not found');
    logs[idx] = { ...logs[idx], ...updates, updatedAt: new Date().toISOString() };
    setItem(KEYS.DAILY_LOGS, logs);
    return logs[idx];
}

export function deleteDailyLog(id: string): void {
    const logs = getItem<DailyLog[]>(KEYS.DAILY_LOGS, []);
    setItem(
        KEYS.DAILY_LOGS,
        logs.filter((l) => l.id !== id)
    );
}

// --- Weekly Reports ---
export function getWeeklyReports(userId: string): WeeklyReport[] {
    return getItem<WeeklyReport[]>(KEYS.WEEKLY_REPORTS, []).filter((r) => r.userId === userId);
}

export function saveWeeklyReport(report: Omit<WeeklyReport, 'id' | 'createdAt'>): WeeklyReport {
    const reports = getItem<WeeklyReport[]>(KEYS.WEEKLY_REPORTS, []);
    // Check if a report already exists for this week
    const existingIdx = reports.findIndex(
        (r) => r.userId === report.userId && r.weekStart === report.weekStart
    );
    const newReport: WeeklyReport = {
        ...report,
        id: existingIdx >= 0 ? reports[existingIdx].id : uuidv4(),
        createdAt: existingIdx >= 0 ? reports[existingIdx].createdAt : new Date().toISOString(),
    };
    if (existingIdx >= 0) {
        reports[existingIdx] = newReport;
    } else {
        reports.push(newReport);
    }
    setItem(KEYS.WEEKLY_REPORTS, reports);
    return newReport;
}
