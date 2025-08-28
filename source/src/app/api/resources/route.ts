/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'

// Environment variables with validation
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY

// Cache for API responses (in-memory, resets on serverless restart)
let cache: {
    data: any[] | null
    timestamp: number
} = {
    data: null,
    timestamp: 0
}

const CACHE_DURATION = 1800 * 1000 // 30 minutes in milliseconds

const fetchAllPlaylistItems = async (): Promise<any[]> => {
    if (!YOUTUBE_API_KEY || !PLAYLIST_ID) {
        console.warn('YouTube API not configured')
        return []
    }

    let nextPageToken = ''
    const items: any[] = []
    let attempts = 0
    const maxAttempts = 10 // Prevent infinite loops

    try {
        do {
            attempts++
            if (attempts > maxAttempts) {
                console.warn('Maximum attempts reached for YouTube playlist fetch')
                break
            }

            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}&pageToken=${nextPageToken}`

            const res = await fetch(url, {
                signal: AbortSignal.timeout(10000) // 10 second timeout
            })

            if (!res.ok) {
                console.error(`YouTube API error: ${res.status} ${res.statusText}`)
                break
            }

            const data = await res.json()

            if (data.error) {
                console.error('YouTube API error in response:', data.error)
                break
            }

            if (data?.items?.length) {
                items.push(...data.items)
            }

            nextPageToken = data.nextPageToken || ''
        } while (nextPageToken && attempts < maxAttempts)

        return items
    } catch (error) {
        console.error('Failed to fetch YouTube playlist items:', error)
        return []
    }
}

const extractDuration = (iso: string): string => {
    if (!iso) return '0:00'

    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    const match = iso.match(regex)
    if (!match) return '0:00'

    const hours = parseInt(match[1]) || 0
    const minutes = parseInt(match[2]) || 0
    const seconds = parseInt(match[3]) || 0

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const fetchImageKitResources = async (): Promise<any[]> => {
    if (!IMAGEKIT_PRIVATE_KEY) {
        console.warn('ImageKit API not configured')
        return []
    }

    try {
        const res = await fetch(`https://api.imagekit.io/v1/files?fileType=all&limit=100`, {
            headers: {
                'Authorization': `Basic ${Buffer.from(IMAGEKIT_PRIVATE_KEY + ':').toString('base64')}`
            },
            signal: AbortSignal.timeout(10000) // 10 second timeout
        })

        if (!res.ok) {
            console.error(`ImageKit API error: ${res.status} ${res.statusText}`)
            return []
        }

        const files = await res.json()

        if (!Array.isArray(files)) {
            console.error('ImageKit API returned invalid response')
            return []
        }

        return files.map((file: any) => {
            if (!file.name || !file.fileId) return null

            const ext = file.name.split('.').pop()?.toLowerCase() || ''
            let type: string | null = null
            let category = 'other'

            // Determine type based on extension
            if (['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) {
                type = 'audio'
                category = 'music'
            } else if (ext === 'pdf') {
                type = 'pdf'
                category = 'studies'
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                type = 'image'
                category = 'events'
            }

            if (!type) return null

            return {
                id: file.fileId,
                title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                description: `${type.toUpperCase()} file`,
                type,
                category,
                thumbnail: file.thumbnailUrl || null,
                thumbnailUrl: file.thumbnailUrl || null,
                previewUrl: file.url,
                downloadUrl: file.url,
                canDownload: true,
                downloadable: true,
                featured: false,
                date: file.createdAt ? new Date(file.createdAt).toISOString() : new Date().toISOString(),
                tags: [type, category],
            }
        }).filter(Boolean)
    } catch (error) {
        console.error('ImageKit fetch failed:', error)
        return []
    }
}

export async function GET() {
    try {
        // Check cache first
        const now = Date.now()
        if (cache.data && now - cache.timestamp < CACHE_DURATION) {
            console.log('Serving resources from cache')
            return NextResponse.json(cache.data)
        }

        console.log('Fetching fresh resources data')

        // Fetch YouTube playlist items
        const playlistItems = await fetchAllPlaylistItems()

        // Transform YouTube videos
        const videos = playlistItems
            .filter((item: any) => item.snippet?.resourceId?.videoId)
            .map((item: any) => ({
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title || 'Untitled Video',
                description: item.snippet.description || '',
                thumbnail: item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url ||
                    item.snippet.thumbnails?.default?.url || '',
                thumbnailUrl: item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url ||
                    item.snippet.thumbnails?.default?.url || '',
                date: item.snippet.publishedAt,
                previewUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                embedUrl: `https://www.youtube.com/embed/${item.snippet.resourceId.videoId}`,
                type: 'video',
                category: 'sermons',
                canDownload: false,
                downloadable: false,
                featured: false,
                tags: ['video', 'sermon', 'youtube'],
            }))

        // Fetch video durations in batches
        const videoIds = videos.map((v) => v.id).filter(Boolean)
        const durations: Record<string, string> = {}

        if (videoIds.length > 0 && YOUTUBE_API_KEY) {
            const chunks = Array.from(
                { length: Math.ceil(videoIds.length / 50) },
                (_, i) => videoIds.slice(i * 50, i * 50 + 50)
            )

            for (const chunk of chunks) {
                try {
                    const metaRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`,
                        { signal: AbortSignal.timeout(10000) }
                    )

                    if (metaRes.ok) {
                        const metaData = await metaRes.json()
                        if (metaData.items) {
                            metaData.items.forEach((item: any) => {
                                if (item.contentDetails?.duration) {
                                    durations[item.id] = extractDuration(item.contentDetails.duration)
                                }
                            })
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch video duration for chunk:', error)
                }
            }
        }

        // Add durations to videos
        const enrichedVideos = videos.map((video) => ({
            ...video,
            duration: durations[video.id] || '0:00',
        }))

        // Fetch media resources from ImageKit
        const mediaResources = await fetchImageKitResources()

        // Combine all resources
        const allResources = [...enrichedVideos, ...mediaResources]

        // Update cache
        cache = {
            data: allResources,
            timestamp: now
        }

        console.log(`Returning ${allResources.length} resources (${enrichedVideos.length} videos, ${mediaResources.length} media files)`)

        return NextResponse.json(allResources)
    } catch (error) {
        console.error('Resources API error:', error)

        // Return cached data if available
        if (cache.data) {
            console.log('Returning cached data due to error')
            return NextResponse.json(cache.data)
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch resources',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}