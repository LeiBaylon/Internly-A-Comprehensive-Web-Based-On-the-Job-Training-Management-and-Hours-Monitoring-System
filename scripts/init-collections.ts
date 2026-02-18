/**
 * Firestore Collection Initializer
 * 
 * Seeds all Firestore collections with _schema_ documents that describe
 * the expected document structure. This ensures collections are visible in
 * the Firebase Console and serves as documentation.
 *
 * Usage: npx tsx scripts/init-collections.ts
 */

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCjXUIlDvdaG_8KknLMOuNU4XhZiIAzBnY",
    authDomain: "internly-12.firebaseapp.com",
    projectId: "internly-12",
    storageBucket: "internly-12.firebasestorage.app",
    messagingSenderId: "574019615807",
    appId: "1:574019615807:web:beeab2dd72a5cbeeeecc8a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface CollectionSchema {
    collectionName: string;
    description: string;
    fields: Record<string, string>;
    subcollections?: CollectionSchema[];
}

const COLLECTIONS: CollectionSchema[] = [
    {
        collectionName: 'users',
        description: 'User profiles — one document per registered user, keyed by Firebase Auth UID',
        fields: {
            id: 'string — Firebase Auth UID',
            name: 'string — Display name',
            email: 'string — Email address',
            totalRequiredHours: 'number — Total OJT hours required (e.g., 480)',
            startDate: 'string — ISO date of internship start',
            endDate: 'string | null — ISO date of internship end',
            createdAt: 'string — ISO datetime of account creation',
            supervisors: 'string[] — List of supervisor names',
            reminderEnabled: 'boolean — Whether daily reminders are enabled',
            profileImage: 'string | null — Profile image URL or base64 data URL',
            updatedAt: 'Timestamp — Firestore server timestamp of last update',
        },
    },
    {
        collectionName: 'dailyLogs',
        description: 'Daily training log entries — one document per log entry',
        fields: {
            id: 'string — UUID of the log entry',
            userId: 'string — Firebase Auth UID of the owner',
            entryDate: 'string — ISO date (YYYY-MM-DD) of the log',
            activityType: 'string[] — Activity types (Technical, Coding, etc.)',
            taskDescription: 'string — HTML or plain text description of tasks',
            supervisor: 'string — Name of the supervising person',
            dailyHours: 'number — Hours worked (0.5–12)',
            attachments: 'Attachment[] | null — File attachments [{id, name, url, type}]',
            createdAt: 'string — ISO datetime of creation',
            updatedAt: 'string — ISO datetime of last update',
            _createdAt: 'Timestamp — Firestore server timestamp',
            _updatedAt: 'Timestamp — Firestore server timestamp',
        },
    },
    {
        collectionName: 'weeklyReports',
        description: 'Weekly reflection reports — one document per week per user',
        fields: {
            id: 'string — UUID of the report',
            userId: 'string — Firebase Auth UID of the owner',
            weekStart: 'string — ISO datetime of the week start (Monday)',
            weekEnd: 'string — ISO datetime of the week end (Sunday)',
            reflection: 'string — User reflection/summary text',
            logs: 'DailyLog[] — Snapshot of daily logs for that week',
            createdAt: 'string — ISO datetime of creation',
            _createdAt: 'Timestamp — Firestore server timestamp',
            _updatedAt: 'Timestamp — Firestore server timestamp',
        },
    },
    {
        collectionName: 'chatUsers',
        description: 'Chat user profiles — one document per user, keyed by Firebase Auth UID',
        fields: {
            uid: 'string — Firebase Auth UID',
            name: 'string — Display name',
            email: 'string — Email address',
            profileImage: 'string | null — Profile image URL',
            online: 'boolean — Whether user is currently online',
            lastSeen: 'Timestamp — Firestore server timestamp of last activity',
        },
    },
    {
        collectionName: 'conversations',
        description: 'Chat conversations (1:1 and group) — one document per conversation',
        fields: {
            participants: 'string[] — Array of Firebase Auth UIDs',
            participantDetails: 'Record<uid, {name, email, profileImage}> — Display info per participant',
            lastMessage: 'string | null — Preview of the last message',
            lastMessageTime: 'Timestamp — When the last message was sent',
            lastMessageSenderId: 'string | null — UID of the last message sender',
            unreadCount: 'Record<uid, number> — Unread message count per participant',
            isGroup: 'boolean | null — Whether this is a group conversation',
            groupName: 'string | null — Group name (for group conversations)',
            groupAvatar: 'string | null — Group avatar URL',
            createdBy: 'string | null — UID of the group creator',
            nicknames: 'Record<uid, string> | null — Custom nicknames per participant',
            typing: 'Record<uid, Timestamp> | null — Typing indicators',
        },
        subcollections: [
            {
                collectionName: 'messages',
                description: 'Messages within a conversation — one document per message',
                fields: {
                    senderId: 'string — Firebase Auth UID of sender (or "system")',
                    text: 'string | null — Text content',
                    imageUrl: 'string | null — Uploaded image URL',
                    fileUrl: 'string | null — Uploaded file URL',
                    fileName: 'string | null — Original file name',
                    fileSize: 'number | null — File size in bytes',
                    fileType: 'string | null — MIME type of the file',
                    timestamp: 'Timestamp — When the message was sent',
                    read: 'boolean — Legacy read flag',
                    status: 'string — "sent" | "delivered" | "seen"',
                    readBy: 'Record<uid, boolean> — Which participants have read this message',
                },
            },
        ],
    },
    {
        collectionName: 'notifications',
        description: 'User notifications — reminders, system alerts, etc.',
        fields: {
            id: 'string — UUID of the notification',
            userId: 'string — Firebase Auth UID of the recipient',
            type: 'string — "reminder" | "system" | "achievement" | "report_due"',
            title: 'string — Notification title',
            message: 'string — Notification body text',
            read: 'boolean — Whether the notification has been read',
            link: 'string | null — Optional navigation link',
            createdAt: 'Timestamp — When the notification was created',
        },
    },
    {
        collectionName: 'supervisors',
        description: 'Supervisor registry — shared supervisor lookup for the platform',
        fields: {
            id: 'string — UUID of the supervisor entry',
            name: 'string — Supervisor full name',
            email: 'string | null — Supervisor email (optional)',
            department: 'string | null — Department or team',
            addedBy: 'string — UID of the user who added this supervisor',
            createdAt: 'Timestamp — When the entry was created',
        },
    },
    {
        collectionName: 'appMetadata',
        description: 'Application-level metadata — version info, feature flags, etc.',
        fields: {
            key: 'string — Metadata key (document ID)',
            value: 'any — Metadata value',
            updatedAt: 'Timestamp — Last update time',
        },
    },
];

