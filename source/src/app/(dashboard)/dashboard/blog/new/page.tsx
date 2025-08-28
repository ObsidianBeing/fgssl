// app/dashboard/blog/new/page.tsx
'use client'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createBlogPost } from '@/lib/blog'
import { redirect } from 'next/navigation'

// Dynamically import BlogEditor to prevent SSR issues with SDK initialization
/*const BlogEditor = dynamic(
    () => import('@/components/blog/BlogEditor'),
    {
        ssr: false,
        loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
    }
)*/


type BlogPost = {
    title: string
    content: string
    excerpt: string
    status: 'draft' | 'published' | 'scheduled'
    publishDate: string
    categories: string[]
    featuredImage: string
    metaTitle: string
    metaDescription: string
}

// Force dynamic rendering for this page
// export const dynamicMode = 'force-dynamic'

export default function NewBlogPostPage() {
    /*async function handleSubmit(formData: FormData) {
        'use server'
        console.log("inside NewBlogPostPage")

        const blogPost: BlogPost = {
            title: (formData.get('title') as string)?.trim() || '',
            content: (formData.get('content') as string)?.trim() || '',
            excerpt: (formData.get('excerpt') as string)?.trim() || '',
            status: (['draft', 'published', 'scheduled'].includes(formData.get('status') as string)
                ? (formData.get('status') as BlogPost['status'])
                : 'draft'),
            publishDate:
                (formData.get('publishDate') as string) || new Date().toISOString(),
            categories: (formData.getAll('categories') as string[]) || [],
            featuredImage: (formData.get('featuredImage') as string)?.trim() || '',
            metaTitle: (formData.get('metaTitle') as string)?.trim() || '',
            metaDescription: (formData.get('metaDescription') as string)?.trim() || ''
        }

        // Convert publishDate to Date object for createBlogPost
        const blogPostForCreate = {
            ...blogPost,
            publishDate: new Date(blogPost.publishDate)
        };

        try {
            const result = await createBlogPost(blogPostForCreate)
            if (result?.data?.slug) {
                redirect(`/dashboard/blog/${result.data.slug}`)
            } else {
                throw new Error('Missing slug from blog creation result.')
            }
        } catch (err) {
            console.error('Error creating blog post:', err)
            throw new Error('Failed to create blog post. Please try again.')
        }
    }

    return (
        <div className="container py-10 max-w-4xl">
            <h1 className="text-3xl font-semibold mb-6">Create New Blog Post</h1>

            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
                <BlogEditor
                    action={handleSubmit}
                    onSubmit={handleSubmit}
                    defaultValues={{
                        title: '',
                        content: '',
                        excerpt: '',
                        status: 'draft',
                        publishDate: new Date().toISOString(),
                        featuredImage: '',
                        metaTitle: '',
                        metaDescription: ''
                    }}
                />
            </Suspense>
        </div>
    )*/
}