"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { ThemeProvider } from "next-themes"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init("phc_3w9wSuUqf9z7vPM8Xg9DyrEkEMEvg5YmMRSmnHFjNuQ", {
      api_host: "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </PHProvider>
  )
}
