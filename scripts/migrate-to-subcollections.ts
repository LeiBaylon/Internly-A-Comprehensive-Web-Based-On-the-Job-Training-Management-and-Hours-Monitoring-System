/**
 * Migration script: Flat collections → User-centric subcollections
 *
 * Reads from:
 *   - dailyLogs/{logId}
 *   - weeklyReports/{reportId}
 *   - notifications/{notifId}
 *
 * Writes to:
 *   - users/{userId}/dailyLogs/{logId}
 *   - users/{userId}/weeklyReports/{reportId}
 *   - users/{userId}/notifications/{notifId}
 *
 * Safe to run multiple times — skips docs that already exist in target.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-subcollections.ts
 *   npx tsx scripts/migrate-to-subcollections.ts --dry-run
 */

import { initializeApp, cert, ServiceAccount, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ─── Initialize Firebase Admin ─────────────────────────
const PROJECT_ID = 'internly-12';
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');

let app;

if (fs.existsSync(serviceAccountPath)) {
    console.log('✓ Using service-account.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8')) as ServiceAccount;
    app = initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
} else {
    // Try Firebase CLI's refresh token → create temp ADC file
    const firebaseConfigPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (fs.existsSync(firebaseConfigPath)) {
        const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
        const tokens = config.tokens || config.user?.tokens;

        if (tokens?.refresh_token) {
            console.log('✓ Using Firebase CLI refresh token (creating temp ADC)');

            // Create a temporary ADC-compatible JSON
            const adcContent = JSON.stringify({
                type: 'authorized_user',
                client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
                client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
                refresh_token: tokens.refresh_token,
            });

            const tmpAdcPath = path.join(os.tmpdir(), `firebase-adc-${Date.now()}.json`);
            fs.writeFileSync(tmpAdcPath, adcContent);
            process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpAdcPath;

            // Clean up on exit
            process.on('exit', () => {
                try { fs.unlinkSync(tmpAdcPath); } catch { /* ignore */ }
            });

            app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
        } else {
            throw new Error('No refresh_token in Firebase CLI config. Run `firebase login` first.');
        }
    } else {
        throw new Error('No credentials found. Place service-account.json in project root or run `firebase login`.');
    }
}

const db = getFirestore(app);

// ─── Config ────────────────────────────────────────────
const BATCH_LIMIT = 490; // Firestore batch max is 500
const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationStats {
    dailyLogs: { read: number; migrated: number; skipped: number };
    weeklyReports: { read: number; migrated: number; skipped: number };
    notifications: { read: number; migrated: number; skipped: number };
}

async function migrate() {
    console.log(`\n🚀 Starting migration${DRY_RUN ? ' (DRY RUN — no writes)' : ''}...\n`);

    const stats: MigrationStats = {
        dailyLogs: { read: 0, migrated: 0, skipped: 0 },
        weeklyReports: { read: 0, migrated: 0, skipped: 0 },
        notifications: { read: 0, migrated: 0, skipped: 0 },
    };

    // ─── Migrate dailyLogs ─────────────────────────────
    console.log('📋 Migrating dailyLogs...');
    const logsSnap = await db.collection('dailyLogs').get();
    stats.dailyLogs.read = logsSnap.size;

    let batch = db.batch();
    let batchCount = 0;

    for (const docSnap of logsSnap.docs) {
        if (docSnap.id === '_schema_') continue;
        const data = docSnap.data();
        const userId = data.userId;
        if (!userId) {
            console.warn(`  ⚠ dailyLogs/${docSnap.id} has no userId — skipping`);
            stats.dailyLogs.skipped++;
            continue;
        }

        // Check if already migrated
        const targetRef = db.doc(`users/${userId}/dailyLogs/${docSnap.id}`);
        const targetSnap = await targetRef.get();
        if (targetSnap.exists) {
            stats.dailyLogs.skipped++;
            continue;
        }

        if (!DRY_RUN) {
            batch.set(targetRef, data);
            batchCount++;
            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                console.log(`  ✅ Committed batch of ${batchCount} dailyLogs`);
                batch = db.batch();
                batchCount = 0;
            }
        }
        stats.dailyLogs.migrated++;
    }

    if (batchCount > 0 && !DRY_RUN) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} dailyLogs`);
    }

    // ─── Migrate weeklyReports ─────────────────────────
    console.log('📋 Migrating weeklyReports...');
    const reportsSnap = await db.collection('weeklyReports').get();
    stats.weeklyReports.read = reportsSnap.size;

    batch = db.batch();
    batchCount = 0;

    for (const docSnap of reportsSnap.docs) {
        if (docSnap.id === '_schema_') continue;
        const data = docSnap.data();
        const userId = data.userId;
        if (!userId) {
            console.warn(`  ⚠ weeklyReports/${docSnap.id} has no userId — skipping`);
            stats.weeklyReports.skipped++;
            continue;
        }

        const targetRef = db.doc(`users/${userId}/weeklyReports/${docSnap.id}`);
        const targetSnap = await targetRef.get();
        if (targetSnap.exists) {
            stats.weeklyReports.skipped++;
            continue;
        }

        if (!DRY_RUN) {
            batch.set(targetRef, data);
            batchCount++;
            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                console.log(`  ✅ Committed batch of ${batchCount} weeklyReports`);
                batch = db.batch();
                batchCount = 0;
            }
        }
        stats.weeklyReports.migrated++;
    }

    if (batchCount > 0 && !DRY_RUN) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} weeklyReports`);
    }

    // ─── Migrate notifications ─────────────────────────
    console.log('📋 Migrating notifications...');
    const notifsSnap = await db.collection('notifications').get();
    stats.notifications.read = notifsSnap.size;

    batch = db.batch();
    batchCount = 0;

    for (const docSnap of notifsSnap.docs) {
        if (docSnap.id === '_schema_') continue;
        const data = docSnap.data();
        const userId = data.userId;
        if (!userId) {
            console.warn(`  ⚠ notifications/${docSnap.id} has no userId — skipping`);
            stats.notifications.skipped++;
            continue;
        }

        const targetRef = db.doc(`users/${userId}/notifications/${docSnap.id}`);
        const targetSnap = await targetRef.get();
        if (targetSnap.exists) {
            stats.notifications.skipped++;
            continue;
        }

        if (!DRY_RUN) {
            batch.set(targetRef, data);
            batchCount++;
            if (batchCount >= BATCH_LIMIT) {
                await batch.commit();
                console.log(`  ✅ Committed batch of ${batchCount} notifications`);
                batch = db.batch();
                batchCount = 0;
            }
        }
        stats.notifications.migrated++;
    }

    if (batchCount > 0 && !DRY_RUN) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} notifications`);
    }

    // ─── Summary ───────────────────────────────────────
    console.log('\n═══════════════════════════════════════');
    console.log(`  Migration ${DRY_RUN ? '(DRY RUN)' : 'COMPLETE'}`);
    console.log('═══════════════════════════════════════');
    console.log(`  dailyLogs:      ${stats.dailyLogs.read} read, ${stats.dailyLogs.migrated} migrated, ${stats.dailyLogs.skipped} skipped`);
    console.log(`  weeklyReports:  ${stats.weeklyReports.read} read, ${stats.weeklyReports.migrated} migrated, ${stats.weeklyReports.skipped} skipped`);
    console.log(`  notifications:  ${stats.notifications.read} read, ${stats.notifications.migrated} migrated, ${stats.notifications.skipped} skipped`);
    console.log('═══════════════════════════════════════\n');
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
