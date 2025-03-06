"use client"

import { motion } from "framer-motion"
import { 
  Blocks, 
  Database, 
  FileJson, 
  Laptop, 
  Layout, 
  Server, 
  Webhook,
  Globe,
  Sparkles
} from "lucide-react"

export function AboutSection() {
  const topRow = [
    {
      name: "Backend Systems",
      description: "Scalable server solutions",
      icon: Server,
      color: "text-green-500"
    },
    {
      name: "API Development",
      description: "Crafting robust RESTful APIs and seamless third-party service integrations",
      icon: Webhook,
      color: "text-purple-500"
    },
    {
      name: "Database Design",
      description: "SQL & NoSQL databases",
      icon: Database,
      color: "text-yellow-500"
    }
  ]

  const bottomRow = [
    {
      name: "AI Integrations",
      description: "Implementing cutting-edge AI solutions with LLMs, Computer Vision, and ML models",
      icon: Blocks,
      color: "text-pink-500"
    },
    {
      name: "System Design",
      description: "Architecture & Infrastructure",
      icon: Laptop,
      color: "text-red-500"
    }
  ]

  return (
    <section id="about" className="relative overflow-hidden py-24">
      {/* Radial gradient for the container to give a faded look */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="container relative mx-auto px-4">
        <div className="flex flex-col items-center justify-center max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative mb-16 text-center"
          >
            <span className="text-primary text-sm font-medium mb-2 block">My Exploration</span>
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              Things I Love
            </h2>
            <div className="mt-3 flex justify-center">
              <div className="w-20 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full" />
            </div>
          </motion.div>

          {/* Tech Stack Grid - Top Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto w-full">
            {topRow.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="group relative flex flex-col items-center justify-center h-full p-8 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors">
                  <div className="relative flex items-center justify-center w-14 h-14">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <tech.icon className={`w-8 h-8 ${tech.color} transition-transform group-hover:scale-110`} />
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-white group-hover:text-primary transition-colors">
                    {tech.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center leading-relaxed">
                    {tech.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tech Stack Grid - Bottom Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto w-full mt-6 lg:mt-8">
            {bottomRow.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index + 3) * 0.1 }}
              >
                <div className="group relative flex flex-col items-center justify-center h-full p-8 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-colors">
                  <div className="relative flex items-center justify-center w-14 h-14">
                    <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <tech.icon className={`w-8 h-8 ${tech.color} transition-transform group-hover:scale-110`} />
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-white group-hover:text-primary transition-colors">
                    {tech.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground text-center leading-relaxed">
                    {tech.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-16 text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-white/80 font-medium">Continuous Learning Journey</span>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              I embrace the mindset of a perpetual learner. While I may not claim mastery, 
              I'm constantly exploring new technologies and leveraging AI to enhance my capabilities. 
              Every job / project is an opportunity to grow and innovate.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 