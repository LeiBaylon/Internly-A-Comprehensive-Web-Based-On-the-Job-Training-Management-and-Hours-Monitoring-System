import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    updateDoc,
    arrayUnion,
    arrayRemove,
    limit,
    increment,
    writeBatch,
    deleteField,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// ─── Types ──────────────────────────────────────────────

export interface ChatUser {
    uid: string;
    name: string;
    email: string;
    profileImage?: string;
    online?: boolean;
    lastSeen?: Timestamp;
}

export interface Message {
    id: string;
    senderId: string;
    text?: string;
    imageUrl?: string;
    timestamp: Timestamp;
    read: boolean;
    status?: 'sent' | 'delivered' | 'seen';
    readBy?: Record<string, boolean>;
}

export interface Conversation {
    id: string;
    participants: string[];
    participantDetails: Record<string, { name: string; email: string; profileImage?: string }>;
    lastMessage?: string;
    lastMessageTime?: Timestamp;
    lastMessageSenderId?: string;
    unreadCount: Record<string, number>;
    isGroup?: boolean;
    groupName?: string;
    groupAvatar?: string;
    createdBy?: string;
    nicknames?: Record<string, string>;
    typing?: Record<string, Timestamp>;
}

// ─── User Profile ───────────────────────────────────────

export async function upsertChatUser(user: ChatUser): Promise<void> {
    // Always use Firebase Auth UID for Firestore operations
    const uid = auth.currentUser?.uid || user.uid;
    const userRef = doc(db, 'chatUsers', uid);
    await setDoc(userRef, {
        uid: uid,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage || null,
        online: true,
        lastSeen: serverTimestamp(),
    }, { merge: true });
}

export async function getChatUser(uid: string): Promise<ChatUser | null> {
    const snap = await getDoc(doc(db, 'chatUsers', uid));
    if (!snap.exists()) return null;
    return snap.data() as ChatUser;
}

export async function getAllChatUsers(): Promise<ChatUser[]> {
    const snap = await getDocs(collection(db, 'chatUsers'));
    return snap.docs.map(d => d.data() as ChatUser);
}

export async function setUserOnlineStatus(uid: string, online: boolean): Promise<void> {
    const effectiveUid = auth.currentUser?.uid || uid;
    const userRef = doc(db, 'chatUsers', effectiveUid);
    await updateDoc(userRef, {
        online,
        lastSeen: serverTimestamp(),
    });
}

// ─── Conversations ──────────────────────────────────────

export async function getOrCreateConversation(
    currentUser: ChatUser,
    otherUser: ChatUser
): Promise<string> {
    // Use Firebase Auth UID to ensure Firestore rules pass
    const currentUid = auth.currentUser?.uid || currentUser.uid;

    // Check if conversation already exists
    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUid)
    );
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.participants.includes(otherUser.uid)) {
            return docSnap.id;
        }
    }

    // Create new conversation
    const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: [currentUid, otherUser.uid],
        participantDetails: {
            [currentUid]: {
                name: currentUser.name,
                email: currentUser.email,
                profileImage: currentUser.profileImage || null,
            },
            [otherUser.uid]: {
                name: otherUser.name,
                email: otherUser.email,
                profileImage: otherUser.profileImage || null,
            },
        },
        lastMessage: null,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: null,
        unreadCount: {
            [currentUid]: 0,
            [otherUser.uid]: 0,
        },
    });

    return conversationRef.id;
}

export function subscribeToConversations(
    uid: string,
    callback: (conversations: Conversation[]) => void,
    onError?: (error: Error) => void,
) {
    const effectiveUid = auth.currentUser?.uid || uid;
    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', effectiveUid),
    );

    return onSnapshot(q, (snapshot) => {
        const conversations = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
        })) as Conversation[];

        // Sort by lastMessageTime client-side
        conversations.sort((a, b) => {
            const aTime = a.lastMessageTime?.toMillis?.() || 0;
            const bTime = b.lastMessageTime?.toMillis?.() || 0;
            return bTime - aTime;
        });

        callback(conversations);
    }, (error) => {
        console.error('Conversations subscription error:', error);
        onError?.(error);
    });
}

export async function createGroupConversation(
    currentUser: ChatUser,
    members: ChatUser[],
    groupName: string,
): Promise<string> {
    const currentUid = auth.currentUser?.uid || currentUser.uid;

    const allParticipants = [currentUid, ...members.map(m => m.uid)];
    const participantDetails: Record<string, { name: string; email: string; profileImage?: string }> = {
        [currentUid]: {
            name: currentUser.name,
            email: currentUser.email,
            profileImage: currentUser.profileImage || null as unknown as undefined,
        },
    };
    const unreadCount: Record<string, number> = { [currentUid]: 0 };

    for (const m of members) {
        participantDetails[m.uid] = {
            name: m.name,
            email: m.email,
            profileImage: m.profileImage || null as unknown as undefined,
        };
        unreadCount[m.uid] = 0;
    }

    const conversationRef = await addDoc(collection(db, 'conversations'), {
        participants: allParticipants,
        participantDetails,
        lastMessage: `${currentUser.name} created the group`,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: null,
        unreadCount,
        isGroup: true,
        groupName,
        groupAvatar: null,
        createdBy: currentUid,
    });

    return conversationRef.id;
}

// ─── Messages ───────────────────────────────────────────

