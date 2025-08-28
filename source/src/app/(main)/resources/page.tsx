/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Download, FileText, Video, Music, Search,
    Grid, List, Star, SortAsc, SortDesc, ImageIcon, LinkIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationPrevious, PaginationNext
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import ResourceCard from '@/components/resources/ResourceCard'

// Type definitions
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

interface ResourceFilter {
    type: 'all' | 'video' | 'audio' | 'pdf' | 'image' | 'link'
    category: 'all' | 'sermons' | 'studies' | 'events' | 'music' | 'other'
    search: string
    downloadable?: boolean
    featured?: boolean
}

// Type guards
const isVideoResource = (resource: Resource): resource is VideoResource => resource.type === 'video'
const isAudioResource = (resource: Resource): resource is AudioResource => resource.type === 'audio'
const isPDFResource = (resource: Resource): resource is PDFResource => resource.type === 'pdf'

// Dynamically import heavy viewers
const VideoPlayer = dynamic(() => import('@/components/resources/VideoPlayer'), {
    loading: () => <div>Loading video player...</div>
})
const PDFViewer = dynamic(() => import('@/components/resources/PDFViewer'), {
    loading: () => <div>Loading PDF viewer...</div>
})
const AudioPlayer = dynamic(() => import('@/components/resources/AudioPlayer'), {
    loading: () => <div>Loading audio player...</div>
})

const RESOURCE_TYPES = ['all', 'video', 'audio', 'pdf', 'image', 'link'] as const
const CATEGORIES = ['all', 'sermons', 'studies', 'events', 'music', 'other'] as const
const ITEMS_PER_PAGE = 12

// Helper function to get appropriate icon for resource type
const getResourceIcon = (type: string, size = 24) => {
    switch (type) {
        case 'video':
            return <Video size={size} className="text-red-500" />
        case 'audio':
            return <Music size={size} className="text-blue-500" />
        case 'pdf':
            return <FileText size={size} className="text-green-500" />
        case 'image':
            return <ImageIcon size={size} className="text-purple-500" />
        case 'link':
            return <LinkIcon size={size} className="text-orange-500" />
        default:
            return <FileText size={size} className="text-gray-500" />
    }
}

