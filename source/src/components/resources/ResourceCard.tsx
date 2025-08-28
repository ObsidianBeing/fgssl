/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useRef, useEffect, JSX } from "react"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  ExternalLink,
  Play,
  Pause,
  FileText,
  Video,
  Music,
  Eye,
  Clock,
  Calendar,
  Star
} from "lucide-react"
import Image from "next/image"

// Type definitions to match the resources page
interface BaseResource {
  id: string
  title: string
  description?: string
  thumbnail?: string
  thumbnailUrl?: string
  date?: string
  createdAt?: string
  type: 'video' | 'audio' | 'pdf' | 'image' | 'link'
  downloadable: boolean
  featured: boolean
  category: string
  tags?: string[]
  views?: number
  downloads?: number
}

interface VideoResource extends BaseResource {
  type: 'video'
  videoUrl?: string
  duration?: string
  youtubeId?: string
  embedUrl?: string
}

interface AudioResource extends BaseResource {
  type: 'audio'
  audioUrl?: string
  fileUrl?: string
  downloadUrl?: string
  duration?: string
}

interface PDFResource extends BaseResource {
  type: 'pdf'
  fileUrl?: string
  downloadUrl?: string
}

interface ImageResource extends BaseResource {
  type: 'image'
  imageUrl?: string
  downloadUrl?: string
}

interface LinkResource extends BaseResource {
  type: 'link'
  url?: string
}

type Resource = VideoResource | AudioResource | PDFResource | ImageResource | LinkResource

interface ResourceCardProps {
  resource: Resource
  onPreview?: (resource: Resource) => void
  onDownload?: (resource: Resource) => void
  onPlay: (resource: Resource) => void
  showStats?: boolean
  variant: "grid" | "list"
  getResourceIcon: (type: string, size?: number) => JSX.Element
}

