'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '@/lib/context';
import {
    ChatUser,
    Conversation,
    Message,
    upsertChatUser,
    getAllChatUsers,
    getChatUser,
    getOrCreateConversation,
    subscribeToConversations,
    subscribeToMessages,
    sendMessage,
    markConversationRead,
    uploadChatImage,
    setUserOnlineStatus,
} from '@/lib/chat';
import {
    Search,
    Send,
    Image as ImageIcon,
    ArrowLeft,
    X,
    User as UserIcon,
    Mail,
    Calendar,
    Clock,
    MessageCircle,
    Users,
    Smile,
} from 'lucide-react';

// ─── Profile Modal ──────────────────────────────────────

function ProfileModal({ chatUser, onClose }: { chatUser: ChatUser | null; onClose: () => void }) {
    if (!chatUser) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--slate-900)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20,
                    maxWidth: 400,
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                {/* Header banner */}
                <div style={{
                    height: 100,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
                    position: 'relative',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.3)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: -40 }}>
                    {chatUser.profileImage ? (
                        <img
                            src={chatUser.profileImage}
                            alt={chatUser.name}
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                border: '4px solid var(--slate-900)',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            border: '4px solid var(--slate-900)',
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 28,
                            color: 'white',
                        }}>
                            {chatUser.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div style={{ padding: '16px 24px 28px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>
                        {chatUser.name}
                    </h2>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: chatUser.online ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${chatUser.online ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)'}`,
                        marginBottom: 20,
                    }}>
                        <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: chatUser.online ? '#22c55e' : '#64748b',
                        }} />
                        <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: chatUser.online ? '#4ade80' : 'var(--slate-400)',
                        }}>
                            {chatUser.online ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <Mail size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 2 }}>Email</p>
                                <p style={{ fontSize: 14, color: 'white', wordBreak: 'break-all' }}>{chatUser.email}</p>
                            </div>
                        </div>

                        {chatUser.lastSeen && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <Clock size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                                <div>
                                    <p style={{ fontSize: 11, color: 'var(--slate-500)', marginBottom: 2 }}>Last seen</p>
                                    <p style={{ fontSize: 14, color: 'white' }}>
                                        {chatUser.lastSeen?.toDate?.()
                                            ? new Date(chatUser.lastSeen.toDate()).toLocaleString()
                                            : 'Recently'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Image Preview Modal ────────────────────────────────

function ImagePreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                cursor: 'zoom-out',
            }}
        >
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: 'white',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <X size={20} />
            </button>
            <img
                src={url}
                alt="Preview"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    borderRadius: 12,
                    objectFit: 'contain',
                    cursor: 'default',
                }}
            />
        </div>
    );
}

// ─── Main Chat Page ─────────────────────────────────────

