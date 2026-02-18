/**
 * Cleanup script: Delete all legacy flat collection docs and _schema_ marker docs.
 * This leaves only the new user-centric subcollection architecture.
 *
 * What gets DELETED:
 *   - All docs in flat dailyLogs/ (legacy)
 *   - All docs in flat weeklyReports/ (legacy)
 *   - All docs in flat notifications/ (legacy)
 *   - All docs in flat time_logs/ (legacy)
 *   - All _schema_ docs in every collection
 *   - appMetadata/version (no longer needed)
 *
 * What stays UNTOUCHED:
 *   - users/{userId} (profiles)
 *   - users/{userId}/dailyLogs/ (migrated data)
 *   - users/{userId}/weeklyReports/ (migrated data)
 *   - users/{userId}/notifications/ (migrated data)
 *   - conversations/{id} + messages/ (chat data)
 *   - chatUsers/{userId} (chat presence)
 *   - supervisors/{id} (shared data — real docs only)
 *
 * Usage:
 *   npx tsx scripts/cleanup-legacy.ts --dry-run
 *   npx tsx scripts/cleanup-legacy.ts
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const PROJECT_ID = 'internly-12';
const DRY_RUN = process.argv.includes('--dry-run');

// Auth setup
const firebaseConfigPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
const tokens = config.tokens || config.user?.tokens;
const adcContent = JSON.stringify({
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: tokens.refresh_token,
});
const tmpPath = path.join(os.tmpdir(), `firebase-adc-cleanup-${Date.now()}.json`);
fs.writeFileSync(tmpPath, adcContent);
process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
process.on('exit', () => { try { fs.unlinkSync(tmpPath); } catch {} });

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore(app);

async function cleanup() {
    console.log(`\n🧹 Cleaning up legacy data${DRY_RUN ? ' (DRY RUN)' : ''}...\n`);

    let totalDeleted = 0;

    // ─── 1. Delete ALL docs in flat legacy collections ───
    const legacyCollections = ['dailyLogs', 'weeklyReports', 'notifications', 'time_logs'];

    for (const colName of legacyCollections) {
        const snap = await db.collection(colName).get();
        if (snap.empty) {
            console.log(`  ✓ ${colName}/ — already empty`);
            continue;
        }

        console.log(`  🗑  ${colName}/ — deleting ${snap.size} doc(s)...`);
        const batch = db.batch();
        for (const docSnap of snap.docs) {
            if (!DRY_RUN) batch.delete(docSnap.ref);
            console.log(`       - ${docSnap.id}`);
            totalDeleted++;
        }
        if (!DRY_RUN) await batch.commit();
    }

    // ─── 2. Delete _schema_ docs from remaining collections ───
    const schemaCollections = ['users', 'conversations', 'chatUsers', 'supervisors', 'appMetadata'];

    for (const colName of schemaCollections) {
        const schemaRef = db.doc(`${colName}/_schema_`);
        const schemaSnap = await schemaRef.get();
        if (schemaSnap.exists) {
            console.log(`  🗑  ${colName}/_schema_ — deleting`);
            if (!DRY_RUN) await schemaRef.delete();
            totalDeleted++;
        }
    }

    // ─── 3. Delete appMetadata/version (legacy init marker) ───
    const versionRef = db.doc('appMetadata/version');
    const versionSnap = await versionRef.get();
    if (versionSnap.exists) {
        console.log(`  🗑  appMetadata/version — deleting`);
        if (!DRY_RUN) await versionRef.delete();
        totalDeleted++;
    }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`  Cleanup ${DRY_RUN ? '(DRY RUN) would delete' : 'COMPLETE — deleted'} ${totalDeleted} doc(s)`);
    console.log(`═══════════════════════════════════════\n`);
}

cleanup().catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
});
