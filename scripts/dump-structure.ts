/**
 * Full database structure dump.
 * Usage: npx tsx scripts/dump-structure.ts
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const PROJECT_ID = 'internly-12';
const firebaseConfigPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
const tokens = config.tokens || config.user?.tokens;
const adcContent = JSON.stringify({
    type: 'authorized_user',
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: tokens.refresh_token,
});
const tmpPath = path.join(os.tmpdir(), `firebase-adc-dump-${Date.now()}.json`);
fs.writeFileSync(tmpPath, adcContent);
process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
process.on('exit', () => { try { fs.unlinkSync(tmpPath); } catch {} });

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const db = getFirestore(app);

async function dump() {
    // Known top-level collections
    const topCollections = ['users', 'conversations', 'chatUsers', 'supervisors', 'dailyLogs', 'weeklyReports', 'notifications', 'appMetadata', 'time_logs'];

    console.log('\n════════════════════════════════════════════════════════');
    console.log('  FULL FIRESTORE DATABASE STRUCTURE — internly-12');
    console.log('════════════════════════════════════════════════════════\n');

    for (const col of topCollections) {
        const snap = await db.collection(col).get();
        if (snap.empty) {
            console.log(`📁 ${col}/ (empty)`);
            continue;
        }

        console.log(`📁 ${col}/ (${snap.size} doc(s))`);
        for (const docSnap of snap.docs) {
            const data = docSnap.data();
            const fields = Object.keys(data).sort();
            const preview = fields.slice(0, 6).join(', ') + (fields.length > 6 ? `, ... (+${fields.length - 6})` : '');
            console.log(`   📄 ${docSnap.id}  [${preview}]`);

            // Check subcollections for user docs
            if (col === 'users' && docSnap.id !== '_schema_') {
                const subCols = ['dailyLogs', 'weeklyReports', 'notifications'];
                for (const sub of subCols) {
                    const subSnap = await db.collection(`${col}/${docSnap.id}/${sub}`).get();
                    if (subSnap.size > 0) {
                        console.log(`      📁 ${sub}/ (${subSnap.size} doc(s))`);
                        for (const subDoc of subSnap.docs) {
                            const subData = subDoc.data();
                            const subFields = Object.keys(subData).sort();
                            const subPreview = subFields.slice(0, 5).join(', ') + (subFields.length > 5 ? `, ... (+${subFields.length - 5})` : '');
                            console.log(`         📄 ${subDoc.id}  [${subPreview}]`);
                        }
                    } else {
                        console.log(`      📁 ${sub}/ (empty)`);
                    }
                }
            }

            // Check messages subcollection for conversations
            if (col === 'conversations' && docSnap.id !== '_schema_') {
                const msgsSnap = await db.collection(`${col}/${docSnap.id}/messages`).get();
                console.log(`      📁 messages/ (${msgsSnap.size} doc(s))`);
            }
        }
        console.log('');
    }

    console.log('════════════════════════════════════════════════════════\n');
}

dump().catch(console.error);