export default function ChatPage() {
    const { user } = useApp();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [allUsers, setAllUsers] = useState<ChatUser[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<ChatUser | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    const currentUserId = user?.id || '';

    // Get the other user from a conversation
    const getOtherUser = useCallback((conv: Conversation) => {
        const otherId = conv.participants.find(p => p !== currentUserId) || '';
        return conv.participantDetails?.[otherId] || { name: 'Unknown', email: '', profileImage: undefined };
    }, [currentUserId]);

    // Register current user in Firestore on mount
    useEffect(() => {
        if (!user) return;
        const chatUser: ChatUser = {
            uid: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
        };
        upsertChatUser(chatUser);

        // Set offline on unmount
        return () => {
            setUserOnlineStatus(user.id, false);
        };
    }, [user]);

    // Load all users
    useEffect(() => {
        if (!user) return;
        getAllChatUsers().then(users => {
            setAllUsers(users.filter(u => u.uid !== currentUserId));
        });
    }, [user, currentUserId]);

    // Subscribe to conversations
    useEffect(() => {
        if (!currentUserId) return;
        const unsub = subscribeToConversations(currentUserId, setConversations);
        return () => unsub();
    }, [currentUserId]);

    // Subscribe to messages of active conversation
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }
        const unsub = subscribeToMessages(activeConversationId, (msgs) => {
            setMessages(msgs);
            // Mark as read
            markConversationRead(activeConversationId, currentUserId);
        });
        return () => unsub();
    }, [activeConversationId, currentUserId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when conversation opens
    useEffect(() => {
        if (activeConversationId) {
            setTimeout(() => messageInputRef.current?.focus(), 100);
        }
    }, [activeConversationId]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const handleStartConversation = async (otherUser: ChatUser) => {
        if (!user) return;
        const chatUser: ChatUser = {
            uid: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
        };
        const convId = await getOrCreateConversation(chatUser, otherUser);
        setActiveConversationId(convId);
        setShowUserSearch(false);
        setSearchQuery('');
    };

    const handleSendMessage = async () => {
        if ((!messageText.trim() && !uploading) || !activeConversationId || !activeConversation) return;
        const text = messageText.trim();
        setMessageText('');
        setSending(true);

        const otherId = activeConversation.participants.find(p => p !== currentUserId) || '';
        await sendMessage(activeConversationId, currentUserId, otherId, text);
        setSending(false);
        messageInputRef.current?.focus();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeConversationId || !activeConversation) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB.');
            return;
        }

        setUploading(true);
        try {
            const imageUrl = await uploadChatImage(activeConversationId, file);
            const otherId = activeConversation.participants.find(p => p !== currentUserId) || '';
            await sendMessage(activeConversationId, currentUserId, otherId, undefined, imageUrl);
        } catch (err) {
            console.error('Image upload failed:', err);
            alert('Failed to upload image. Please try again.');
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleViewProfile = async (uid: string) => {
        const profile = await getChatUser(uid);
        if (profile) setSelectedProfile(profile);
    };

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount?.[currentUserId] || 0), 0);

    const formatTime = (timestamp: { toDate?: () => Date } | undefined) => {
        if (!timestamp?.toDate) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString();
    };

    const formatMessageTime = (timestamp: { toDate?: () => Date } | undefined) => {
        if (!timestamp?.toDate) return '';
        return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // ─── RENDER ─────────────────────────────────────────

    return (
        <div style={{
            display: 'flex',
            height: 'calc(100vh - 40px)',
            maxHeight: 'calc(100vh - 40px)',
            background: 'var(--slate-950)',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            {/* ─── LEFT PANEL: Conversations List ──────────── */}
            <div
                style={{
                    width: 360,
                    minWidth: 300,
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255,255,255,0.01)',
                }}
                className="chat-left-panel"
            >
                {/* Header */}
                <div style={{
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <MessageCircle size={22} style={{ color: 'var(--primary-400)' }} />
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>Messages</h2>
                            {totalUnread > 0 && (
                                <span style={{
                                    background: 'var(--primary-500)',
                                    color: 'white',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 10,
                                }}>
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setShowUserSearch(true)}
                            title="New conversation"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: 'var(--primary-500)',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 150ms',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            <Users size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }} />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 38px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.04)',
                                color: 'white',
                                fontSize: 14,
                                outline: 'none',
                            }}
                        />
                    </div>
                </div>

                {/* User Search Modal */}
                {showUserSearch && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: 60,
                    }}>
                        <div style={{
                            background: 'var(--slate-900)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            maxWidth: 400,
                            width: '90%',
                            maxHeight: '60vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>New Conversation</h3>
                                <button
                                    onClick={() => { setShowUserSearch(false); setSearchQuery(''); }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        padding: 4,
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{
                                        position: 'absolute',
                                        left: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--slate-500)',
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Search users by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '10px 12px 10px 38px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'white',
                                            fontSize: 14,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                {filteredUsers.length === 0 ? (
                                    <div style={{
                                        padding: 40,
                                        textAlign: 'center',
                                        color: 'var(--slate-500)',
                                        fontSize: 14,
                                    }}>
                                        {allUsers.length === 0 ? 'No other users found.' : 'No users match your search.'}
                                    </div>
                                ) : (
                                    filteredUsers.map(u => (
                                        <button
                                            key={u.uid}
                                            onClick={() => handleStartConversation(u)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '12px 14px',
                                                borderRadius: 12,
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                transition: 'background 150ms',
                                                textAlign: 'left',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {u.profileImage ? (
                                                <img src={u.profileImage} alt={u.name} style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    color: 'white',
                                                    flexShrink: 0,
                                                }}>
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>{u.name}</p>
                                                <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                                            </div>
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: u.online ? '#22c55e' : '#475569',
                                                flexShrink: 0,
                                            }} />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Conversations list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                    {conversations.length === 0 ? (
                        <div style={{
                            padding: 40,
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 12,
                        }}>
                            <div style={{
                                width: 56,
                                height: 56,
                                borderRadius: '50%',
                                background: 'rgba(99,102,241,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <MessageCircle size={24} style={{ color: 'var(--primary-400)' }} />
                            </div>
                            <p style={{ color: 'var(--slate-400)', fontSize: 14 }}>No conversations yet</p>
                            <button
                                onClick={() => setShowUserSearch(true)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    background: 'var(--primary-500)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Start chatting
                            </button>
                        </div>
                    ) : (
                        conversations
                            .filter(c => {
                                if (!searchQuery || showUserSearch) return true;
                                const other = getOtherUser(c);
                                return other.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    || other.email.toLowerCase().includes(searchQuery.toLowerCase());
                            })
                            .map(conv => {
                                const other = getOtherUser(conv);
                                const unread = conv.unreadCount?.[currentUserId] || 0;
                                const isActive = conv.id === activeConversationId;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setActiveConversationId(conv.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '14px',
                                            borderRadius: 12,
                                            border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                            background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 150ms',
                                            textAlign: 'left',
                                            marginBottom: 2,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            {other.profileImage ? (
                                                <img src={other.profileImage} alt={other.name} style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: 18,
                                                    color: 'white',
                                                }}>
                                                    {other.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: 4,
                                            }}>
                                                <span style={{
                                                    fontSize: 14,
                                                    fontWeight: unread > 0 ? 700 : 600,
                                                    color: 'white',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {other.name}
                                                </span>
                                                <span style={{
                                                    fontSize: 11,
                                                    color: unread > 0 ? 'var(--primary-400)' : 'var(--slate-500)',
                                                    fontWeight: unread > 0 ? 600 : 400,
                                                    flexShrink: 0,
                                                    marginLeft: 8,
                                                }}>
                                                    {formatTime(conv.lastMessageTime)}
                                                </span>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}>
                                                <span style={{
                                                    fontSize: 13,
                                                    color: unread > 0 ? 'var(--slate-300)' : 'var(--slate-500)',
                                                    fontWeight: unread > 0 ? 500 : 400,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '80%',
                                                }}>
                                                    {conv.lastMessageSenderId === currentUserId && conv.lastMessage ? 'You: ' : ''}
                                                    {conv.lastMessage || 'Start chatting...'}
                                                </span>
                                                {unread > 0 && (
                                                    <span style={{
                                                        background: 'var(--primary-500)',
                                                        color: 'white',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        width: 20,
                                                        height: 20,
                                                        borderRadius: '50%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        {unread}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                    )}
                </div>
            </div>

            {/* ─── RIGHT PANEL: Chat Window ────────────────── */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                }}
                className="chat-right-panel"
            >
                {!activeConversationId ? (
                    // Empty state
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        padding: 40,
                    }}>
                        <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'rgba(99,102,241,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <MessageCircle size={36} style={{ color: 'var(--primary-400)', opacity: 0.6 }} />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>Select a conversation</h3>
                        <p style={{ fontSize: 14, color: 'var(--slate-500)', textAlign: 'center', maxWidth: 300 }}>
                            Pick a conversation from the list or start a new one to begin chatting with fellow interns.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'rgba(255,255,255,0.01)',
                        }}>
                            <button
                                onClick={() => setActiveConversationId(null)}
                                className="chat-back-btn"
                                style={{
                                    display: 'none',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-400)',
                                    cursor: 'pointer',
                                    padding: 4,
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>

                            {activeConversation && (() => {
                                const other = getOtherUser(activeConversation);
                                const otherId = activeConversation.participants.find(p => p !== currentUserId) || '';
                                return (
                                    <>
                                        <button
                                            onClick={() => handleViewProfile(otherId)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                flexShrink: 0,
                                            }}
                                            title="View profile"
                                        >
                                            {other.profileImage ? (
                                                <img src={other.profileImage} alt={other.name} style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: 16,
                                                    color: 'white',
                                                }}>
                                                    {other.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleViewProfile(otherId)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                textAlign: 'left',
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <p style={{
                                                fontSize: 15,
                                                fontWeight: 700,
                                                color: 'white',
                                                margin: 0,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {other.name}
                                            </p>
                                            <p style={{
                                                fontSize: 12,
                                                color: 'var(--slate-500)',
                                                margin: 0,
                                            }}>
                                                Tap to view profile
                                            </p>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Messages area */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                            className="chat-messages-area"
                        >
                            {messages.length === 0 && (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Smile size={32} style={{ color: 'var(--slate-600)', marginBottom: 8 }} />
                                        <p style={{ color: 'var(--slate-500)', fontSize: 14 }}>
                                            Say hello! Send the first message.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                const isMine = msg.senderId === currentUserId;
                                const showAvatar = idx === 0 || messages[idx - 1]?.senderId !== msg.senderId;
                                const isLastInGroup = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;

                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                                            gap: 8,
                                            marginTop: showAvatar ? 12 : 0,
                                        }}
                                    >
                                        {/* Other user avatar */}
                                        {!isMine && showAvatar && activeConversation && (() => {
                                            const other = getOtherUser(activeConversation);
                                            return other.profileImage ? (
                                                <img src={other.profileImage} alt="" style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    marginTop: 'auto',
                                                }} />
                                            ) : (
                                                <div style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    color: 'white',
                                                    flexShrink: 0,
                                                    marginTop: 'auto',
                                                }}>
                                                    {other.name.charAt(0).toUpperCase()}
                                                </div>
                                            );
                                        })()}
                                        {!isMine && !showAvatar && <div style={{ width: 28, flexShrink: 0 }} />}

                                        <div style={{ maxWidth: '70%' }}>
                                            {/* Image message */}
                                            {msg.imageUrl && (
                                                <div
                                                    onClick={() => setPreviewImage(msg.imageUrl || null)}
                                                    style={{
                                                        cursor: 'zoom-in',
                                                        borderRadius: 16,
                                                        overflow: 'hidden',
                                                        marginBottom: msg.text ? 4 : 0,
                                                        border: `2px solid ${isMine ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                                    }}
                                                >
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Shared image"
                                                        style={{
                                                            maxWidth: 260,
                                                            maxHeight: 300,
                                                            display: 'block',
                                                            borderRadius: 14,
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Text message */}
                                            {msg.text && (
                                                <div style={{
                                                    padding: '10px 16px',
                                                    borderRadius: isMine
                                                        ? (isLastInGroup ? '18px 18px 4px 18px' : '18px 4px 4px 18px')
                                                        : (isLastInGroup ? '18px 18px 18px 4px' : '4px 18px 18px 4px'),
                                                    background: isMine
                                                        ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                                                        : 'rgba(255,255,255,0.06)',
                                                    color: 'white',
                                                    fontSize: 14,
                                                    lineHeight: 1.5,
                                                    wordBreak: 'break-word',
                                                }}>
                                                    {msg.text}
                                                </div>
                                            )}

                                            {/* Timestamp */}
                                            {isLastInGroup && (
                                                <p style={{
                                                    fontSize: 10,
                                                    color: 'var(--slate-600)',
                                                    marginTop: 4,
                                                    textAlign: isMine ? 'right' : 'left',
                                                    paddingLeft: isMine ? 0 : 4,
                                                    paddingRight: isMine ? 4 : 0,
                                                }}>
                                                    {formatMessageTime(msg.timestamp)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div style={{
                            padding: '12px 16px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(255,255,255,0.01)',
                        }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                title="Send image"
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: uploading ? 'var(--primary-400)' : 'var(--slate-400)',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 150ms',
                                }}
                                onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.color = 'var(--primary-400)'; }}
                                onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.color = 'var(--slate-400)'; }}
                            >
                                {uploading ? (
                                    <span style={{
                                        width: 18,
                                        height: 18,
                                        border: '2px solid rgba(99,102,241,0.3)',
                                        borderTopColor: 'var(--primary-400)',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                        display: 'block',
                                    }} />
                                ) : (
                                    <ImageIcon size={20} />
                                )}
                            </button>

                            <input
                                ref={messageInputRef}
                                type="text"
                                placeholder="Type a message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'white',
                                    fontSize: 14,
                                    outline: 'none',
                                }}
                            />

                            <button
                                onClick={handleSendMessage}
                                disabled={!messageText.trim() || sending}
                                title="Send"
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: messageText.trim() ? 'var(--primary-500)' : 'rgba(255,255,255,0.04)',
                                    border: messageText.trim() ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                    color: 'white',
                                    cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 150ms',
                                    opacity: messageText.trim() ? 1 : 0.5,
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {selectedProfile && (
                <ProfileModal chatUser={selectedProfile} onClose={() => setSelectedProfile(null)} />
            )}
            {previewImage && (
                <ImagePreviewModal url={previewImage} onClose={() => setPreviewImage(null)} />
            )}

            {/* Responsive CSS */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .chat-messages-area::-webkit-scrollbar { width: 5px; }
                .chat-messages-area::-webkit-scrollbar-track { background: transparent; }
                .chat-messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .chat-messages-area::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }

                @media (max-width: 768px) {
                    .chat-left-panel {
                        width: 100% !important;
                        min-width: 0 !important;
                        display: ${activeConversationId ? 'none' : 'flex'} !important;
                    }
                    .chat-right-panel {
                        display: ${activeConversationId ? 'flex' : 'none'} !important;
                    }
                    .chat-back-btn {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
}