async function initializeCollections() {
    console.log('🔐 Signing in anonymously for Firestore access...');

    // Enable anonymous auth temporarily in Firebase Console for this to work,
    // or use an existing user's credentials
    try {
        await signInAnonymously(auth);
        console.log('✅ Authenticated\n');
    } catch (err) {
        console.log('⚠️  Anonymous auth not enabled. Proceeding without auth (may fail on secured collections).\n');
    }

    console.log('🔧 Initializing Firestore collections...\n');

    for (const schema of COLLECTIONS) {
        await seedCollection(schema);
    }

    // Seed the appMetadata collection with version info
    const metaRef = doc(db, 'appMetadata', 'version');
    await setDoc(metaRef, {
        key: 'version',
        value: '1.0.0',
        schemaVersion: 1,
        collectionsInitialized: COLLECTIONS.map((c) => c.collectionName),
        initializedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });
    console.log('   ✓ appMetadata/version — updated');

    console.log('\n✅ All collections initialized successfully!');
    console.log('\n📋 Collections in Firestore:');
    for (const schema of COLLECTIONS) {
        console.log(`   • ${schema.collectionName} — ${schema.description}`);
        if (schema.subcollections) {
            for (const sub of schema.subcollections) {
                console.log(`     └─ ${sub.collectionName} — ${sub.description}`);
            }
        }
    }
    
    process.exit(0);
}

async function seedCollection(schema: CollectionSchema, parentPath?: string) {
    const collPath = parentPath || schema.collectionName;
    const schemaDocRef = doc(db, collPath, '_schema_');

    const existing = await getDoc(schemaDocRef).catch(() => null);
    const verb = existing?.exists() ? 'updating' : 'creating';
    console.log(`   ${existing?.exists() ? '✓' : '+'} ${collPath} — ${verb} schema doc`);

    await setDoc(schemaDocRef, {
        _isSchemaDoc: true,
        _description: schema.description,
        _fields: schema.fields,
        _createdAt: serverTimestamp(),
        _updatedAt: serverTimestamp(),
    }, { merge: true });

    // Handle subcollections
    if (schema.subcollections) {
        for (const sub of schema.subcollections) {
            const subSchemaRef = doc(
                collection(doc(db, collPath, '_schema_'), sub.collectionName),
                '_schema_'
            );
            
            const subExisting = await getDoc(subSchemaRef).catch(() => null);
            console.log(`   ${subExisting?.exists() ? '✓' : '+'} ${collPath}/_schema_/${sub.collectionName} — ${subExisting?.exists() ? 'updating' : 'creating'} schema doc`);

            await setDoc(subSchemaRef, {
                _isSchemaDoc: true,
                _description: sub.description,
                _fields: sub.fields,
                _createdAt: serverTimestamp(),
                _updatedAt: serverTimestamp(),
            }, { merge: true });
        }
    }
}

initializeCollections().catch((err) => {
    console.error('❌ Failed to initialize collections:', err.message || err);
    process.exit(1);
});
