"use client"

import { motion } from "framer-motion"

const techStack = [
  {
    name: "Java",
    icon: "/portfolio/tech/java.svg",
    category: "Languages"
  },
  {
    name: "Python",
    icon: "/portfolio/tech/python.svg",
    category: "Languages"
  },
  {
    name: "SQL",
    icon: "/portfolio/tech/sql.svg",
    category: "Databases"
  },
  {
    name: "MongoDB",
    icon: "/portfolio/tech/mongodb.svg",
    category: "Databases"
  },
  {
    name: "Express.js",
    icon: "/portfolio/tech/express.svg",
    category: "Backend"
  },
  {
    name: "Node.js",
    icon: "/portfolio/tech/nodejs.svg",
    category: "Backend"
  },
  {
    name: "React",
    icon: "/portfolio/tech/react.svg",
    category: "Frontend"
  },
  {
    name: "Next.js",
    icon: "/portfolio/tech/nextJs.svg",
    category: "Frontend"
  },
  {
    name: "AWS Cloud",
    icon: "/portfolio/tech/aws.svg",
    category: "Cloud"
  },
  {
    name: "Vercel",
    icon: "/portfolio/tech/vercel.svg",
    category: "Cloud"
  },
  {
    name: "GCP",
    icon: "/portfolio/tech/gcp.svg",
    category: "Cloud"
  },
  {
    name: "OpenAI",
    icon: "/portfolio/tech/openai.svg",
    category: "AI"
  }
]

const floatingAnimation = {
  initial: { opacity: 0, y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export function TechStackSection() {
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-background to-background/50">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 mix-blend-normal" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(0,0,0,0),rgba(0,0,0,0.8))]" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${10 + i * 2}s infinite ease-in-out`
            }}
          />
        ))}
      </div>

      <div id ="techstack" className="container relative mx-auto px-4">
        <div className="flex flex-col items-center justify-center max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative mb-20 text-center"
          >
            <span className="text-primary text-sm font-medium mb-2 block">My Tech Stack</span>
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              Technologies I Worked On
            </h2>
            <div className="mt-4 flex justify-center">
              <div className="w-32 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full" />
            </div>
          </motion.div>

          {/* Tech Stack Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-10 max-w-5xl mx-auto">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                {...floatingAnimation}
                className="group relative flex flex-col items-center"
              >
                <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-primary/50 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <div className="absolute -inset-px bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-2xl blur-md transition-opacity" />
                  <img
                    src={tech.icon}
                    alt={tech.name}
                    className="w-14 h-14 object-contain filter brightness-90 group-hover:brightness-110 transition-all duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="mt-4 text-center">
                  <span className="block text-sm font-medium text-white group-hover:text-primary transition-colors">
                    {tech.name}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 block opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {tech.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Add some CSS animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-20px) }
        }
      `}</style>
    </section>
  )
} 