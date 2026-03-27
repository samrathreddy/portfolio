import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { NavHeader } from '@/components/nav-header'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const post = getPostBySlug(params.slug)
    return { title: `${post.title} | Samrath`, description: post.subtitle }
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <NavHeader />
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-[#989898] hover:text-white transition-colors text-sm mb-12">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7-7 7 7 7" />
          </svg>
          All articles
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 text-[#989898] border border-white/10">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">{post.title}</h1>
          <p className="text-[#989898] text-xl leading-relaxed mb-8">{post.subtitle}</p>
          <div className="flex items-center gap-4 text-sm text-[#555] pb-8 border-b border-white/5">
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
        <article className="prose prose-invert prose-lg max-w-none
          prose-headings:text-white prose-headings:font-bold
          prose-p:text-[#ccc] prose-p:leading-relaxed
          prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white
          prose-code:text-amber-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
          prose-blockquote:border-amber-500 prose-blockquote:text-[#989898]
          prose-hr:border-white/10
          prose-li:text-[#ccc]
        ">
          <MDXRemote source={post.content} />
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
