"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Clock, Eye, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

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

interface VideoCardProps {
    video: YouTubeVideo
    showDescription?: boolean
    className?: string
}

export default function VideoCard({
    video,
    showDescription = true,
    className = ""
}: VideoCardProps) {
    const [imageError, setImageError] = useState(false)

    return (
        <Card className={`overflow-hidden group hover:shadow-lg transition-shadow duration-300 ${className}`}>
            <div className="relative aspect-video">
                {!imageError && video.thumbnailUrl ? (
                    <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={() => setImageError(true)}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <Play className="h-12 w-12 text-gray-400" />
                    </div>
                )}

                {/* Overlay with play button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <div className="bg-white/90 rounded-full p-3 shadow-lg">
                            <Play className="h-6 w-6 text-gray-800" />
                        </div>
                    </div>
                </div>

                {/* Duration badge */}
                {video.duration && (
                    <Badge
                        variant="secondary"
                        className="absolute bottom-2 right-2 text-xs bg-black/70 text-white border-none"
                    >
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duration}
                    </Badge>
                )}
            </div>

            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Title */}
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-church-primary transition-colors duration-300">
                        {video.title}
                    </h3>

                    {/* Description */}
                    {showDescription && video.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {video.description}
                        </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-3">
                            <span>{video.publishedAt}</span>
                            {video.viewCount && (
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {video.viewCount}
                                </span>
                            )}
                        </div>
                        {video.channelTitle && (
                            <span className="text-xs font-medium">
                                {video.channelTitle}
                            </span>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button asChild className="flex-1" size="sm">
                            <Link
                                href={video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Watch
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                            <Link
                                href={video.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}