export default function EnhancedResourcesPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState<ResourceFilter>({
        type: 'all',
        category: 'all',
        search: '',
        downloadable: undefined,
        featured: undefined
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
    const [showDownloadableOnly, setShowDownloadableOnly] = useState(false)

    // Media state
    const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null)
    const [selectedPDF, setSelectedPDF] = useState<PDFResource | null>(null)
    const [selectedAudio, setSelectedAudio] = useState<AudioResource | null>(null)

    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true)
                setError(null)
                
                const res = await fetch('/api/resources')
                if (!res.ok) {
                    throw new Error(`Failed to fetch resources: ${res.status} ${res.statusText}`)
                }
                
                const data = await res.json()

                const transformed: Resource[] = data.map((item: any) => {
                    // For YouTube videos, use the thumbnail if available
                    const isYouTubeVideo = item.type === 'video' && item.id && item.id.length === 11
                    const thumbnail = isYouTubeVideo
                        ? (item.thumbnail || `https://img.youtube.com/vi/${item.id}/mqdefault.jpg`)
                        : item.thumbnail || null

                    const baseResource = {
                        id: item.id || Math.random().toString(36).substr(2, 9),
                        title: item.title || 'Untitled Resource',
                        description: item.description || '',
                        thumbnail: thumbnail,
                        thumbnailUrl: thumbnail,
                        date: item.date,
                        createdAt: item.date,
                        type: item.type,
                        downloadable: item.canDownload || false,
                        featured: item.featured || false,
                        category: item.category || 'other',
                        tags: item.tags || [],
                        views: item.views,
                        downloads: item.downloads,
                    }

                    // Add type-specific properties
                    switch (item.type) {
                        case 'video':
                            return {
                                ...baseResource,
                                type: 'video' as const,
                                videoUrl: item.previewUrl ? String(item.previewUrl) : undefined,
                                duration: item.duration,
                                youtubeId: item.id,
                                embedUrl: item.embedUrl || `https://www.youtube.com/embed/${item.id}`,
                            }
                        case 'audio':
                            return {
                                ...baseResource,
                                type: 'audio' as const,
                                audioUrl: item.previewUrl,
                                fileUrl: item.previewUrl,
                                downloadUrl: item.downloadUrl,
                                duration: item.duration,
                            }
                        case 'pdf':
                            return {
                                ...baseResource,
                                type: 'pdf' as const,
                                fileUrl: item.previewUrl,
                                downloadUrl: item.downloadUrl,
                            }
                        case 'image':
                            return {
                                ...baseResource,
                                type: 'image' as const,
                                imageUrl: item.previewUrl,
                                downloadUrl: item.downloadUrl,
                            }
                        case 'link':
                            return {
                                ...baseResource,
                                type: 'link' as const,
                                url: item.previewUrl,
                            }
                        default:
                            return baseResource as Resource
                    }
                })

                setResources(transformed)
            } catch (err) {
                console.error('Failed to fetch resources:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch resources')
            } finally {
                setLoading(false)
            }
        }
        
        fetchResources()
    }, [])

    // Filtering + sorting
    const filteredAndSortedResources = useMemo(() => {
        const filtered = resources.filter(r => {
            const matchesSearch =
                !searchTerm ||
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesType = filter.type === 'all' || r.type === filter.type
            const matchesCategory = filter.category === 'all' || r.category === filter.category
            const matchesDownloadable = !showDownloadableOnly || r.downloadable
            const matchesFeatured = !showFeaturedOnly || r.featured

            return matchesSearch && matchesType && matchesCategory && matchesDownloadable && matchesFeatured
        })

        filtered.sort((a, b) => {
            let aVal: any, bVal: any
            switch (sortBy) {
                case 'title':
                    aVal = a.title.toLowerCase()
                    bVal = b.title.toLowerCase()
                    break
                case 'type':
                    aVal = a.type
                    bVal = b.type
                    break
                default:
                    const getDateValue = (resource: Resource): number => {
                        const dateStr = resource.date || resource.createdAt
                        if (!dateStr) return 0

                        const date = new Date(dateStr)
                        return isNaN(date.getTime()) ? 0 : date.getTime()
                    }

                    aVal = getDateValue(a)
                    bVal = getDateValue(b)
                    break
            }
            return sortOrder === 'asc'
                ? aVal < bVal ? -1 : aVal > bVal ? 1 : 0
                : aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        })

        return filtered
    }, [resources, searchTerm, filter, showDownloadableOnly, showFeaturedOnly, sortBy, sortOrder])

    const totalPages = Math.ceil(filteredAndSortedResources.length / ITEMS_PER_PAGE)
    const paginatedResources = filteredAndSortedResources.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Interactions
    const handleResourcePlay = (resource: Resource) => {
        if (isVideoResource(resource)) {
            setSelectedVideo(resource)
        } else if (isAudioResource(resource)) {
            setSelectedAudio(resource)
        } else if (isPDFResource(resource)) {
            setSelectedPDF(resource)
        }
    }

    const handleResourceDownload = (resource: Resource) => {
        if (!resource.downloadable) return

        let url: string | undefined

        switch (resource.type) {
            case 'pdf':
                url = (resource as PDFResource).downloadUrl || (resource as PDFResource).fileUrl
                break
            case 'video':
                url = (resource as VideoResource).videoUrl
                break
            case 'audio':
                url = (resource as AudioResource).downloadUrl || 
                      (resource as AudioResource).audioUrl || 
                      (resource as AudioResource).fileUrl
                break
            case 'image':
                url = (resource as ImageResource).downloadUrl || (resource as ImageResource).imageUrl
                break
            case 'link':
                url = (resource as LinkResource).url
                break
        }

        if (!url) return

        const link = document.createElement('a')
        link.href = url
        link.download = resource.title
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Resources</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Hero */}
            <section className="relative h-[400px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/4048755/pexels-photo-4048755.jpeg"
                    alt="Resources"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center px-4">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Resources</h1>
                    <p className="text-xl md:text-2xl max-w-3xl mb-6">
                        Explore sermons, studies, music & more
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Badge className="bg-red-500"><Video className="h-4 w-4 mr-1" />Videos</Badge>
                        <Badge className="bg-blue-500"><Music className="h-4 w-4 mr-1" />Audio</Badge>
                        <Badge className="bg-green-500"><FileText className="h-4 w-4 mr-1" />Documents</Badge>
                    </div>
                </div>
            </section>

            {/* Main */}
            <section className="py-12">
                <div className="container-custom">
                    {/* Search + controls */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button 
                                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'default' : 'outline'} 
                                size="sm" 
                                onClick={() => setViewMode('list')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500">
                                {filteredAndSortedResources.length} results
                            </span>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                        <Select 
                            value={filter.type} 
                            onValueChange={(v) => setFilter(f => ({ ...f, type: v as any }))}
                        >
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                {RESOURCE_TYPES.map(t => (
                                    <SelectItem key={t} value={t}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select 
                            value={filter.category} 
                            onValueChange={(v) => setFilter(f => ({ ...f, category: v as any }))}
                        >
                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => (
                                    <SelectItem key={c} value={c}>
                                        {c.charAt(0).toUpperCase() + c.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                            <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? (
                                <><SortAsc className="h-4 w-4 mr-1" />Asc</>
                            ) : (
                                <><SortDesc className="h-4 w-4 mr-1" />Desc</>
                            )}
                        </Button>
                    </div>

                    {/* Featured/download toggles */}
                    <div className="flex gap-6 mb-8">
                        <div className="flex items-center space-x-2">
                            <Switch 
                                checked={showFeaturedOnly} 
                                onCheckedChange={setShowFeaturedOnly} 
                            />
                            <Label className="text-sm">
                                <Star className="h-3 w-3 mr-1 inline" />Featured
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                checked={showDownloadableOnly} 
                                onCheckedChange={setShowDownloadableOnly} 
                            />
                            <Label className="text-sm">
                                <Download className="h-3 w-3 mr-1 inline" />Downloadable
                            </Label>
                        </div>
                    </div>

                    {/* List/grid */}
                    {loading ? (
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : paginatedResources.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            No resources found
                        </div>
                    ) : (
                        <>
                            <div className={`grid gap-6 ${
                                viewMode === 'grid' 
                                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                    : 'grid-cols-1'
                            }`}>
                                {paginatedResources.map(r => (
                                    <ResourceCard
                                        key={r.id}
                                        resource={r}
                                        variant={viewMode}
                                        onPlay={handleResourcePlay}
                                        onDownload={handleResourceDownload}
                                        getResourceIcon={getResourceIcon}
                                    />
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <Pagination className="mt-12">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious 
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                            />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <span className="px-4">Page {currentPage}/{totalPages}</span>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext 
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Players/viewers */}
            {selectedVideo && (
                <VideoPlayer 
                    video={{ ...selectedVideo, videoUrl: selectedVideo.videoUrl ?? '' }} 
                    isOpen={!!selectedVideo} 
                    onClose={() => setSelectedVideo(null)} 
                />
            )}
            {selectedPDF && (
                <PDFViewer 
                    resource={{ ...selectedPDF, fileUrl: selectedPDF.fileUrl ?? '' }} 
                    isOpen={!!selectedPDF} 
                    onClose={() => setSelectedPDF(null)} 
                />
            )}
            {selectedAudio && (
                <AudioPlayer 
                    resource={{ ...selectedAudio, audioUrl: selectedAudio.audioUrl ?? '' }} 
                    isOpen={!!selectedAudio} 
                    onClose={() => setSelectedAudio(null)} 
                />
            )}
        </>
    )
}