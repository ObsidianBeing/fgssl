/* eslint-disable @typescript-eslint/no-explicit-any */
// POST /api/dashboard/resources/imagekit
// Uploads audio/pdf/document to ImageKit, stores doc in Mongo
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import { connectMongoDB } from '@/lib/mongodb';
import Resource from '@/models/Resource';

export const runtime = 'nodejs';

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

function toBuffer(f: File) {
    return f.arrayBuffer().then((ab) => Buffer.from(ab));
}

function parseBool(v: FormDataEntryValue | null, def = false) {
    if (typeof v !== 'string') return def;
    return v === 'true' || v === '1';
}

function parseTags(v: FormDataEntryValue | null): string[] {
    if (!v || typeof v !== 'string') return [];
    return v
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}

const ACCEPTED: Record<string, string[]> = {
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
    pdf: ['application/pdf'],
    document: [
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/json',
    ],
};

export async function POST(req: Request) {
    try {
        await connectMongoDB();

        const form = await req.formData();
        const file = form.get('file') as File | null;
        const title = (form.get('title') as string) || '';
        const type = (form.get('type') as string) || '';
        const downloadable = parseBool(form.get('downloadable'), true);
        const category = (form.get('category') as string) || 'other';
        const featured = parseBool(form.get('featured'));
        const description = (form.get('description') as string) || '';
        const tags = parseTags(form.get('tags'));

        if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
        if (!title.trim()) return NextResponse.json({ error: 'Missing title' }, { status: 400 });
        if (!['audio', 'pdf', 'document'].includes(type))
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

        if (!ACCEPTED[type].includes(file.type)) {
            return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
        }

        const buffer = await toBuffer(file);

        // Upload to ImageKit
        const uploaded = await imagekit.upload({
            file: buffer,
            fileName: `${Date.now()}_${file.name}`,
            folder: `/resources/${type}`,
            useUniqueFileName: true,
            tags: tags.length ? tags : undefined,
        });

        // Save to DB
        const doc = await Resource.create({
            name: title.trim(),
            type,
            url: uploaded.url,
            fileId: uploaded.fileId,
            size: file.size,
            downloadable,
            uploadedAt: new Date(),
            category,
            featured,
            description,
            tags,
            mime: file.type,
        });

        return NextResponse.json({
            _id: doc._id.toString(),
            fileId: doc.fileId,
            name: doc.name,
            type: doc.type,
            url: doc.url,
            downloadable: doc.downloadable,
            uploadedAt: doc.uploadedAt,
            size: doc.size,
            featured: doc.featured,
            description: doc.description,
            tags: doc.tags,
            category: doc.category,
            mime: doc.mime,
        });
    } catch (err: any) {
        console.error('POST /resources/imagekit error', err);
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
