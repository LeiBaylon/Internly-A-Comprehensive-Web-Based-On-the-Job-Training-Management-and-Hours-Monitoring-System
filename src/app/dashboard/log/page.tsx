'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { ACTIVITY_TYPES, ActivityType } from '@/lib/types';
import {
    ArrowLeft,
    Calendar,
    Tag,
    FileText,
    User,
    Clock,
    Check,
    X,
} from 'lucide-react';

function LogFormContent() {
    const { user, logs, addLog, updateLog } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const editingLog = editId ? logs.find((l) => l.id === editId) : null;

    const [entryDate, setEntryDate] = useState(
        editingLog?.entryDate || new Date().toISOString().split('T')[0]
    );
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>(
        editingLog?.activityType || []
    );
    const [taskDescription, setTaskDescription] = useState(
        editingLog?.taskDescription || ''
    );
    const [supervisor, setSupervisor] = useState(editingLog?.supervisor || '');
    const [dailyHours, setDailyHours] = useState(editingLog?.dailyHours || 8);
    const [showSupervisorList, setShowSupervisorList] = useState(false);
    const [success, setSuccess] = useState(false);

    const toggleActivity = (type: ActivityType) => {
        setActivityTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (activityTypes.length === 0) return;

        if (editingLog) {
            updateLog(editingLog.id, {
                entryDate,
                activityType: activityTypes,
                taskDescription,
                supervisor,
                dailyHours,
            });
        } else {
            addLog({
                userId: user.id,
                entryDate,
                activityType: activityTypes,
                taskDescription,
                supervisor,
                dailyHours,
            });
        }

        setSuccess(true);
        setTimeout(() => {
            router.push('/dashboard');
        }, 1500);
    };

    if (!user) return null;

    const savedSupervisors = user.supervisors || [];

    return (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {/* Success Toast */}
            {success && (
                <div style={{
                    position: 'fixed',
                    top: 24,
                    right: 24,
                    zIndex: 2000,
                    padding: '16px 24px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
                    animation: 'slideDown 300ms ease',
                }}>
                    <Check size={20} />
                    {editingLog ? 'Log updated successfully!' : 'Work logged successfully!'}
                </div>
            )}
            <style>{`
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @media (max-width: 480px) {
                    #log-actions {
                        flex-direction: column !important;
                    }
                    #log-actions .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <button
                    className="btn btn-ghost"
                    onClick={() => router.push('/dashboard')}
                    style={{ marginBottom: 16, color: 'var(--slate-400)' }}
                    id="log-back"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <h1 className="page-title" style={{ fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
                    {editingLog ? 'Edit Log Entry' : "Log Today's Work"}
                </h1>
                <p style={{ color: 'var(--slate-400)', fontSize: 14 }}>
                    Record your daily activities and hours rendered
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-elevated" style={{ marginBottom: 24 }}>
                    {/* Date */}
                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label className="input-label" htmlFor="log-date" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} /> Date
                        </label>
                        <input
                            id="log-date"
                            className="input"
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            required
                        />
                    </div>

                    {/* Activity Tags */}
                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag size={14} /> Nature of Activity
                            <span style={{ color: 'var(--rose-400)', marginLeft: 2 }}>*</span>
                        </label>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                            padding: 16,
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(15,23,42,0.4)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {ACTIVITY_TYPES.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`tag ${activityTypes.includes(type) ? 'active' : ''}`}
                                    onClick={() => toggleActivity(type)}
                                >
                                    {activityTypes.includes(type) && <Check size={12} />}
                                    {type}
                                </button>
                            ))}
                        </div>
                        {activityTypes.length === 0 && (
                            <p style={{ fontSize: 12, color: 'var(--rose-400)', marginTop: 4 }}>
                                Select at least one activity type
                            </p>
                        )}
                    </div>

                    {/* Body / Task Description */}
                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label className="input-label" htmlFor="log-body" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileText size={14} /> Task Description
                        </label>
                        <textarea
                            id="log-body"
                            className="input textarea"
                            placeholder="Describe what you worked on today in detail. You can include bullet points, key accomplishments, challenges, and learnings..."
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            required
                            style={{ minHeight: 180, lineHeight: 1.8 }}
                        />
                        <p style={{ fontSize: 11, color: 'var(--slate-600)', marginTop: 4 }}>
                            Be specific — this will appear in your weekly report.
                        </p>
                    </div>

                    {/* Supervisor */}
                    <div className="input-group" style={{ marginBottom: 24, position: 'relative' }}>
                        <label className="input-label" htmlFor="log-supervisor" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} /> Assigned By (Supervisor)
                        </label>
                        <input
                            id="log-supervisor"
                            className="input"
                            type="text"
                            placeholder="Enter supervisor's name"
                            value={supervisor}
                            onChange={(e) => {
                                setSupervisor(e.target.value);
                                setShowSupervisorList(true);
                            }}
                            onFocus={() => setShowSupervisorList(true)}
                            onBlur={() => setTimeout(() => setShowSupervisorList(false), 200)}
                            required
                        />
                        {/* Supervisor dropdown */}
                        {showSupervisorList && savedSupervisors.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: 4,
                                background: 'var(--slate-800)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow: 'var(--shadow-xl)',
                                zIndex: 10,
                                maxHeight: 160,
                                overflowY: 'auto',
                            }}>
                                {savedSupervisors
                                    .filter((s) => s.toLowerCase().includes(supervisor.toLowerCase()))
                                    .map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            style={{
                                                display: 'block',
                                                width: '100%',
                                                padding: '10px 14px',
                                                textAlign: 'left',
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--slate-300)',
                                                fontSize: 13,
                                                cursor: 'pointer',
                                                transition: 'background 100ms',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                            onMouseDown={() => {
                                                setSupervisor(s);
                                                setShowSupervisorList(false);
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Hours Rendered */}
                    <div className="input-group">
                        <label className="input-label" htmlFor="log-hours" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={14} /> Hours Rendered
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <input
                                id="log-hours"
                                className="input"
                                type="range"
                                min={0.5}
                                max={12}
                                step={0.5}
                                value={dailyHours}
                                onChange={(e) => setDailyHours(Number(e.target.value))}
                                style={{
                                    flex: 1,
                                    height: 6,
                                    borderRadius: 'var(--radius-full)',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    background: `linear-gradient(to right, var(--primary-500) 0%, var(--primary-500) ${((dailyHours - 0.5) / 11.5) * 100}%, rgba(255,255,255,0.08) ${((dailyHours - 0.5) / 11.5) * 100}%, rgba(255,255,255,0.08) 100%)`,
                                    border: 'none',
                                    padding: 0,
                                }}
                            />
                            <div style={{
                                minWidth: 64,
                                padding: '8px 16px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(99,102,241,0.1)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                textAlign: 'center',
                                fontSize: 18,
                                fontWeight: 700,
                                color: 'var(--primary-300)',
                            }}>
                                {dailyHours}h
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div id="log-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => router.push('/dashboard')}
                        id="log-cancel"
                    >
                        <X size={16} /> Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-success"
                        disabled={activityTypes.length === 0}
                        id="log-submit"
                    >
                        <Check size={18} /> {editingLog ? 'Update Entry' : 'Submit Log'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function LogPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    border: '3px solid rgba(99,102,241,0.2)',
                    borderTopColor: 'var(--primary-500)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        }>
            <LogFormContent />
        </Suspense>
    );
}
