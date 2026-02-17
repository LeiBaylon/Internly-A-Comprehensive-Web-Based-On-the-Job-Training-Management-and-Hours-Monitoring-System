import { NextRequest, NextResponse } from 'next/server';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

export async function POST(req: NextRequest) {
    try {
        if (!IMGBB_API_KEY) {
            return NextResponse.json({ error: 'Image upload not configured' }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Upload to ImgBB
        const imgbbForm = new FormData();
        imgbbForm.append('key', IMGBB_API_KEY);
        imgbbForm.append('image', base64);
        imgbbForm.append('name', `chat_${Date.now()}`);

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: imgbbForm,
        });

        const data = await response.json();

        if (!data.success) {
            console.error('ImgBB upload failed:', data);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }

        return NextResponse.json({
            url: data.data.url,
            thumbnail: data.data.thumb?.url,
            deleteUrl: data.data.delete_url,
        });
    } catch (error) {
        console.error('Image upload error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
