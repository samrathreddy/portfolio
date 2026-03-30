import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { NavHeader } from '@/components/nav-header'

export const metadata = {
  title: 'Blog | Samrath Reddy',
  description: 'Articles about building software, side projects, and engineering insights by Samrath Reddy.',
  openGraph: {
    title: 'Blog | Samrath Reddy',
    description: 'Articles about building software, side projects, and engineering insights.',
    url: 'https://samrath.bio/blog',
    siteName: 'Samrath Reddy',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Blog | Samrath Reddy',
    description: 'Articles about building software, side projects, and engineering insights.',
    creator: '@samrathreddy',
  },
  alternates: {
    canonical: 'https://samrath.bio/blog',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <NavHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-3 sm:mb-4">Writing</h1>
          <p className="text-[#666] dark:text-[#989898] text-base sm:text-lg">Deep dives into projects, architecture decisions, and things I learned building stuff.</p>
        </div>

        <div className="space-y-px">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block py-6 sm:py-8 border-b border-black/10 dark:border-white/5 hover:border-black/20 dark:hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#555] dark:text-[#989898] border border-black/10 dark:border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl font-semibold text-black dark:text-white group-hover:text-primary transition-colors mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-[#666] dark:text-[#989898] text-sm leading-relaxed line-clamp-2">{post.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-[#999] dark:text-[#555]">
                <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
