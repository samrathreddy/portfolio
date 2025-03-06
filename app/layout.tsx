import "./global.css"
import { Inter } from "next/font/google"
import { ReactQueryProvider } from "@/lib/react-query/provider"
import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from "next"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })


export const metadata: Metadata = {
  title: "Samrath - Portfolio",
  description: "Samrath's Personal portfolio showcasing skills, tech stack and projects",
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
