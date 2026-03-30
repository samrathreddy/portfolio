"use client"

import { useEffect, useRef } from "react"
import type { WalineAbort } from "@waline/client/pageview"

interface WalinePageviewProps {
  path: string
  update?: boolean
}

export function WalinePageview({ path, update = false }: WalinePageviewProps) {
  const abortRef = useRef<WalineAbort | null>(null)
  const id = `waline-pv-${path.replace(/\//g, "-")}`

  useEffect(() => {
    const serverURL = process.env.NEXT_PUBLIC_WALINE_SERVER_URL
    if (!serverURL) return

    import("@waline/client/pageview").then(({ pageviewCount }) => {
      abortRef.current = pageviewCount({
        serverURL,
        path,
        selector: `#${id}`,
        update,
        lang: "en",
      })
    })

    return () => {
      abortRef.current?.()
    }
  }, [path, update, id])

  return (
    <span id={id} className="waline-pageview-count">
      --
    </span>
  )
}
