/* eslint-disable @typescript-eslint/no-explicit-any */
// PATCH /api/dashboard/resources/:id
// DELETE /api/dashboard/resources/:id
// - PATCH updates metadata in Mongo
// - DELETE removes from ImageKit (if fileId) and YouTube (if youtubeId), then deletes Mongo doc
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import ImageKit from 'imagekit';
import { google } from 'googleapis';
import { connectMongoDB } from '@/lib/mongodb';
import Resource from '@/models/Resource';

export const runtime = 'nodejs';

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

function parseBoolLoose(v: unknown): boolean | undefined {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
        if (['true', '1'].includes(v)) return true;
        if (['false', '0'].includes(v)) return false;
    }
    return undefined;
}

function parseTags(v: unknown): string[] | undefined {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') {
        return v
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
    }
    return undefined;
}

function getOAuth2Client() {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
    );
    client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    });
    return client;
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectMongoDB();
        const params = await context.params;
        const id = params.id;
        if (!Types.ObjectId.isValid(id))
            return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

        const payload = await req.json();

        const update: any = {};
        if (typeof payload.name === 'string') update.name = payload.name.trim();
        if (typeof payload.description === 'string') update.description = payload.description;
        if (typeof payload.category === 'string') update.category = payload.category;
        if (parseBoolLoose(payload.featured) !== undefined) update.featured = !!parseBoolLoose(payload.featured);
        if (parseBoolLoose(payload.downloadable) !== undefined) update.downloadable = !!parseBoolLoose(payload.downloadable);
        const tags = parseTags(payload.tags);
        if (tags) update.tags = tags;

        const doc = await Resource.findByIdAndUpdate(id, update, { new: true });
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Optionally mirror metadata to YouTube (title/description/tags/privacy)
        if (doc.youtubeId) {
            const youtube = google.youtube({ version: 'v3', auth: getOAuth2Client() });
            await youtube.videos.update({
                part: ['snippet', 'status'],
                requestBody: {
                    id: doc.youtubeId,
                    snippet: {
                        title: doc.name,
                        description: doc.description || doc.youtubeMetadata?.description || '',
                        tags: doc.tags || doc.youtubeMetadata?.tags || [],
                        categoryId: '22',
                    },
                    status: {
                        privacyStatus:
                            doc.youtubeMetadata?.privacyStatus === 'public' ||
                                doc.youtubeMetadata?.privacyStatus === 'unlisted' ||
                                doc.youtubeMetadata?.privacyStatus === 'private'
                                ? (doc.youtubeMetadata?.privacyStatus as 'public' | 'unlisted' | 'private')
                                : 'unlisted',
                    },
                },
            }).catch((e) => {
                console.warn('YouTube update failed (non-fatal):', e?.response?.data || e?.message);
            });
        }

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
            youtubeId: doc.youtubeId,
            youtubeMetadata: doc.youtubeMetadata,
            mime: doc.mime,
        });
    } catch (err: any) {
        console.error('PATCH /resources/[id] error', err);
        return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        await connectMongoDB();
        const params = await context.params;
        const id = params.id;
        if (!Types.ObjectId.isValid(id))
            return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

        const doc = await Resource.findById(id);
        if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Delete from ImageKit if present
        if (doc.fileId) {
            try {
                await imagekit.deleteFile(doc.fileId);
            } catch (e: any) {
                console.warn('ImageKit delete failed (non-fatal):', e?.message || e);
            }
        }

        // Delete from YouTube if present (optional; you may prefer "unlist")
        if (doc.youtubeId) {
            try {
                const youtube = google.youtube({ version: 'v3', auth: getOAuth2Client() });
                await youtube.videos.delete({ id: doc.youtubeId });
            } catch (e: any) {
                console.warn('YouTube delete failed (non-fatal):', e?.response?.data || e?.message || e);
            }
        }

        await doc.deleteOne();

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('DELETE /resources/[id] error', err);
        return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
    }
}
