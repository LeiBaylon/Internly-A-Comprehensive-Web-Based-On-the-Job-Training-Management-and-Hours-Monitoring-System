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
    limit,
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
} from 'firebase/storage';
import { db, storage } from './firebase';

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
}

export interface Conversation {
    id: string;
    participants: string[];
    participantDetails: Record<string, { name: string; email: string; profileImage?: string }>;
    lastMessage?: string;
    lastMessageTime?: Timestamp;
    lastMessageSenderId?: string;
    unreadCount: Record<string, number>;
}

// ─── User Profile ───────────────────────────────────────

export async function upsertChatUser(user: ChatUser): Promise<void> {
    const userRef = doc(db, 'chatUsers', user.uid);
    await setDoc(userRef, {
        uid: user.uid,
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
    const userRef = doc(db, 'chatUsers', uid);
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
    // Check if conversation already exists
    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid)
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
        participants: [currentUser.uid, otherUser.uid],
        participantDetails: {
            [currentUser.uid]: {
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
            [currentUser.uid]: 0,
            [otherUser.uid]: 0,
        },
    });

    return conversationRef.id;
}

export function subscribeToConversations(
    uid: string,
    callback: (conversations: Conversation[]) => void
) {
    const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', uid),
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
    });
}

// ─── Messages ───────────────────────────────────────────

export async function sendMessage(
    conversationId: string,
    senderId: string,
    otherUserId: string,
    text?: string,
    imageUrl?: string,
): Promise<void> {
    // Add message
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        senderId,
        text: text || null,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        read: false,
    });

    // Update conversation metadata
    await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: imageUrl ? '📷 Image' : (text || ''),
        lastMessageTime: serverTimestamp(),
        lastMessageSenderId: senderId,
    });

    // Increment unread count for the other user
    const convDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (convDoc.exists()) {
        const data = convDoc.data();
        const currentUnread = data.unreadCount?.[otherUserId] || 0;
        await updateDoc(doc(db, 'conversations', conversationId), {
            [`unreadCount.${otherUserId}`]: currentUnread + 1,
        });
    }
}

export function subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
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
    });
}

export async function markConversationRead(conversationId: string, uid: string): Promise<void> {
    await updateDoc(doc(db, 'conversations', conversationId), {
        [`unreadCount.${uid}`]: 0,
    });
}

// ─── Image Upload ───────────────────────────────────────

export async function uploadChatImage(
    conversationId: string,
    file: File,
): Promise<string> {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `chat-images/${conversationId}/${filename}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}
