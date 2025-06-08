import "./global.css"
import { Inter } from "next/font/google"
import { ReactQueryProvider } from "@/lib/react-query/provider"
import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })


export const metadata: Metadata = {
  title: "Samrath Reddy | Full Stack Developer Portfolio & Projects",
  description: "Discover Samrath Reddy's personal portfolio: Full Stack Developer skilled in React, Node.js, TypeScript, and modern web technologies. Explore projects, skills, tech stack, and professional experience.",
  keywords: [
    "Samrath Reddy",
    "Full Stack Developer",
    "Software Engineer",
    "Portfolio",
    "Web Developer",
    "React",
    "Node.js",
    "TypeScript",
    "Projects",
    "Tech Stack",
    "Frontend",
    "Backend",
    "JavaScript",
    "Personal Website"
  ],
  authors: [{ name: "Samrath Reddy" }],
  creator: "Samrath Reddy",
  publisher: "Samrath Reddy",
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "Samrath Reddy | Full Stack Developer & AI Engineer",
    description: "Discover Samrath Reddy's personal portfolio: Full Stack Developer skilled in React, Node.js, TypeScript, and modern web technologies. Explore projects, skills, tech stack, and professional experience.",
    url: "https://samrath.bio/",
    siteName: "Samrath Reddy Portfolio",
    images: [
      {
        url: "https://samrath.bio/image.png",
        width: 512,
        height: 512,
        alt: "Samrath Reddy Portfolio"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Samrath Reddy | Full Stack Developer Portfolio & Projects",
    description: "Discover Samrath Reddy's personal portfolio: Full Stack Developer skilled in React, Node.js, TypeScript, and modern web technologies. Explore projects, skills, tech stack, and professional experience.",
    site: "@samrathghana",
    creator: "@samrathghana",
    images: ["https://samrath.bio/image.png"]
  },
  alternates: {
    canonical: "https://samrathdev.vercel.app/" // Update to your actual domain
  },
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <Analytics />
        <Toaster 
          position="bottom-right"
          expand={true}
          richColors
          theme="dark"
          closeButton
          style={{ marginBottom: "20px" }}
        />
      </body>
      <Analytics />
    </html>
  )
}
