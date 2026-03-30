import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { NavHeader } from '@/components/nav-header'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import remarkGfm from 'remark-gfm'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(p => ({ slug: p.slug }))
}

const SITE_URL = 'https://samrath.bio'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const post = getPostBySlug(params.slug)
    return {
      title: `${post.title} | Samrath Reddy`,
      description: post.subtitle,
      authors: [{ name: 'Samrath Reddy', url: SITE_URL }],
      openGraph: {
        title: post.title,
        description: post.subtitle,
        url: `${SITE_URL}/blog/${post.slug}`,
        siteName: 'Samrath Reddy',
        type: 'article',
        publishedTime: post.date,
        authors: ['Samrath Reddy'],
        tags: post.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.subtitle,
        creator: '@samrathreddy',
      },
      alternates: {
        canonical: `${SITE_URL}/blog/${post.slug}`,
      },
    }
  } catch {
    return { title: 'Not Found' }
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  let post
  try {
    post = getPostBySlug(params.slug)
  } catch {
    notFound()
  }

  // JSON-LD structured data: all values are server-side constants or post
  // metadata from local MDX files — no user-supplied input is interpolated.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.subtitle,
    author: {
      '@type': 'Person',
      name: 'Samrath Reddy',
      url: SITE_URL,
    },
    datePublished: post.date,
    dateModified: post.date,
    publisher: {
      '@type': 'Person',
      name: 'Samrath Reddy',
      url: SITE_URL,
    },
    url: `${SITE_URL}/blog/${params.slug}`,
    keywords: post.tags.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${params.slug}`,
    },
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-[#989898] hover:text-white transition-colors text-sm mb-8 sm:mb-12">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7-7 7 7 7" />
          </svg>
          All articles
        </Link>

        {/* Header */}
        <header className="mb-8 sm:mb-12">
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-[#989898] border border-white/10">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3 sm:mb-4">{post.title}</h1>
          <p className="text-[#989898] text-base sm:text-xl leading-relaxed mb-6 sm:mb-8">{post.subtitle}</p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-[#555] pb-6 sm:pb-8 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">S</div>
              <span className="text-[#989898]">Samrath Reddy</span>
            </div>
            <span>·</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
        </header>

        {/* Content */}
        <article className="prose prose-invert prose-base sm:prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-[#ccc] prose-p:leading-relaxed
          prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white
          prose-code:text-amber-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:overflow-x-auto
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:rounded-none [&_pre_code]:text-inherit [&_pre_code]:text-sm
          [&_table]:overflow-x-auto [&_table]:block [&_table]:max-w-full
          prose-blockquote:border-amber-500 prose-blockquote:text-[#989898]
          prose-hr:border-white/10
          prose-li:text-[#ccc]
        ">
          <MDXRemote source={post.content} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
        </article>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <Link href="/#projects" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to projects
          </Link>
        </div>
      </main>
    </div>
  )
}
