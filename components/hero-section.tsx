"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export function HeroSection() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [titleFlipped, setTitleFlipped] = useState(false);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 2000);

    const titleInterval = setInterval(() => {
      setTitleFlipped(prev => !prev);
    }, 2000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(titleInterval);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-dot-white/[0.2] pt-16 sm:pt-0">
      {/* Radial gradient for the container to give a faded look */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      {/* Animated background blobs */}
      <div className="absolute inset-0 max-w-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Content */}
      <div className="relative px-4 text-center mt-[5vh]">
        <div className="space-y-4">
          {/* Flipping text badge */}
          <div className="inline-block perspective-1000">
            <div className={`relative transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-x-180' : ''}`}>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-muted/50 backdrop-blur-sm border border-white/10 text-gray-100 backface-hidden">
                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                Available for freelance 
              </div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-muted/50 backdrop-blur-sm border border-white/10 text-gray-100 absolute inset-0 rotate-x-180 backface-hidden">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Seeking opportunities
              </div>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 animate-fade-in-up">
            Hi, I'm Samrath
            <div className="block mt-2">
              <span className="text-primary">Aspiring Software </span>
              <span className="inline-block perspective-1000">
                <div className={`relative inline-block transition-transform duration-500 transform-style-preserve-3d ${titleFlipped ? 'rotate-x-180' : ''}`}>
                  <span className="inline-block text-primary backface-hidden">Engineer</span>
                  <span className="inline-block text-primary absolute inset-0 rotate-x-180 backface-hidden">Developer</span>
                </div>
              </span>
            </div>
          </h1>
          <br></br>

          {/* Description */}
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
           Craving to build innovative solutions that make an impact. Enthusiastic problem solver, always curious about new technologies.  
           Committed to continuous learning and growth.
          </p>
          
          <br></br>
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mt-16 justify-center animate-fade-in-up delay-300">
            <Link href="/meet">
              <Button size="lg" className="relative group px-8">
                <span className="absolute -inset-0.5 bg-gradient-to-r from-primary via-yellow-500 to-primary rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></span>
                <span className="relative flex items-center">
                  Schedule a call
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>
            <Link href="#projects">
              <Button size="lg" variant="outline" className="group px-8">
                View Projects
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-fade-in delay-500 hidden sm:block">
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-muted-foreground">Scroll to explore</span>
          <div className="w-[2px] h-8 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </div>
    </section>
  )
} 