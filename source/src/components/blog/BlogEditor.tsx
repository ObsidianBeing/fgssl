/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Toolbar } from './Toolbar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// third-party libs assumed available
import ReactMarkdown from 'react-markdown'

interface BlogEditorDefaultValues {
    title?: string
    excerpt?: string
    content?: string
    featuredImage?: string
    status?: 'draft' | 'published' | 'scheduled' | string
    publishDate?: string | Date
    metaTitle?: string
    metaDescription?: string
    tags?: string[]
    categories?: string[]
}

interface BlogEditorProps {
    action: (formData: FormData) => Promise<void>
    defaultValues: BlogEditorDefaultValues
    autosaveIntervalMs?: number // how often to autosave to server/local
    onSubmit: (formData: FormData) => Promise<void>
}

const EXCERPT_LIMIT = 300
const META_DESC_LIMIT = 160

export default function BlogEditor({ action, defaultValues, autosaveIntervalMs = 60000 }: BlogEditorProps) {
    const [featuredImageUrl, setFeaturedImageUrl] = useState<string>(defaultValues.featuredImage || '')
    const [content, setContent] = useState<string>(defaultValues.content || '')
    const [date, setDate] = useState<Date>(new Date(defaultValues.publishDate ? new Date(defaultValues.publishDate) : Date.now()))
    const [previewMode, setPreviewMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
    const [imagekitInstance, setImagekitInstance] = useState<any>(null)
    const [imagekitReady, setImagekitReady] = useState(false)

    const [title, setTitle] = useState(defaultValues.title || '')
    const [excerpt, setExcerpt] = useState(defaultValues.excerpt || '')
    const [status, setStatus] = useState<string>(defaultValues.status || 'draft')
    const [metaTitle, setMetaTitle] = useState(defaultValues.metaTitle || '')
    const [metaDescription, setMetaDescription] = useState(defaultValues.metaDescription || '')
    const [tags, setTags] = useState<string[]>(defaultValues.tags || [])
    const [categories, setCategories] = useState<string[]>(defaultValues.categories || [])
    const [tagInput, setTagInput] = useState('')
    const [categoryInput, setCategoryInput] = useState('')

    // inline validation state
    const [errors, setErrors] = useState<Record<string, string>>({})

    // localStorage autosave key (per draft)
    const autosaveKey = useMemo(() => {
        // attempt to use slug-like title, fallback to generic
        const safeTitle = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled'
        return `blog-draft:${safeTitle}`
    }, [title])

    // Initialize ImageKit on client side only
    useEffect(() => {
        if (typeof window === 'undefined') return

        const initImageKit = async () => {
            try {
                // Check for required environment variables
                const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
                const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

                if (!publicKey || !urlEndpoint) {
                    console.warn('ImageKit environment variables not found. Image upload will be disabled.')
                    return
                }

                // Dynamic import to prevent SSR issues
                const { default: Upload } = await import('imagekit-javascript')

                const imagekit = new Upload({
                    publicKey,
                    urlEndpoint,
                })

                setImagekitInstance(imagekit)
                setImagekitReady(true)
            } catch (error) {
                console.error('Failed to initialize ImageKit:', error)
            }
        }

        initImageKit()
    }, [])

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension.configure({ inline: true }),
            Placeholder.configure({ placeholder: 'Start writing your story...' }),
        ],
        content: defaultValues.content || '',
        onUpdate: ({ editor }) => setContent(editor.getHTML()),
    })

    // upload helper using ImageKit auth endpoint
    const uploadImage = async (file: File): Promise<string> => {
        if (!imagekitInstance || !imagekitReady) {
            throw new Error('ImageKit not initialized. Please check your environment variables.')
        }

        try {
            // Fetch authentication parameters from your backend
            const authRes = await fetch('/api/imagekit-auth')
            if (!authRes.ok) throw new Error('Failed to get image auth')
            const { signature, token, expire } = await authRes.json()

            const res = await imagekitInstance.upload({
                file,
                fileName: file.name,
                folder: '/blog-images',
                signature,
                token,
                expire,
            })
            return res.url
        } catch (error) {
            console.error('Upload failed:', error)
            throw error
        }
    }

    const addImageToContent = () => {
        if (!imagekitReady) {
            alert('Image upload is not available. Please check your configuration.')
            return
        }

        const fileChoice = window.prompt('Image URL or type `file` to upload from device?')
        if (fileChoice === 'file') {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]
                if (f && editor) {
                    try {
                        const url = await uploadImage(f)
                        editor.chain().focus().setImage({ src: url }).run()
                    } catch (err) {
                        console.error('Upload failed', err)
                        alert('Image upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                    }
                }
            }
            input.click()
        } else if (fileChoice && editor) {
            editor.chain().focus().setImage({ src: fileChoice }).run()
        }
    }

    const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!imagekitReady) {
            alert('Image upload is not available. Please check your configuration.')
            return
        }

        const f = e.target.files?.[0]
        if (f) {
            try {
                const url = await uploadImage(f)
                setFeaturedImageUrl(url)
            } catch (err) {
                console.error('Featured upload failed', err)
                alert('Featured image upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
            }
        }
    }

    // --- Inline validation ---
    const validate = () => {
        const errs: Record<string, string> = {}
        if (!title || title.trim().length < 3) errs.title = 'Title must be at least 3 characters.'
        if (!content || content.trim().length < 20) errs.content = 'Content too short.'
        if (excerpt && excerpt.length > EXCERPT_LIMIT) errs.excerpt = `Excerpt must be <= ${EXCERPT_LIMIT} characters.`
        if (metaDescription && metaDescription.length > META_DESC_LIMIT) errs.metaDescription = `Meta description must be <= ${META_DESC_LIMIT} characters.`
        if (status === 'scheduled' && date <= new Date()) errs.publishDate = 'Scheduled publish date must be in the future.'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    // --- Tags & categories helpers ---
    const addTag = (t: string) => {
        const clean = t.trim()
        if (!clean) return
        if (!tags.includes(clean)) setTags((s) => [...s, clean])
        setTagInput('')
    }
    const removeTag = (t: string) => setTags((s) => s.filter((x) => x !== t))

    const addCategory = (c: string) => {
        const clean = c.trim()
        if (!clean) return
        if (!categories.includes(clean)) setCategories((s) => [...s, clean])
        setCategoryInput('')
    }
    const removeCategory = (c: string) => setCategories((s) => s.filter((x) => x !== c))

    // --- Autosave (localStorage) ---
    useEffect(() => {
        if (typeof window === 'undefined') return

        // load from autosave when key changes
        const raw = localStorage.getItem(autosaveKey)
        if (raw) {
            try {
                const parsed = JSON.parse(raw)
                // don't overwrite intentionally set fields if empty
                if (!title && parsed.title) setTitle(parsed.title)
                if (!content && parsed.content) {
                    editor?.commands.setContent(parsed.content)
                    setContent(parsed.content)
                }
                if (!excerpt && parsed.excerpt) setExcerpt(parsed.excerpt)
                if (!featuredImageUrl && parsed.featuredImage) setFeaturedImageUrl(parsed.featuredImage)
                if (!metaTitle && parsed.metaTitle) setMetaTitle(parsed.metaTitle)
                if (!metaDescription && parsed.metaDescription) setMetaDescription(parsed.metaDescription)
                if (!tags.length && parsed.tags) setTags(parsed.tags)
                if (!categories.length && parsed.categories) setCategories(parsed.categories)
            } catch (e) {
                console.warn('Failed to parse autosave', e)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autosaveKey])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const id = setInterval(() => {
            // client-side autosave to localStorage
            const payload = {
                title,
                content,
                excerpt,
                featuredImage: featuredImageUrl,
                metaTitle,
                metaDescription,
                tags,
                categories,
                status,
                publishDate: date.toISOString(),
                savedAt: new Date().toISOString(),
            }
            try {
                localStorage.setItem(autosaveKey, JSON.stringify(payload))
                setLastSavedAt(new Date())
            } catch (e) {
                console.warn('Autosave failed', e)
            }
        }, autosaveIntervalMs)
        return () => clearInterval(id)
    }, [autosaveIntervalMs, autosaveKey, title, content, excerpt, featuredImageUrl, metaTitle, metaDescription, tags, categories, status, date])

    // manual save to server (draft) - optional convenience
    const serverSaveDraft = async () => {
        try {
            setSaving(true)
            // Basic validation before server save
            const ok = validate()
            if (!ok) {
                setSaving(false)
                return false
            }

            // Build a FormData and call the server action if available; we attempt to call action as a draft save
            const form = new FormData()
            form.set('title', title)
            form.set('content', content)
            form.set('excerpt', excerpt)
            form.set('featuredImage', featuredImageUrl)
            form.set('status', status)
            form.set('publishDate', date.toISOString())
            tags.forEach((t) => form.append('tags', t))
            categories.forEach((c) => form.append('categories', c))
            form.set('metaTitle', metaTitle)
            form.set('metaDescription', metaDescription)
            try {
                // If the server action supports an "autosave" or draft mode, it will handle idempotency
                // We still call it, but it's fine if it throws — user still has local autosave.
                await action(form)
                setLastSavedAt(new Date())
            } catch (err) {
                // ignore server errors for autosave, keep local copy
                console.warn('Server autosave failed', err)
            }
            setSaving(false)
            return true
        } catch (err) {
            console.error(err)
            setSaving(false)
            return false
        }
    }

    // user-triggered manual save (submit)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const ok = validate()
        if (!ok) return

        const form = new FormData(e.currentTarget as HTMLFormElement)
        // ensure fields are present
        form.set('title', title)
        form.set('content', content)
        form.set('excerpt', excerpt)
        form.set('featuredImage', featuredImageUrl)
        form.set('status', status)
        form.set('publishDate', date.toISOString())
        tags.forEach((t) => form.append('tags', t))
        categories.forEach((c) => form.append('categories', c))
        form.set('metaTitle', metaTitle)
        form.set('metaDescription', metaDescription)

        try {
            setSaving(true)
            await action(form)
            setSaving(false)
            // on success, clear local autosave for this key
            if (typeof window !== 'undefined') {
                localStorage.removeItem(autosaveKey)
            }
        } catch (err) {
            setSaving(false)
            console.error(err)
            alert('Failed to save post. Please try again.')
        }
    }

    // Preview rendering uses editor HTML safely
    const previewHtml = content

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-screen-lg space-y-8 px-4 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">New Post</h2>
                    <div className="text-sm text-gray-500">
                        Autosave: {lastSavedAt ? `${lastSavedAt.toLocaleTimeString()}` : 'not saved yet'}{saving ? ' • saving…' : ''}
                        {!imagekitReady && <span className="text-orange-500 ml-2">• Image upload unavailable</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" type="button" onClick={() => serverSaveDraft()}>{saving ? 'Saving…' : 'Save draft'}</Button>
                    <Button variant="outline" type="button" onClick={() => setPreviewMode((s) => !s)}>{previewMode ? 'Edit' : 'Preview'}</Button>
                    <Button type="submit">Publish</Button>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left side */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                        {errors.title && <div className="text-sm text-red-600 mt-1">{errors.title}</div>}
                    </div>

                    <div>
                        <Label htmlFor="excerpt">Excerpt <span className="text-sm text-gray-500">({excerpt.length}/{EXCERPT_LIMIT})</span></Label>
                        <Textarea id="excerpt" name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value.slice(0, EXCERPT_LIMIT))} rows={3} />
                        {errors.excerpt && <div className="text-sm text-red-600 mt-1">{errors.excerpt}</div>}
                    </div>

                    <div className="border rounded bg-white p-4">
                        <Toolbar editor={editor} onAddImage={addImageToContent} />

                        {!previewMode ? (
                            <EditorContent editor={editor} className="prose min-h-[300px] w-full rounded-md border border-gray-300 p-4 focus:outline-none" />
                        ) : (
                            <div className="prose min-h-[300px] w-full rounded-md border border-gray-300 p-4 bg-white">
                                {/* We trust content from editor (HTML) */}
                                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </div>
                        )}

                        <input type="hidden" name="content" value={content} />
                        {errors.content && <div className="text-sm text-red-600 mt-1">{errors.content}</div>}
                    </div>
                </div>

                {/* Right side */}
                <div className="space-y-6">
                    <div>
                        <Label htmlFor="featuredImage">Featured Image</Label>
                        {featuredImageUrl ? (
                            <div>
                                <Image
                                    src={featuredImageUrl}
                                    alt="featured"
                                    className="h-full w-full object-cover"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                        ) : (
                            <div className="border-dashed border-2 border-gray-300 h-48 rounded flex items-center justify-center text-gray-400">No image selected</div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFeaturedUpload}
                            className="mt-2 block w-full"
                            disabled={!imagekitReady}
                        />
                        {!imagekitReady && <p className="text-sm text-orange-500 mt-1">Image upload disabled - check ImageKit configuration</p>}
                        <input type="hidden" name="featuredImage" value={featuredImageUrl} />
                    </div>

                    <div>
                        <Label htmlFor="status">Status</Label>
                        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="block w-full">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                    </div>

                    <div>
                        <Label>Publish Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start font-normal">{format(date, 'PPPpp')}</Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                            </PopoverContent>
                        </Popover>
                        <input type="hidden" name="publishDate" value={date.toISOString()} />
                        {errors.publishDate && <div className="text-sm text-red-600 mt-1">{errors.publishDate}</div>}
                    </div>

                    {/* Tags */}
                    <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2 flex-wrap">
                            {tags.map((t) => (
                                <div key={t} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                                    <span className="text-sm">{t}</span>
                                    <button type="button" onClick={() => removeTag(t)} className="text-xs text-gray-500">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <Input placeholder="Add tag and press Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
                            }} />
                            <Button type="button" onClick={() => addTag(tagInput)}>Add</Button>
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <Label>Categories</Label>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map((c) => (
                                <div key={c} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                                    <span className="text-sm">{c}</span>
                                    <button type="button" onClick={() => removeCategory(c)} className="text-xs text-gray-500">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <Input placeholder="Add category and press Enter" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addCategory(categoryInput) }
                            }} />
                            <Button type="button" onClick={() => addCategory(categoryInput)}>Add</Button>
                        </div>
                    </div>

                    {/* SEO */}
                    <div>
                        <Label htmlFor="metaTitle">Meta Title</Label>
                        <Input id="metaTitle" name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="metaDescription">Meta Description <span className="text-sm text-gray-500">({metaDescription.length}/{META_DESC_LIMIT})</span></Label>
                        <Textarea id="metaDescription" name="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value.slice(0, META_DESC_LIMIT))} rows={3} />
                        {errors.metaDescription && <div className="text-sm text-red-600 mt-1">{errors.metaDescription}</div>}
                    </div>

                </div>
            </div>

            {/* Hidden fields for server action - tags & categories appended on submit by JS but also provide inputs for progressive enhancement */}
            {tags.map((t) => (
                <input key={`tag-${t}`} type="hidden" name="tags" value={t} />
            ))}
            {categories.map((c) => (
                <input key={`cat-${c}`} type="hidden" name="categories" value={c} />
            ))}

        </form>
    )
}