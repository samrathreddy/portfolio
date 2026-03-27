import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const blogsDir = path.join(process.cwd(), 'content/blog')

export interface BlogPost {
  slug: string
  title: string
  subtitle: string
  date: string
  tags: string[]
  readingTime: string
  content: string
}

export function getAllPosts(): Omit<BlogPost, 'content'>[] {
  const files = fs.readdirSync(blogsDir)
  return files
    .filter(f => f.endsWith('.mdx'))
    .map(filename => {
      const slug = filename.replace('.mdx', '')
      const raw = fs.readFileSync(path.join(blogsDir, filename), 'utf-8')
      const { data } = matter(raw)
      const stats = readingTime(raw)
      return {
        slug,
        title: data.title,
        subtitle: data.subtitle,
        date: data.date,
        tags: data.tags || [],
        readingTime: stats.text,
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost {
  const filepath = path.join(blogsDir, `${slug}.mdx`)
  const raw = fs.readFileSync(filepath, 'utf-8')
  const { data, content } = matter(raw)
  const stats = readingTime(raw)
  return {
    slug,
    title: data.title,
    subtitle: data.subtitle,
    date: data.date,
    tags: data.tags || [],
    readingTime: stats.text,
    content,
  }
}
