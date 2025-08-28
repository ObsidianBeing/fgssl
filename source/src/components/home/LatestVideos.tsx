/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import VideoCard from './VideoCard'
import { Youtube, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Type definition for YouTube video
interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnailUrl: string
  duration: string
  channelTitle: string
  publishedAt: string
  viewCount: string
  videoUrl: string
  embedUrl: string
}

export const revalidate = Number(process.env.YOUTUBE_CACHE_DURATION) || 1800 // 30 minutes

async function fetchVideos(): Promise<{ videos: YouTubeVideo[], error?: string }> {
  try {
    // Handle both development and production environments
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || ''

    // Validate the base URL
    if (!baseUrl) {
      console.warn('Base URL is not configured, using relative URL')
      // Fall back to relative URL for API calls
    }

    const apiUrl = baseUrl ? `${baseUrl}/api/youtube` : '/api/youtube'

    const res = await fetch(apiUrl, {
      next: { revalidate: Number(process.env.YOUTUBE_CACHE_DURATION) || 1800 },
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error')
      console.error(`Failed to fetch videos: ${res.status} ${res.statusText}`, errorText)

      return {
        videos: [],
        error: `API Error: ${res.status} ${res.statusText}`
      }
    }

    const data = await res.json()

    // Validate the response structure
    if (!Array.isArray(data)) {
      console.error('Invalid API response: expected array, got:', typeof data)
      return {
        videos: [],
        error: 'Invalid API response format'
      }
    }

    // Validate each video object
    const validVideos = data.filter((video: any) => {
      return video &&
        typeof video.id === 'string' &&
        typeof video.title === 'string' &&
        video.id.length > 0 &&
        video.title.length > 0
    })

    if (validVideos.length === 0 && data.length > 0) {
      console.warn('No valid videos found in API response')
      return {
        videos: [],
        error: 'No valid videos in API response'
      }
    }

    return { videos: validVideos }
  } catch (error) {
    console.error('Fetch error in LatestVideos:', error)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { videos: [], error: 'Request timeout - please try again' }
      }
      return { videos: [], error: error.message }
    }

    return { videos: [], error: 'Unknown error occurred' }
  }
}

export default async function LatestVideos() {
  const { videos, error } = await fetchVideos()

  // Error state
  if (error && videos.length === 0) {
    return (
      <section className="py-16">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
            <h2 className="section-title mb-4 sm:mb-0">Latest Videos</h2>
            <div className="flex gap-4">
              <Button asChild variant="outline" className="border-church-primary text-church-primary">
                <Link href="/resources">View All Resources</Link>
              </Button>
              <Button asChild variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20">
                <Link
                  href={process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || 'https://youtube.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  YouTube Channel
                </Link>
              </Button>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {process.env.NODE_ENV === 'development'
                ? `Development mode: ${error}`
                : `Unable to load latest videos: ${error}`}
            </AlertDescription>
          </Alert>
        </div>
      </section>
    )
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <section className="py-16">
        <div className="container-custom text-center">
          <h2 className="section-title mb-6">Latest Videos</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <Youtube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No videos available yet. Check back later!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline" className="border-church-primary text-church-primary">
                <Link href="/resources">Browse Resources</Link>
              </Button>
              <Button asChild variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20">
                <Link
                  href={process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || 'https://youtube.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Visit YouTube
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Success state with videos
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <h2 className="section-title mb-4 sm:mb-0">Latest Videos</h2>
          <div className="flex gap-4">
            <Button asChild variant="outline" className="border-church-primary text-church-primary">
              <Link href="/resources">View All Videos</Link>
            </Button>
            <Button asChild variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20">
              <Link
                href={process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="mr-2 h-4 w-4" />
                YouTube Channel
              </Link>
            </Button>
          </div>
        </div>

        {/* Show error alert if there was an error but we still have some videos */}
        {error && videos.length > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some videos may not be displayed due to: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Video grid - responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.slice(0, 6).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Show "Load More" if there are more than 6 videos */}
        {videos.length > 6 && (
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/resources?type=video">
                View All {videos.length} Videos
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}