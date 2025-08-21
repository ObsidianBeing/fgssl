/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/blog/[slug]/page.tsx
import BlogEditor from '@/components/blog/BlogEditor'
import { getBlogPostBySlug } from '@/lib/blog'
import { notFound } from 'next/navigation'
import { handleEditBlogSubmit } from '@/actions/blogActions'
import React from 'react'
import { IBlog } from '@/models/Blog'

type Props = { params: { slug: string } }

export default async function EditBlogPost({ params }: Props) {
    const { slug } = params

    // fetch the post (normalize shape)
    const postResp = await getBlogPostBySlug(slug)
    const post = (postResp && (postResp.data ?? postResp)) ?? null

    if (!post) {
        notFound()
    }

    // Ensure post is of type IBlog
    const blogPost = post as unknown as IBlog

    // create a server action bound to this slug.
    // IMPORTANT: this function must include 'use server' so it is passed
    // as a server action to the client BlogEditor.
    async function handleSubmit(formData: FormData) {
        'use server'
        // reuse shared server-side logic; handleEditBlogSubmit is a server helper
        await handleEditBlogSubmit(slug, formData)
    }

    // normalize publishDate to ISO string (BlogEditor accepts string|Date)
    const publishDate = blogPost.publishDate ? new Date(blogPost.publishDate).toISOString() : new Date().toISOString()

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>

            <BlogEditor
                // pass server action reference (not an inline arrow) — we defined handleSubmit above
                onSubmit={handleSubmit}
                //title={blogPost.title ?? ''}
                content={blogPost.content ?? ''}
                excerpt={blogPost.excerpt ?? ''}
                status={blogPost.status ?? 'draft'}
                publishDate={publishDate}
                featuredImage={blogPost.featuredImage ?? ''}
                metaTitle={blogPost.metaTitle ?? ''}
                metaDescription={blogPost.metaDescription ?? ''}
                tags={blogPost.tags ?? []}
                categories={blogPost.categories ?? []}
                // key helps reset editor when route changes (optional)
                key={slug}
            />
        </div>
    )
}
