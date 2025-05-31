"use client"

import { motion, Reorder, useMotionValue } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Project, projects as defaultProjects } from "../config/projects"
import { useMediaQuery } from 'react-responsive';

interface ProjectsSectionProps {
  projects?: Project[];
  title?: string;
  subtitle?: string;
  className?: string;
  onProjectsReorder?: (newOrder: Project[]) => void;
}

// Helper function to get hostname safely
const getHostname = (url: string) => {
  try {
    return new URL(url).hostname
  } catch (e) {
    return url
  }
}

export function ProjectsSection({ 
  projects: initialProjects = defaultProjects,
  title = "My Recent Work",
  subtitle = "Featured Projects",
  className = "",
  onProjectsReorder
}: ProjectsSectionProps) {
  // State for project order
  const [orderedProjects, setOrderedProjects] = useState(initialProjects);

  // State for orb positions
  const [orbPositions] = useState(() => 
    Array(3).fill(0).map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100
    }))
  )

  // State for iframe loading
  const [loadedIframes, setLoadedIframes] = useState<Record<string, boolean>>({})

  // Client-side only code
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const isMobile = useMediaQuery({ maxWidth: 767 }); // Adjust the maxWidth as needed

  // Handle project reordering
  const handleReorder = (newOrder: Project[]) => {
    setOrderedProjects(newOrder);
    onProjectsReorder?.(newOrder);
  };

  return (
    <section className={`relative py-32 overflow-hidden bg-gradient-to-b from-background to-background/50 ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 mix-blend-normal" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(0,0,0,0),rgba(0,0,0,0.8))]" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {orbPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"
            style={{
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              animation: `float ${10 + i * 2}s infinite ease-in-out`
            }}
          />
        ))}
      </div>

      <div className="container relative mx-auto px-4">
        <div id = "projects" className="flex flex-col items-center justify-center max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative mb-20 text-center"
          >
            <motion.span 
              className="text-primary text-sm font-medium mb-3 block text-blue-500"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.span>
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/80">
              {title}
            </h2>
            <br></br>
            <h3 className="text-gray-400 text-sm mb-2 transition-colors duration-500 group-hover:text-gray-300">
              * Draggable and Live viewable projects (Works only on desktop)
            </h3>
            <div className="mt-4 flex justify-center">
              <div className="w-32 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full" />
            </div>
          </motion.div>

          {/* Projects Grid */}
          {!isMobile ? (
            <Reorder.Group 
              axis="y" 
              values={orderedProjects} 
              onReorder={handleReorder}
              className="grid grid-cols-1 gap-32 w-full"
            >
              {orderedProjects.map((project, index) => (
                <Reorder.Item
                  key={project.id}
                  value={project}
                  className="relative cursor-move"
                  whileDrag={{
                    scale: 1.02,
                    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                    zIndex: 50
                  }}
                  transition={{
                    duration: 0.2
                  }}
                >
                  <div className="relative group">
                    {/* Drag Handle */}
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
                        <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                    </div>

                    {/* Curved Path */}
                    <div className="absolute left-0 right-0 top-0 bottom-0 hidden lg:block pointer-events-none">
                      <svg
                        className="absolute inset-0 w-full h-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d={index % 2 === 0 
                            ? "M50,0 Q65,50 50,100" 
                            : "M50,0 Q35,50 50,100"
                          }
                          className={`stroke-2 opacity-50 path-gradient-${index}`}
                          strokeWidth="0.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className={`absolute top-1/2 ${index % 2 === 0 ? "right-1/2" : "left-1/2"} -translate-y-1/2 ${index % 2 === 0 ? "translate-x-1/2" : "-translate-x-1/2"}`}
                      >
                        <div className="relative">
                          <div className={`absolute h-6 w-6 -left-3 -top-3 rounded-full blur-[10px] bg-gradient-to-r ${project.color}`} />
                          <div
                            className={`h-5 w-5 rounded-full relative bg-gradient-to-r ${project.color}`}
                            style={{
                              boxShadow: "0 0 20px var(--primary), 0 0 40px var(--primary-light)"
                            }}
                          />
                        </div>
                      </motion.div>
                    </div>

                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
                      {/* Content */}
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className={`${index % 2 === 1 ? "lg:order-2" : ""}`}
                      >
                        
                        <div className="group bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
                        <div
                            className={`text-xl font-medium mb-4 bg-gradient-to-r from-[#FFD700] to-[#FFC000] text-transparent bg-clip-text transform transition-transform duration-500 group-hover:scale-105`}
                          >
                            {project.subtitle}
                          </div>
                         <h3 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 transform transition-transform duration-500 group-hover:translate-x-2">
                            {project.title}
                          </h3>
                          <p className="text-gray-400 text-lg mb-6 transition-colors duration-500 group-hover:text-gray-300">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-3 mb-8">
                            {project.tech.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-1 text-sm rounded-full bg-white/5 border border-white/10 text-gray-300 transition-all duration-300 hover:scale-110 hover:border-primary/50"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <Link
                              href={project.links.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <span className="text-lg">Website</span>
                            </Link>
                            <Link
                              href={project.links.github}
                              target="_blank"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white transform transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-lg"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                              GitHub
                            </Link>
                            <Link
                              href={project.links.video}
                              target="_blank"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white transform transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-lg"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Watch Demo
                            </Link>
                          </div>
                        </div>
                      </motion.div>

                      {/* Interactive Preview */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 50 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                        className={`relative aspect-video rounded-2xl overflow-hidden border border-white/10 group ${index % 2 === 1 ? "lg:order-1" : ""}`}
                      >
                        {/* Browser Window Controls */}
                        <div className="absolute top-0 left-0 right-0 h-8 bg-[#2D2D2D] backdrop-blur-sm z-20 flex items-center px-3 gap-2 border-b border-white/10">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F57] flex items-center justify-center">
                              <svg className="w-2 h-2 text-[#450d0d] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] flex items-center justify-center">
                              <svg className="w-2 h-2 text-[#5c4813] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </div>
                            <div className="w-3 h-3 rounded-full bg-[#28C840] flex items-center justify-center">
                              <svg className="w-2 h-2 text-[#1b5c24] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-center px-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#1F1F1F] border border-white/10 max-w-[240px] w-full">
                              {isClient && (
                                <>
                                  <svg className="w-3 h-3 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10z" />
                                  </svg>
                                  <span className="text-xs text-white/60 font-medium truncate">
                                    {getHostname(project.preview)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                              onClick={() => {
                                const element = document.getElementById(`preview-${project.id}`) as HTMLIFrameElement | HTMLVideoElement;
                                if (element) {
                                  setLoadedIframes(prev => ({ ...prev, [project.id]: false }));
                                  if (element instanceof HTMLVideoElement) {
                                    element.load();
                                    element.play();
                                  } else if (element instanceof HTMLIFrameElement) {
                                    element.src = element.src;
                                  }
                                }
                              }}
                            >
                              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <a 
                              href={project.preview}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                            >
                              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>

                        {/* Preview Container */}
                        <div className="relative w-full h-full pt-8">
                          {(!loadedIframes[project.id] && isClient) && (
                            <div className="absolute inset-0 bg-[#1F1F1F] z-10 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                            </div>
                          )}
                          {isClient && (
                            <div className="relative w-full h-full overflow-hidden bg-white">
                              {project.preview.match(/\.(mp4|mov|webm)$/) || project.preview.includes('/projects/') ? (
                                <video
                                  id={`preview-${project.id}`}
                                  src={project.preview}
                                  className="absolute top-0 left-0 w-full h-full object-cover transition-all duration-500 group-hover:filter-none filter blur-[2px]"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                  onLoadedData={() => {
                                    setLoadedIframes(prev => ({ ...prev, [project.id]: true }))
                                  }}
                                />
                              ) : (
                                <iframe
                                  id={`preview-${project.id}`}
                                  src={project.preview}
                                  className="absolute top-0 left-0 w-full h-full scale-[0.7] origin-top-left transition-all duration-500 group-hover:filter-none filter blur-[2px]"
                                  style={{
                                    width: '143%',
                                    height: '143%',
                                  }}
                                  onLoad={() => {
                                    setLoadedIframes(prev => ({ ...prev, [project.id]: true }))
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Hover Overlay - Removed the blur effect */}
                        <div className="absolute inset-0 bg-black/40 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none" />
                      </motion.div>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="grid grid-cols-1 gap-32 w-full">
              {orderedProjects.map((project, index) => (
                <div key={project.id} className="relative">
                  <div className="relative group">
                    {/* Curved Path */}
                    <div className="absolute left-0 right-0 top-0 bottom-0 hidden lg:block pointer-events-none">
                      <svg
                        className="absolute inset-0 w-full h-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d={index % 2 === 0 
                            ? "M50,0 Q65,50 50,100" 
                            : "M50,0 Q35,50 50,100"
                          }
                          className={`stroke-2 opacity-50 path-gradient-${index}`}
                          strokeWidth="0.5"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>

                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>  
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className={`${index % 2 === 1 ? "lg:order-2" : ""}`}
                      >
                        <div className="group bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20">
                          <div
                            className={`text-xl font-medium mb-4 bg-gradient-to-r from-[#FFD700] to-[#FFC000] text-transparent bg-clip-text transform transition-transform duration-500 group-hover:scale-105`}
                          >
                            {project.subtitle}
                          </div>
                          <h3 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 transform transition-transform duration-500 group-hover:translate-x-2">
                            {project.title}
                          </h3>
                          <p className="text-gray-400 text-lg mb-6 transition-colors duration-500 group-hover:text-gray-300">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-3 mb-8">
                            {project.tech.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-1 text-sm rounded-full bg-white/5 border border-white/10 text-gray-300 transition-all duration-300 hover:scale-110 hover:border-primary/50"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4">
                            <Link
                              href={project.links.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              <span className="text-lg">Website</span>
                            </Link>
                            <Link
                              href={project.links.github}
                              target="_blank"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white transform transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-lg"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                              </svg>
                              GitHub
                            </Link>
                            <Link
                              href={project.links.video}
                              target="_blank"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white transform transition-all duration-300 hover:scale-105 hover:bg-white/20 hover:shadow-lg"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Watch Demo
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add CSS for path gradients and animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-20px) }
        }

        .path-gradient-0 {
          stroke: url(#gradient-0);
        }
        .path-gradient-1 {
          stroke: url(#gradient-1);
        }
        .path-gradient-2 {
          stroke: url(#gradient-2);
        }

        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      {/* SVG Gradients */}
      <svg width="0" height="0">
        <defs>
          {orderedProjects.map((project, index) => (
            <linearGradient key={index} id={`gradient-${index}`} gradientTransform="rotate(90)">
              <stop offset="0%" stopColor={`hsl(${45 + index * 120}, 70%, 50%)`} />
              <stop offset="100%" stopColor={`hsl(${45 + index * 120}, 70%, 60%)`} />
            </linearGradient>
          ))}
        </defs>
      </svg>
    </section>
  )
} 