export async function sendMessage(
    conversationId: string,
    senderId: string,
    otherUserIds: string | string[],
    text?: string,
    imageUrl?: string,
): Promise<void> {
    // Use Firebase Auth UID to ensure Firestore rules pass
    const effectiveSenderId = auth.currentUser?.uid || senderId;

    // CRITICAL: Add the message — this is the primary operation
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId: effectiveSenderId,
        text: text || null,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent',
        readBy: { [effectiveSenderId]: true },
    });

    // NON-CRITICAL: Update conversation metadata + unread counts
    // If this fails, the message was still sent — don't throw
    try {
        const ids = Array.isArray(otherUserIds) ? otherUserIds : [otherUserIds];
        const unreadUpdates: Record<string, ReturnType<typeof increment>> = {};
        for (const id of ids) {
            unreadUpdates[`unreadCount.${id}`] = increment(1);
        }
        await updateDoc(doc(db, 'conversations', conversationId), {
            lastMessage: imageUrl ? '📷 Image' : (text || ''),
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: effectiveSenderId,
            ...unreadUpdates,
            // Clear typing when sending
            [`typing.${effectiveSenderId}`]: deleteField(),
        });
    } catch (err) {
        console.warn('Failed to update conversation metadata (message was still sent):', err);
    }
}

export function subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
    onError?: (error: Error) => void,
) {
    const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(200),
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
        })) as Message[];
        callback(messages);
    }, (error) => {
        console.error('Messages subscription error:', error);
        onError?.(error);
    });
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
    const effectiveUid = auth.currentUser?.uid || uid;
    await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${effectiveUid}`]: 0,
    });
}

// Mark all messages in a conversation as seen by this user
export async function markMessagesAsSeen(
    conversationId: string,
    uid: string,
    messages: Message[],
): Promise<void> {
    const effectiveUid = auth.currentUser?.uid || uid;
    const batch = writeBatch(db);
    let count = 0;

    for (const msg of messages) {
        if (msg.senderId !== effectiveUid && !msg.readBy?.[effectiveUid]) {
            const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
            batch.update(msgRef, {
                [`readBy.${effectiveUid}`]: true,
                status: 'seen',
            });
            count++;
            if (count >= 400) break; // Firestore batch limit is 500
        }
    }

    if (count > 0) {
        await batch.commit();
    }
}

// ─── Typing Indicator ───────────────────────────────────

export async function setTypingStatus(
    conversationId: string,
    uid: string,
    isTyping: boolean,
): Promise<void> {
    const effectiveUid = auth.currentUser?.uid || uid;
    try {
        if (isTyping) {
            await updateDoc(doc(db, 'conversations', conversationId), {
                [`typing.${effectiveUid}`]: serverTimestamp(),
            });
        } else {
            await updateDoc(doc(db, 'conversations', conversationId), {
                [`typing.${effectiveUid}`]: deleteField(),
            });
        }
    } catch {
        // Non-critical, ignore errors
    }
}

// ─── Nicknames ──────────────────────────────────────────

// ─── Kick Group Member ──────────────────────────────────

export async function kickGroupMember(
    conversationId: string,
    targetUid: string,
): Promise<void> {
    const effectiveUid = auth.currentUser?.uid;
    if (!effectiveUid) throw new Error('Not authenticated');

    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) throw new Error('Conversation not found');

    const data = convSnap.data();
    if (data.createdBy !== effectiveUid) {
        throw new Error('Only the group creator can kick members');
    }
    if (targetUid === effectiveUid) {
        throw new Error('You cannot kick yourself');
    }
    if (!data.participants?.includes(targetUid)) {
        throw new Error('User is not in this group');
    }

    // Remove from participants array and clean up related fields
    const updates: Record<string, unknown> = {
        participants: arrayRemove(targetUid),
        [`participantDetails.${targetUid}`]: deleteField(),
        [`unreadCount.${targetUid}`]: deleteField(),
        [`nicknames.${targetUid}`]: deleteField(),
        [`typing.${targetUid}`]: deleteField(),
    };

    await updateDoc(convRef, updates);

    // Send a system message about the kick
    const kickedName = data.participantDetails?.[targetUid]?.name || 'A member';
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId: 'system',
        text: `${kickedName} was removed from the group`,
        imageUrl: null,
        timestamp: serverTimestamp(),
        read: true,
        status: 'seen',
        readBy: {},
    });

    // Update last message
    await updateDoc(convRef, {
        lastMessage: `${kickedName} was removed from the group`,
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: null,
    });
}

export async function setNickname(
    conversationId: string,
    targetUid: string,
    nickname: string,
): Promise<void> {
    const effectiveUid = auth.currentUser?.uid;
    if (!effectiveUid) throw new Error('Not authenticated');

    if (nickname.trim()) {
        await updateDoc(doc(db, 'conversations', conversationId), {
            [`nicknames.${targetUid}`]: nickname.trim(),
        });
    } else {
        // Remove nickname by setting to empty string (Firestore doesn't support deleting nested fields easily)
        await updateDoc(doc(db, 'conversations', conversationId), {
            [`nicknames.${targetUid}`]: '',
        });
    }
}

// ─── Image Upload (ImgBB - free) ────────────────────────

export async function uploadChatImage(
    _conversationId: string,
    file: File | Blob,
): Promise<string> {
    const formData = new FormData();
    formData.append('image', file, file instanceof File ? file.name : `image_${Date.now()}.jpg`);

    const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Image upload failed');
    }

    const data = await response.json();
    return data.url;
}
