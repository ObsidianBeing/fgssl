/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import type { YouTubeVideo } from '@/types/youtube'

// Cache responses for 1 hour to reduce API calls
export const revalidate = 3600

// In-memory cache to store responses between serverless function executions
let cache: {
    data: YouTubeVideo[] | null
    timestamp: number
} = {
    data: null,
    timestamp: 0
}

const CACHE_DURATION = 3600 * 1000 // 1 hour in milliseconds

export async function GET() {
    const apiKey = process.env.YOUTUBE_API_KEY
    const channelId = process.env.YOUTUBE_CHANNEL_ID

    if (!apiKey || !channelId) {
        return NextResponse.json(
            { error: 'YouTube API not configured' },
            { status: 500 }
        )
    }

    // Check cache first
    const now = Date.now()
    if (cache.data && now - cache.timestamp < CACHE_DURATION) {
        return NextResponse.json(cache.data)
    }

    try {
        // 1. Get the uploads playlist ID from channel (with retry logic)
        const channelRes = await fetchWithRetry(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
        )

        if (!channelRes.ok) throw new Error('Failed to fetch channel data')
        const channelData = await channelRes.json()

        if (!channelData.items || channelData.items.length === 0) {
            throw new Error('Channel not found or has no content')
        }

        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

        // 2. Get latest videos from uploads playlist (configurable count)
        const maxResults = process.env.YOUTUBE_MAX_RESULTS || '3'
        const videosRes = await fetchWithRetry(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${uploadsPlaylistId}&key=${apiKey}`
        )

        if (!videosRes.ok) throw new Error('Failed to fetch videos')
        const videosData = await videosRes.json()

        // 3. Get video details (including duration) in batch
        const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')
        const detailsRes = await fetchWithRetry(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
        )

        if (!detailsRes.ok) throw new Error('Failed to fetch video details')
        const detailsData = await detailsRes.json()

        // 4. Format all data
        const videos: YouTubeVideo[] = detailsData.items.map((item: any) => {
            const duration = formatDuration(item.contentDetails.duration)

            return {
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnailUrl: getBestThumbnail(item.snippet.thumbnails),
                duration,
                channelTitle: item.snippet.channelTitle,
                publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                viewCount: parseInt(item.statistics.viewCount).toLocaleString(),
                videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
                embedUrl: `https://www.youtube.com/embed/${item.id}?autoplay=1`,
            }
        })

        // Update cache
        cache = {
            data: videos,
            timestamp: now
        }

        return NextResponse.json(videos)
    } catch (error) {
        console.error('YouTube API error:', error)

        // Return cached data if available even if there's an error
        if (cache.data) {
            return NextResponse.json(cache.data)
        }

        return NextResponse.json(
            { error: 'Failed to fetch YouTube videos' },
            { status: 500 }
        )
    }
}

// Helper to get the best thumbnail URL
function getBestThumbnail(thumbnails: any): string {
    return thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        '/default-video-thumbnail.jpg'
}

// Helper to format ISO 8601 duration (PT15M33S → 15:33)
function formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return '0:00'

    const hours = (parseInt(match[1]) || 0)
    const minutes = (parseInt(match[2]) || 0)
    const seconds = (parseInt(match[3]) || 0)

    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Retry mechanism for API calls
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url)
            if (response.status === 429) {
                // Rate limited - wait with exponential backoff
                const waitTime = Math.pow(2, i) * 1000
                console.log(`Rate limited. Waiting ${waitTime}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
                continue
            }
            return response
        } catch (error) {
            if (i === retries - 1) throw error
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
    }
    throw new Error('Failed after retries')
}