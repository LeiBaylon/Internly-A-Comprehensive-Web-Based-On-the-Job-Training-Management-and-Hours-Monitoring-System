/**
 * Quick verification: list all users and their subcollection doc counts.
 * Usage: npx tsx scripts/verify-subcollections.ts
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const PROJECT_ID = 'internly-12';

// Reuse the Firebase CLI ADC trick
const firebaseConfigPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
const tokens = config.tokens || config.user?.tokens;
const adcContent = JSON.stringify({
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: tokens.refresh_token,
});
const tmpAdcPath = path.join(os.tmpdir(), `firebase-adc-verify-${Date.now()}.json`);
fs.writeFileSync(tmpAdcPath, adcContent);
process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpAdcPath;
process.on('exit', () => { try { fs.unlinkSync(tmpAdcPath); } catch {} });

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore(app);

async function verify() {
    console.log('\n🔍 Verifying subcollection structure...\n');

    // List all user docs
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} user(s):\n`);

    for (const userDoc of usersSnap.docs) {
        if (userDoc.id === '_schema_') continue;
        const data = userDoc.data();
        console.log(`  👤 ${data.name || data.email || userDoc.id} (${userDoc.id})`);

        const logs = await db.collection(`users/${userDoc.id}/dailyLogs`).get();
        const reports = await db.collection(`users/${userDoc.id}/weeklyReports`).get();
        const notifs = await db.collection(`users/${userDoc.id}/notifications`).get();

        console.log(`     ├─ dailyLogs:      ${logs.size} doc(s)`);
        console.log(`     ├─ weeklyReports:  ${reports.size} doc(s)`);
        console.log(`     └─ notifications:  ${notifs.size} doc(s)\n`);
    }

    // Show old flat collection counts for comparison
    console.log('  📊 Old flat collections (for comparison):');
    const oldLogs = await db.collection('dailyLogs').get();
    const oldReports = await db.collection('weeklyReports').get();
    const oldNotifs = await db.collection('notifications').get();
    console.log(`     ├─ dailyLogs:      ${oldLogs.size} doc(s) (includes _schema_)`);
    console.log(`     ├─ weeklyReports:  ${oldReports.size} doc(s) (includes _schema_)`);
    console.log(`     └─ notifications:  ${oldNotifs.size} doc(s) (includes _schema_)\n`);
}

verify().catch(console.error);