export default function ResourceCard({
  resource,
  onPreview,
  onDownload,
  onPlay,
  showStats = false,
  variant = "grid",
  getResourceIcon
}: ResourceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [imageError, setImageError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Sync audio events with state
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  // Get thumbnail URL
  const thumbnailUrl = resource.thumbnailUrl ||
    resource.thumbnail ||
    (resource.type === "video" && (resource as VideoResource).youtubeId
      ? `https://img.youtube.com/vi/${(resource as VideoResource).youtubeId}/hqdefault.jpg`
      : null)

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return null
    }
  }

  // Handle primary action (play/preview)
  const handlePrimaryAction = () => {
    if (resource.type === 'audio' && audioRef.current) {
      handlePlayPause()
    } else {
      onPlay(resource)
    }
  }

  // Handle download
  const handleDownload = () => {
    if (onDownload) {
      onDownload(resource)
      return
    }

    if (!resource.downloadable) return

    let downloadUrl = ""
    switch (resource.type) {
      case "pdf":
        downloadUrl = (resource as PDFResource).downloadUrl || (resource as PDFResource).fileUrl || ""
        break
      case "audio":
        const audioRes = resource as AudioResource
        downloadUrl = audioRes.downloadUrl || audioRes.audioUrl || audioRes.fileUrl || ""
        break
      case "video":
        downloadUrl = (resource as VideoResource).videoUrl ||
          `https://youtu.be/${(resource as VideoResource).youtubeId}` || ""
        break
      case "image":
        downloadUrl = (resource as ImageResource).downloadUrl || (resource as ImageResource).imageUrl || ""
        break
      case "link":
        downloadUrl = (resource as LinkResource).url || ""
        break
    }

    if (downloadUrl) {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = resource.title
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle play/pause for audio
  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(console.error)
    }
  }

  // Get audio URL
  const getAudioUrl = () => {
    if (resource.type !== 'audio') return ""
    const audioRes = resource as AudioResource
    return audioRes.audioUrl || audioRes.fileUrl || ""
  }

  const cardContent = (
    <>
      {/* Thumbnail / Icon */}
      <CardHeader className={`relative p-0 ${variant === 'list' ? 'w-32 h-24' : 'h-40'}`}>
        {thumbnailUrl && !imageError ? (
          <div className="relative w-full h-full overflow-hidden rounded-t-lg">
            <Image
              src={thumbnailUrl}
              alt={resource.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes={variant === 'list' ? '128px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
            />
            {/* Overlay badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {resource.featured && (
                <Badge variant="secondary" className="text-xs bg-yellow-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </div>
            {/* Duration badge for videos/audio */}
            {(resource.type === 'video' || resource.type === 'audio') &&
              ((resource as VideoResource).duration || (resource as AudioResource).duration) && (
                <Badge variant="secondary" className="absolute bottom-2 right-2 text-xs bg-black/70 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {(resource as VideoResource).duration || (resource as AudioResource).duration}
                </Badge>
              )}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-t-lg">
            {getResourceIcon(resource.type, 32)}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {resource.title}
          </h3>
          <Badge variant="outline" className="ml-2 text-xs shrink-0">
            {resource.type}
          </Badge>
        </div>

        {resource.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {resource.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          {formatDate(resource.date || resource.createdAt) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(resource.date || resource.createdAt)}
            </span>
          )}
          {resource.category && resource.category !== 'other' && (
            <Badge variant="secondary" className="text-xs">
              {resource.category}
            </Badge>
          )}
        </div>

        {/* Audio player for audio resources */}
        {resource.type === "audio" && getAudioUrl() && (
          <div className="mb-3">
            <audio
              ref={audioRef}
              preload="metadata"
              className="w-full h-8"
              controls
            >
              <source src={getAudioUrl()} type="audio/mpeg" />
              <source src={getAudioUrl()} type="audio/wav" />
              <source src={getAudioUrl()} type="audio/ogg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="flex gap-4 text-xs text-gray-500">
            {resource.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {resource.views.toLocaleString()}
              </span>
            )}
            {resource.downloads !== undefined && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {resource.downloads.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex justify-between gap-2 p-4 pt-0">
        {/* Primary action button */}
        <Button
          size="sm"
          onClick={handlePrimaryAction}
          className="flex-1"
          aria-label={
            resource.type === 'audio'
              ? (isPlaying ? "Pause audio" : "Play audio")
              : `Open ${resource.type}`
          }
        >
          {resource.type === 'audio' ? (
            isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />
          ) : resource.type === 'video' ? (
            <Play className="h-4 w-4 mr-2" />
          ) : resource.type === 'link' ? (
            <ExternalLink className="h-4 w-4 mr-2" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          {resource.type === 'audio'
            ? (isPlaying ? 'Pause' : 'Play')
            : resource.type === 'video'
              ? 'Watch'
              : resource.type === 'link'
                ? 'Visit'
                : 'View'
          }
        </Button>

        {/* Download button */}
        {resource.downloadable && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            aria-label="Download resource"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}

        {/* Preview button for certain types */}
        {onPreview && (resource.type === 'pdf' || resource.type === 'image') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPreview(resource)}
            aria-label="Preview resource"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </>
  )

  // Render different layouts based on variant
  if (variant === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          {/* Thumbnail / Icon */}
          <div className="relative w-32 h-24 shrink-0">
            {thumbnailUrl && !imageError ? (
              <div className="relative w-full h-full overflow-hidden">
                <Image
                  src={thumbnailUrl}
                  alt={resource.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gray-100">
                {getResourceIcon(resource.type, 24)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col">
            <CardContent className="flex-1 p-4 pb-2">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-base line-clamp-1 flex-1">
                  {resource.title}
                </h3>
                <div className="flex items-center gap-2 ml-2">
                  {resource.featured && (
                    <Star className="h-4 w-4 text-yellow-500" />
                  )}
                  <Badge variant="outline" className="text-xs">
                    {resource.type}
                  </Badge>
                </div>
              </div>

              {resource.description && (
                <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                  {resource.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                {formatDate(resource.date || resource.createdAt) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(resource.date || resource.createdAt)}
                  </span>
                )}
                {((resource.type === 'video' && (resource as VideoResource).duration) ||
                  (resource.type === 'audio' && (resource as AudioResource).duration)) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(resource as VideoResource).duration || (resource as AudioResource).duration}
                    </span>
                  )}
              </div>
            </CardContent>

            {/* Actions */}
            <CardFooter className="p-4 pt-0">
              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  onClick={handlePrimaryAction}
                  className="flex-1"
                >
                  {resource.type === 'audio' ? (
                    isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />
                  ) : resource.type === 'video' ? (
                    <Play className="h-4 w-4 mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  {resource.type === 'audio'
                    ? (isPlaying ? 'Pause' : 'Play')
                    : resource.type === 'video'
                      ? 'Watch'
                      : 'View'
                  }
                </Button>

                {resource.downloadable && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </div>
        </div>
      </Card>
    )
  }

  // Grid layout (default)
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {cardContent}
    </Card>
  )
}