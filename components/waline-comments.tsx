"use client"

import { useEffect, useRef } from "react"
import type { WalineInstance } from "@waline/client"
import "@waline/client/waline.css"

interface WalineCommentsProps {
  path: string
}

export function WalineComments({ path }: WalineCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<WalineInstance | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const serverURL = process.env.NEXT_PUBLIC_WALINE_SERVER_URL
    if (!serverURL) return

    import("@waline/client").then(({ init }) => {
      instanceRef.current = init({
        el: containerRef.current!,
        serverURL,
        path,
        lang: "en",
        dark: "html.dark",
        login: "force",
        pageSize: 10,
        commentSorting: "latest",
        reaction: false,
      })
    })

    return () => {
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
  }, [path])

  return <div ref={containerRef} className="waline-container mt-16" />
}
