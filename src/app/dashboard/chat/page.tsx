'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useApp } from '@/lib/context';
import {
    ChatUser,
    Conversation,
    Message,
    upsertChatUser,
    getAllChatUsers,
    getChatUser,
    getOrCreateConversation,
    createGroupConversation,
    subscribeToConversations,
    subscribeToMessages,
    sendMessage,
    markConversationRead,
    uploadChatImage,
    setUserOnlineStatus,
    setNickname,
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
    AlertCircle,
    Loader2,
    Plus,
    Check,
    Hash,
    Pencil,
} from 'lucide-react';

// ─── Profile Modal ──────────────────────────────────────

function ProfileModal({ chatUser, onClose }: { chatUser: ChatUser | null; onClose: () => void }) {
    if (!chatUser) return null;

    const initial = chatUser.name.charAt(0).toUpperCase();
    const isOnline = chatUser.online;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                animation: 'profileFadeIn 0.25s ease-out',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(15,23,42,1) 100%)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 24,
                    maxWidth: 380,
                    width: '100%',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                    animation: 'profileSlideIn 0.3s ease-out',
                }}
            >
                {/* Header banner with mesh gradient */}
                <div style={{
                    height: 120,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 30%, #a855f7 60%, #06b6d4 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute',
                        width: 160,
                        height: 160,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        top: -60,
                        right: -30,
                    }} />
                    <div style={{
                        position: 'absolute',
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        bottom: -40,
                        left: 20,
                    }} />

                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: 'rgba(0,0,0,0.25)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 200ms',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.25)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: -48 }}>
                    <div style={{ position: 'relative' }}>
                        {chatUser.profileImage ? (
                            <img
                                src={chatUser.profileImage}
                                alt={chatUser.name}
                                style={{
                                    width: 96,
                                    height: 96,
                                    borderRadius: '50%',
                                    border: '4px solid rgba(15,23,42,1)',
                                    objectFit: 'cover',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 96,
                                height: 96,
                                borderRadius: '50%',
                                border: '4px solid rgba(15,23,42,1)',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 36,
                                color: 'white',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                letterSpacing: '-0.02em',
                            }}>
                                {initial}
                            </div>
                        )}
                        {/* Online indicator on avatar */}
                        <div style={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: isOnline ? '#22c55e' : '#64748b',
                            border: '3px solid rgba(15,23,42,1)',
                            boxShadow: isOnline ? '0 0 12px rgba(34,197,94,0.5)' : 'none',
                        }} />
                    </div>
                </div>

                {/* Info section */}
                <div style={{ padding: '16px 28px 32px', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: 'white',
                        marginBottom: 6,
                        letterSpacing: '-0.02em',
                    }}>
                        {chatUser.name}
                    </h2>

                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 14px',
                        borderRadius: 20,
                        background: isOnline ? 'rgba(34,197,94,0.08)' : 'rgba(100,116,139,0.08)',
                        border: `1px solid ${isOnline ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)'}`,
                        marginBottom: 24,
                    }}>
                        <div style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: isOnline ? '#22c55e' : '#64748b',
                            boxShadow: isOnline ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
                        }} />
                        <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isOnline ? '#4ade80' : '#94a3b8',
                            letterSpacing: '0.02em',
                        }}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>

                    {/* Info cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '14px 18px',
                            borderRadius: 14,
                            background: 'rgba(99,102,241,0.04)',
                            border: '1px solid rgba(99,102,241,0.08)',
                            transition: 'all 200ms',
                        }}>
                            <div style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: 'rgba(99,102,241,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Mail size={18} style={{ color: '#818cf8' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: 11, color: '#64748b', marginBottom: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                                <p style={{ fontSize: 14, color: '#e2e8f0', wordBreak: 'break-all', fontWeight: 500 }}>{chatUser.email}</p>
                            </div>
                        </div>

                        {chatUser.lastSeen && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                padding: '14px 18px',
                                borderRadius: 14,
                                background: 'rgba(6,182,212,0.04)',
                                border: '1px solid rgba(6,182,212,0.08)',
                                transition: 'all 200ms',
                            }}>
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 10,
                                    background: 'rgba(6,182,212,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Clock size={18} style={{ color: '#22d3ee' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Seen</p>
                                    <p style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>
                                        {chatUser.lastSeen?.toDate?.()
                                            ? new Date(chatUser.lastSeen.toDate()).toLocaleString()
                                            : 'Recently'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Send message CTA */}
                    <button
                        onClick={onClose}
                        style={{
                            marginTop: 20,
                            width: '100%',
                            padding: '12px 20px',
                            borderRadius: 12,
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            transition: 'all 200ms',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.35)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.25)';
                        }}
                    >
                        <MessageCircle size={16} />
                        Send Message
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes profileFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes profileSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
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
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [chatError, setChatError] = useState<string | null>(null);
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
    const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
    // Group chat creation state
    const [showGroupCreate, setShowGroupCreate] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<ChatUser[]>([]);
    const [groupSearchQuery, setGroupSearchQuery] = useState('');
    const [creatingGroup, setCreatingGroup] = useState(false);
    // Nickname state
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [nicknameTarget, setNicknameTarget] = useState<string>('');
    const [nicknameValue, setNicknameValue] = useState('');
    const [savingNickname, setSavingNickname] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    const currentUserId = user?.id || '';

    // Wait for Firebase Auth to restore session before making Firestore calls
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (fbUser) => {
            setFirebaseUser(fbUser);
            setAuthLoading(false);
            if (!fbUser && user) {
                setChatError('Firebase session expired. Please log out and log back in to use chat.');
            }
        });
        return () => unsub();
    }, [user]);

    // Get display name for a user in a conversation (nickname > real name)
    const getDisplayName = useCallback((conv: Conversation, uid: string) => {
        const nickname = conv.nicknames?.[uid];
        if (nickname) return nickname;
        return conv.participantDetails?.[uid]?.name || 'Unknown';
    }, []);

    // Get the other user from a conversation (for 1:1 chats)
    const getOtherUser = useCallback((conv: Conversation) => {
        const otherId = conv.participants.find(p => p !== currentUserId) || '';
        return conv.participantDetails?.[otherId] || { name: 'Unknown', email: '', profileImage: undefined };
    }, [currentUserId]);

    // Get display info for a conversation (works for both 1:1 and group)
    const getConversationDisplay = useCallback((conv: Conversation) => {
        if (conv.isGroup) {
            return {
                name: conv.groupName || 'Unnamed Group',
                avatar: conv.groupAvatar,
                isGroup: true,
                memberCount: conv.participants.length,
            };
        }
        const otherId = conv.participants.find(p => p !== currentUserId) || '';
        const other = getOtherUser(conv);
        const displayName = getDisplayName(conv, otherId);
        return {
            name: displayName,
            avatar: other.profileImage,
            isGroup: false,
            memberCount: 2,
        };
    }, [getOtherUser, getDisplayName, currentUserId]);

    // Get sender name from participant details (prefers nickname)
    const getSenderName = useCallback((conv: Conversation, senderId: string) => {
        if (senderId === currentUserId) return 'You';
        return getDisplayName(conv, senderId);
    }, [currentUserId, getDisplayName]);

    // Register current user in Firestore on mount (only after Firebase Auth is ready)
    useEffect(() => {
        if (!user || !firebaseUser) return;
        const chatUser: ChatUser = {
            uid: user.id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage,
        };
        upsertChatUser(chatUser).catch(err => {
            console.error('Failed to register chat user:', err);
            setChatError('Failed to connect to chat. Check your Firestore rules.');
        });

        // Set offline on unmount
        return () => {
            setUserOnlineStatus(user.id, false).catch(() => {});
        };
    }, [user, firebaseUser]);

    // Load all users (only after Firebase Auth is ready)
    useEffect(() => {
        if (!user || !firebaseUser) return;
        getAllChatUsers().then(users => {
            setAllUsers(users.filter(u => u.uid !== currentUserId));
        }).catch(err => {
            console.error('Failed to load users:', err);
        });
    }, [user, firebaseUser, currentUserId]);

    // Subscribe to conversations (only after Firebase Auth is ready)
    useEffect(() => {
        if (!currentUserId || !firebaseUser) return;
        const unsub = subscribeToConversations(
            currentUserId,
            setConversations,
            (error) => {
                console.error('Conversation error:', error);
                setChatError('Failed to load conversations. Please check Firestore rules allow chat access.');
            }
        );
        return () => unsub();
    }, [currentUserId, firebaseUser]);

    // Subscribe to messages of active conversation
    useEffect(() => {
        if (!activeConversationId || !firebaseUser) {
            setMessages([]);
            return;
        }
        const unsub = subscribeToMessages(
            activeConversationId,
            (msgs) => {
                setMessages(msgs);
                // Mark as read
                markConversationRead(activeConversationId, currentUserId).catch(() => {});
            },
            (error) => {
                console.error('Messages subscription error:', error);
                setChatError('Failed to load messages. Check Firestore rules.');
            }
        );
        return () => unsub();
    }, [activeConversationId, currentUserId, firebaseUser]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when conversation opens & clear pending image
    useEffect(() => {
        if (activeConversationId) {
            setTimeout(() => messageInputRef.current?.focus(), 100);
        }
        // Clear pending images when switching conversations
        setPendingImages(prev => {
            prev.forEach(img => URL.revokeObjectURL(img.preview));
            return [];
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeConversationId]);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const handleStartConversation = async (otherUser: ChatUser) => {
        if (!user) return;
        try {
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
        } catch (err) {
            console.error('Failed to start conversation:', err);
            setChatError('Failed to start conversation. Check Firestore permissions.');
        }
    };

    const handleCreateGroup = async () => {
        if (!user || !groupName.trim() || selectedGroupMembers.length < 2) return;
        setCreatingGroup(true);
        try {
            const chatUser: ChatUser = {
                uid: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
            };
            const convId = await createGroupConversation(chatUser, selectedGroupMembers, groupName.trim());
            setActiveConversationId(convId);
            setShowGroupCreate(false);
            setShowUserSearch(false);
            setGroupName('');
            setSelectedGroupMembers([]);
            setGroupSearchQuery('');
        } catch (err) {
            console.error('Failed to create group:', err);
            setChatError('Failed to create group. Check Firestore permissions.');
        }
        setCreatingGroup(false);
    };

    const toggleGroupMember = (u: ChatUser) => {
        setSelectedGroupMembers(prev =>
            prev.find(m => m.uid === u.uid)
                ? prev.filter(m => m.uid !== u.uid)
                : [...prev, u]
        );
    };

    const openNicknameModal = (targetUid: string) => {
        if (!activeConversation) return;
        setNicknameTarget(targetUid);
        setNicknameValue(activeConversation.nicknames?.[targetUid] || '');
        setShowNicknameModal(true);
    };

    const handleSaveNickname = async () => {
        if (!activeConversationId || !nicknameTarget) return;
        setSavingNickname(true);
        try {
            await setNickname(activeConversationId, nicknameTarget, nicknameValue);
            setShowNicknameModal(false);
        } catch (err) {
            console.error('Failed to set nickname:', err);
            setChatError('Failed to set nickname.');
        }
        setSavingNickname(false);
    };

    const clearAllPendingImages = () => {
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
        setPendingImages([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePendingImage = (index: number) => {
        setPendingImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSendMessage = async () => {
        const hasText = messageText.trim().length > 0;
        const hasImages = pendingImages.length > 0;
        if ((!hasText && !hasImages) || !activeConversationId || !activeConversation) return;
        const text = messageText.trim();
        setMessageText('');
        setSending(true);

        try {
            const otherIds = activeConversation.participants.filter(p => p !== currentUserId);

            if (hasImages) {
                setUploading(true);
                // Upload all images
                const imageUrls: string[] = [];
                for (const img of pendingImages) {
                    const url = await uploadChatImage(activeConversationId, img.file);
                    imageUrls.push(url);
                }
                setUploading(false);
                clearAllPendingImages();

                // Send first image with text (if any), rest as separate image messages
                await sendMessage(activeConversationId, currentUserId, otherIds, text || undefined, imageUrls[0]);
                for (let i = 1; i < imageUrls.length; i++) {
                    await sendMessage(activeConversationId, currentUserId, otherIds, undefined, imageUrls[i]);
                }
            } else {
                await sendMessage(activeConversationId, currentUserId, otherIds, text);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setUploading(false);
            if (text) setMessageText(text);
            setChatError('Failed to send message. Please try again.');
        }
        setSending(false);
        messageInputRef.current?.focus();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !activeConversationId || !activeConversation) return;

        const newImages: { file: File; preview: string }[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                alert(`"${file.name}" is not an image file. Skipped.`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(`"${file.name}" exceeds 5MB. Skipped.`);
                continue;
            }
            newImages.push({ file, preview: URL.createObjectURL(file) });
        }

        if (newImages.length > 0) {
            setPendingImages(prev => [...prev, ...newImages]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        messageInputRef.current?.focus();
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

    // Loading state while Firebase Auth restores session
    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                height: 'calc(100vh - 40px)',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--slate-950)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: 'var(--primary-400)', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--slate-400)', fontSize: 14, marginTop: 12 }}>Connecting to chat...</p>
                </div>
            </div>
        );
    }

    // Error state if Firebase Auth is not available
    if (!firebaseUser && user) {
        return (
            <div style={{
                display: 'flex',
                height: 'calc(100vh - 40px)',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--slate-950)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: 40,
            }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: 16 }} />
                    <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Chat Unavailable</h3>
                    <p style={{ color: 'var(--slate-400)', fontSize: 14, lineHeight: 1.6 }}>
                        Your Firebase session has expired. Please log out and log back in to use the chat feature.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            height: 'calc(100vh - 40px)',
            maxHeight: 'calc(100vh - 40px)',
            background: 'var(--slate-950)',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
        }}
        className="chat-outer-container"
        >
            {/* Error banner */}
            {chatError && (
                <div style={{
                    position: 'absolute',
                    top: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 200,
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    maxWidth: '90%',
                }}>
                    <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span style={{ color: '#fca5a5', fontSize: 13 }}>{chatError}</span>
                    <button
                        onClick={() => setChatError(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            padding: 2,
                            flexShrink: 0,
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
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

                {/* User Search Modal / Group Create Modal */}
                {showUserSearch && !showGroupCreate && (
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

                            {/* Create Group Button */}
                            <button
                                onClick={() => { setShowGroupCreate(true); setSearchQuery(''); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 20px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'background 150ms',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Users size={18} style={{ color: 'white' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>Create Group Chat</p>
                                    <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: 0 }}>Chat with multiple people</p>
                                </div>
                            </button>

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

                {/* Group Creation Modal */}
                {showGroupCreate && (
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
                        paddingTop: 40,
                    }}>
                        <div style={{
                            background: 'var(--slate-900)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 16,
                            maxWidth: 420,
                            width: '92%',
                            maxHeight: '75vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <button
                                    onClick={() => { setShowGroupCreate(false); setGroupName(''); setSelectedGroupMembers([]); setGroupSearchQuery(''); }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        padding: 4,
                                    }}
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', flex: 1 }}>Create Group Chat</h3>
                                <button
                                    onClick={() => { setShowGroupCreate(false); setShowUserSearch(false); setGroupName(''); setSelectedGroupMembers([]); setGroupSearchQuery(''); }}
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

                            {/* Group Name Input */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-400)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Group Name
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={16} style={{
                                        position: 'absolute',
                                        left: 12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--slate-500)',
                                    }} />
                                    <input
                                        type="text"
                                        placeholder="Enter group name..."
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
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

                            {/* Selected Members Chips */}
                            {selectedGroupMembers.length > 0 && (
                                <div style={{
                                    padding: '10px 20px',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                }}>
                                    {selectedGroupMembers.map(m => (
                                        <span
                                            key={m.uid}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '4px 10px 4px 6px',
                                                borderRadius: 20,
                                                background: 'rgba(99,102,241,0.15)',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#a5b4fc',
                                            }}
                                        >
                                            {m.profileImage ? (
                                                <img src={m.profileImage} alt="" style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    color: 'white',
                                                }}>
                                                    {m.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {m.name.split(' ')[0]}
                                            <button
                                                onClick={() => toggleGroupMember(m)}
                                                style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, display: 'flex' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Search Members */}
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
                                        placeholder="Search members to add..."
                                        value={groupSearchQuery}
                                        onChange={(e) => setGroupSearchQuery(e.target.value)}
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

                            {/* User List (selectable) */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                                {allUsers
                                    .filter(u =>
                                        u.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
                                        u.email.toLowerCase().includes(groupSearchQuery.toLowerCase())
                                    )
                                    .map(u => {
                                        const isSelected = selectedGroupMembers.some(m => m.uid === u.uid);
                                        return (
                                            <button
                                                key={u.uid}
                                                onClick={() => toggleGroupMember(u)}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    padding: '12px 14px',
                                                    borderRadius: 12,
                                                    border: 'none',
                                                    background: isSelected ? 'rgba(99,102,241,0.08)' : 'transparent',
                                                    cursor: 'pointer',
                                                    transition: 'background 150ms',
                                                    textAlign: 'left',
                                                }}
                                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
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
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 6,
                                                    border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.15)',
                                                    background: isSelected ? 'var(--primary-500)' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 150ms',
                                                }}>
                                                    {isSelected && <Check size={14} style={{ color: 'white' }} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>

                            {/* Create Button */}
                            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim() || selectedGroupMembers.length < 2 || creatingGroup}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: (groupName.trim() && selectedGroupMembers.length >= 2)
                                            ? 'linear-gradient(135deg, #6366f1, #7c3aed)'
                                            : 'rgba(255,255,255,0.06)',
                                        color: (groupName.trim() && selectedGroupMembers.length >= 2) ? 'white' : 'var(--slate-500)',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: (groupName.trim() && selectedGroupMembers.length >= 2) ? 'pointer' : 'not-allowed',
                                        transition: 'all 150ms',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                    }}
                                >
                                    {creatingGroup ? (
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        <Users size={16} />
                                    )}
                                    {creatingGroup ? 'Creating...' : `Create Group${selectedGroupMembers.length > 0 ? ` (${selectedGroupMembers.length} members)` : ''}`}
                                </button>
                                {selectedGroupMembers.length < 2 && selectedGroupMembers.length > 0 && (
                                    <p style={{ fontSize: 11, color: 'var(--slate-500)', textAlign: 'center', marginTop: 6 }}>
                                        Select at least 2 members to create a group
                                    </p>
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
                                const display = getConversationDisplay(c);
                                if (c.isGroup) {
                                    return display.name.toLowerCase().includes(searchQuery.toLowerCase());
                                }
                                const other = getOtherUser(c);
                                return other.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    || other.email.toLowerCase().includes(searchQuery.toLowerCase());
                            })
                            .map(conv => {
                                const display = getConversationDisplay(conv);
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
                                            {conv.isGroup ? (
                                                <div style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}>
                                                    <Users size={20} style={{ color: 'white' }} />
                                                </div>
                                            ) : display.avatar ? (
                                                <img src={display.avatar} alt={display.name} style={{
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
                                                    {display.name.charAt(0).toUpperCase()}
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
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}>
                                                    {display.name}
                                                    {conv.isGroup && (
                                                        <span style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 400 }}>
                                                            ({display.memberCount})
                                                        </span>
                                                    )}
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
                                                    {conv.lastMessageSenderId === currentUserId && conv.lastMessage ? 'You: ' : 
                                                     (conv.isGroup && conv.lastMessageSenderId ? `${getSenderName(conv, conv.lastMessageSenderId)}: ` : '')}
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
                    minHeight: 0,
                    overflow: 'hidden',
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
                                const display = getConversationDisplay(activeConversation);
                                if (activeConversation.isGroup) {
                                    return (
                                        <>
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <Users size={18} style={{ color: 'white' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    color: 'white',
                                                    margin: 0,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                    {display.name}
                                                </p>
                                                <p style={{
                                                    fontSize: 12,
                                                    color: 'var(--slate-500)',
                                                    margin: 0,
                                                }}>
                                                    {display.memberCount} members
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => openNicknameModal('')}
                                                title="Set nicknames"
                                                style={{
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    color: 'var(--slate-400)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 150ms',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-400)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </>
                                    );
                                }
                                const other = getOtherUser(activeConversation);
                                const otherId = activeConversation.participants.find(p => p !== currentUserId) || '';
                                const otherDisplayName = getDisplayName(activeConversation, otherId);
                                const hasNickname = !!(activeConversation.nicknames?.[otherId]);
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
                                                {otherDisplayName}
                                                {hasNickname && (
                                                    <span style={{ fontSize: 11, color: 'var(--slate-500)', fontWeight: 400, marginLeft: 6 }}>
                                                        ({other.name})
                                                    </span>
                                                )}
                                            </p>
                                            <p style={{
                                                fontSize: 12,
                                                color: 'var(--slate-500)',
                                                margin: 0,
                                            }}>
                                                Tap to view profile
                                            </p>
                                        </button>
                                        <button
                                            onClick={() => openNicknameModal(otherId)}
                                            title="Set nickname"
                                            style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 8,
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                color: 'var(--slate-400)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                transition: 'all 150ms',
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary-400)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--slate-400)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                        >
                                            <Pencil size={14} />
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
                                const isGroup = activeConversation?.isGroup;
                                const senderDetails = activeConversation?.participantDetails?.[msg.senderId];

                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                                            gap: 8,
                                            marginTop: showAvatar ? 12 : 0,
                                        }}
                                    >
                                        {/* Other user avatar */}
                                        {!isMine && showAvatar && activeConversation && (() => {
                                            const sender = isGroup
                                                ? (senderDetails || { name: 'Unknown', profileImage: undefined })
                                                : getOtherUser(activeConversation);
                                            return sender.profileImage ? (
                                                <img src={sender.profileImage} alt="" style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    flexShrink: 0,
                                                    marginTop: 2,
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
                                                    marginTop: 2,
                                                }}>
                                                    {sender.name.charAt(0).toUpperCase()}
                                                </div>
                                            );
                                        })()}
                                        {!isMine && !showAvatar && <div style={{ width: 28, flexShrink: 0 }} />}

                                        <div style={{ maxWidth: '70%' }}>
                                            {/* Sender name for group chats */}
                                            {isGroup && !isMine && showAvatar && (
                                                <p style={{
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    color: '#a5b4fc',
                                                    marginBottom: 3,
                                                    paddingLeft: 4,
                                                }}>
                                                    {activeConversation ? getDisplayName(activeConversation, msg.senderId) : 'Unknown'}
                                                </p>
                                            )}

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

                        {/* Pending images preview */}
                        {pendingImages.length > 0 && (
                            <div style={{
                                padding: '10px 16px 4px',
                                borderTop: '1px solid rgba(255,255,255,0.06)',
                                background: 'var(--slate-950)',
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 8,
                                    alignItems: 'flex-end',
                                }}>
                                    {/* Add more images button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 10,
                                            border: '2px dashed rgba(255,255,255,0.15)',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'var(--slate-400)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 2,
                                            flexShrink: 0,
                                            transition: 'all 150ms',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--primary-400)';
                                            e.currentTarget.style.color = 'var(--primary-400)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                            e.currentTarget.style.color = 'var(--slate-400)';
                                        }}
                                        title="Add more images"
                                    >
                                        <Plus size={22} />
                                        <span style={{ fontSize: 9, fontWeight: 500 }}>Add</span>
                                    </button>

                                    {pendingImages.map((img, idx) => (
                                        <div key={idx} style={{
                                            position: 'relative',
                                            width: 72,
                                            height: 72,
                                            borderRadius: 10,
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            flexShrink: 0,
                                        }}>
                                            <img
                                                src={img.preview}
                                                alt={`Preview ${idx + 1}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block',
                                                }}
                                            />
                                            <button
                                                onClick={() => removePendingImage(idx)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 3,
                                                    right: 3,
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    background: 'rgba(0,0,0,0.7)',
                                                    border: 'none',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: 0,
                                                }}
                                                title="Remove"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4 }}>
                                    {pendingImages.length} image{pendingImages.length !== 1 ? 's' : ''} selected — press Send when ready
                                </div>
                            </div>
                        )}

                        {/* Message input */}
                        <div style={{
                            padding: '12px 16px',
                            borderTop: pendingImages.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'var(--slate-950)',
                            flexShrink: 0,
                        }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                multiple
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
                                disabled={(!messageText.trim() && pendingImages.length === 0) || sending || uploading}
                                title="Send"
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: (messageText.trim() || pendingImages.length > 0) ? 'var(--primary-500)' : 'rgba(255,255,255,0.04)',
                                    border: (messageText.trim() || pendingImages.length > 0) ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                    color: 'white',
                                    cursor: (messageText.trim() || pendingImages.length > 0) && !sending && !uploading ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 150ms',
                                    opacity: (messageText.trim() || pendingImages.length > 0) ? 1 : 0.5,
                                }}
                            >
                                {(sending || uploading) ? (
                                    <span style={{
                                        width: 18,
                                        height: 18,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: 'white',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                        display: 'block',
                                    }} />
                                ) : (
                                    <Send size={18} />
                                )}
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

            {/* Nickname Modal */}
            {showNicknameModal && activeConversation && (
                <div
                    onClick={() => setShowNicknameModal(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
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
                            borderRadius: 16,
                            maxWidth: 400,
                            width: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Pencil size={16} style={{ color: 'var(--primary-400)' }} />
                                {activeConversation.isGroup && !nicknameTarget ? 'Set Nicknames' : 'Set Nickname'}
                            </h3>
                            <button
                                onClick={() => setShowNicknameModal(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer', padding: 4 }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '16px 20px', maxHeight: '50vh', overflowY: 'auto' }}>
                            {/* For group chats with no specific target, show all members */}
                            {activeConversation.isGroup && !nicknameTarget ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {activeConversation.participants.map(uid => {
                                        const details = activeConversation.participantDetails?.[uid];
                                        const currentNickname = activeConversation.nicknames?.[uid] || '';
                                        const isMe = uid === currentUserId;
                                        return (
                                            <div key={uid} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '10px 14px',
                                                borderRadius: 12,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}>
                                                {details?.profileImage ? (
                                                    <img src={details.profileImage} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                                ) : (
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: 12, color: 'white', flexShrink: 0,
                                                    }}>
                                                        {(details?.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: 'white', margin: 0 }}>
                                                        {details?.name || 'Unknown'}{isMe ? ' (You)' : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setNicknameTarget(uid);
                                                        setNicknameValue(currentNickname);
                                                    }}
                                                    style={{
                                                        padding: '5px 10px',
                                                        borderRadius: 6,
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        background: currentNickname ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                                                        color: currentNickname ? '#a5b4fc' : 'var(--slate-400)',
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        cursor: 'pointer',
                                                        transition: 'all 150ms',
                                                        maxWidth: 120,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {currentNickname || 'Set'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Single user nickname edit */
                                <div>
                                    <p style={{ fontSize: 13, color: 'var(--slate-400)', marginBottom: 12 }}>
                                        Set a nickname for <strong style={{ color: 'white' }}>
                                            {activeConversation.participantDetails?.[nicknameTarget]?.name || 'this user'}
                                        </strong>
                                        {nicknameTarget === currentUserId ? ' (yourself)' : ''}
                                    </p>
                                    <input
                                        type="text"
                                        placeholder="Enter nickname (leave empty to remove)"
                                        value={nicknameValue}
                                        onChange={(e) => setNicknameValue(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveNickname();
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.04)',
                                            color: 'white',
                                            fontSize: 14,
                                            outline: 'none',
                                            marginBottom: 16,
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {activeConversation.isGroup && (
                                            <button
                                                onClick={() => { setNicknameTarget(''); setNicknameValue(''); }}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: 10,
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.04)',
                                                    color: 'var(--slate-400)',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Back
                                            </button>
                                        )}
                                        <button
                                            onClick={handleSaveNickname}
                                            disabled={savingNickname}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                                                color: 'white',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: savingNickname ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                opacity: savingNickname ? 0.7 : 1,
                                            }}
                                        >
                                            {savingNickname ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                                            {savingNickname ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Responsive CSS */}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                .chat-messages-area::-webkit-scrollbar { width: 5px; }
                .chat-messages-area::-webkit-scrollbar-track { background: transparent; }
                .chat-messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
                .chat-messages-area::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }

                @media (max-width: 1024px) {
                    .chat-outer-container {
                        height: calc(100dvh - 140px) !important;
                        max-height: calc(100dvh - 140px) !important;
                        border-radius: 12px !important;
                    }
                }

                @media (max-width: 768px) {
                    .chat-outer-container {
                        height: calc(100dvh - 140px) !important;
                        max-height: calc(100dvh - 140px) !important;
                        border-radius: 8px !important;
                    }
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
