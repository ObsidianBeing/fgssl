export type ResourceType = "pdf" | "video" | "audio" | "link" | "image";

// Add filter types to match your client-side usage
export type ResourceFilterType = "all" | "pdf" | "video" | "audio";
export type ResourceCategory = "all" | "sermons" | "studies" | "events" | "music" | "other";

export interface ResourceFilter {
    type: ResourceFilterType;
    category: ResourceCategory;
    search: string;
    downloadable?: boolean;
    featured?: boolean;
    downloadUrl?: string;
}

export interface BaseResource {
    id: string; // MongoDB ObjectId as string
    title: string;
    description?: string;
    type: ResourceType;

    // common optional presentation/UX fields
    thumbnailUrl?: string;    // preview image when present
    thumbnail?: string;       // alias for thumbnailUrl (client-side compatibility)
    category?: string;
    tags?: string[];
    featured?: boolean;

    // counters
    views?: number;
    downloads?: number;

    // whether the resource can be downloaded
    downloadable?: boolean;

    // ISO strings (from mongoose timestamps)
    createdAt?: string;
    updatedAt?: string;
    date?: string;           // alias for createdAt (client-side compatibility)
}

/** PDF */
export interface PDFResource extends BaseResource {
    type: "pdf";
    fileUrl: string;          // direct file url (ImageKit/S3)
    fileSize?: number;
    downloadUrl?: string;     // if different from fileUrl
}

/** Video */
export interface VideoResource extends BaseResource {
    type: "video";
    videoUrl?: string;         // e.g., YouTube watch url or CDN
    duration?: string;        // "12:34" or "01:05:49"
    youtubeId?: string;       // optional for external link
    embedUrl?: string;
}

/** Audio */
export interface AudioResource extends BaseResource {
    type: "audio";
    audioUrl: string;         // mp3/aac url
    fileUrl?: string;         // alias for audioUrl (client-side compatibility)
    fileSize?: number;
    duration?: string;        // "12:34"
    downloadUrl?: string;
}

/** Image */
export interface ImageResource extends BaseResource {
    type: "image";
    imageUrl: string;
    width?: number;
    height?: number;
    downloadUrl?: string;
}

export interface LinkResource extends BaseResource {
    type: "link"
    url: string
}

export type Resource =
    | PDFResource
    | VideoResource
    | AudioResource
    | ImageResource
    | LinkResource;

// Add type guards for better type narrowing
export function isVideoResource(resource: Resource): resource is VideoResource {
    return resource.type === 'video';
}

export function isPDFResource(resource: Resource): resource is PDFResource {
    return resource.type === 'pdf';
}

export function isAudioResource(resource: Resource): resource is AudioResource {
    return resource.type === 'audio';
}

export function isImageResource(resource: Resource): resource is ImageResource {
    return resource.type === 'image';
}

export function isLinkResource(resource: Resource): resource is LinkResource {
    return resource.type === 'link';
}

// Add utility type for ResourceCard props
export interface ResourceCardProps {
    resource: Resource;
    variant?: 'grid' | 'list';
    onPlay?: (resource: Resource) => void;
    onDownload?: (resource: Resource) => void;
}

// Add utility type for media viewer props
export interface MediaViewerProps {
    resource: Resource;
    isOpen: boolean;
    onClose: () => void;
}