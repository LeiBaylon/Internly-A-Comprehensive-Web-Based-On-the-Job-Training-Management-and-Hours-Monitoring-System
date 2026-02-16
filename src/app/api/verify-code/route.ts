import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.VERIFICATION_SECRET || 'internly-default-secret-change-me';

function signToken(code: string, email: string, expiresAt: number): string {
    const hmac = crypto.createHmac('sha256', SECRET);
    hmac.update(`${code}|${email.toLowerCase()}|${expiresAt}`);
    return hmac.digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { code, email, token, expiresAt } = await request.json();

        if (!code || !email || !token || !expiresAt) {
            return NextResponse.json(
                { verified: false, error: 'Missing required fields.' },
                { status: 400 }
            );
        }

        // Check expiry
        if (Date.now() > expiresAt) {
            return NextResponse.json(
                { verified: false, error: 'Code has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Verify HMAC signature
        const expected = signToken(code, email.toLowerCase(), expiresAt);
        const isValid = crypto.timingSafeEqual(
            Buffer.from(expected, 'hex'),
            Buffer.from(token, 'hex')
        );

        if (!isValid) {
            return NextResponse.json(
                { verified: false, error: 'Invalid verification code.' },
                { status: 400 }
            );
        }

        return NextResponse.json({ verified: true });
    } catch {
        return NextResponse.json(
            { verified: false, error: 'Verification failed.' },
            { status: 500 }
        );
    }
}
