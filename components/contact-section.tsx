"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Github, Linkedin, Mail, Send, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export function ContactSection() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL
      if (!webhookUrl) {
        throw new Error("Discord webhook URL not configured")
      }

      const currentTime = new Date().toISOString()

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [{
            title: "✨ New Portfolio Contact Message",
            color: 0x6366f1,
            description: message,
            author: {
              name: email,
              icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            fields: [
              {
                name: "📧 Email",
                value: email,
                inline: true
              },
              {
                name: "⏰ Sent At",
                value: new Date().toLocaleString(),
                inline: true
              }
            ],
            footer: {
              text: "Portfolio Contact Form",
              icon_url: "https://github.com/samrathreddy.png"
            },
            timestamp: currentTime
          }]
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setEmail("")
      setMessage("")
      
      toast.success("Message sent successfully!", {
        description: "Thank you for reaching out. I'll get back to you soon!",
        duration: 5000,
      })

    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message", {
        description: "Please try again later.",
        duration: 5000,
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-background to-background/50">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 mix-blend-normal" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(0,0,0,0),rgba(0,0,0,0.8))]" />
      </div>

      <div className="container relative mx-auto px-4" id="contact">
        <div className="max-w-4xl mx-auto">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <motion.span
              className="text-primary text-sm font-medium mb-3 block tracking-wider uppercase"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              A Small message from
            </motion.span>
            <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/80 mb-6">
              Samrath
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                Thank you for taking the time to explore my portfolio! I'd be happy to connect if you have a hiring opportunity to discuss or an exciting collaboration in mind.
              </p>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed">
                I'm always open to scheduling a call or meeting to discuss projects, potential opportunities, or just to have a great conversation about technology and innovation.
              </p>
              <p className="text-lg md:text-xl text-gray-300 font-medium">
                Let's create something amazing together!
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-1 lg:order-1"
            >
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl border border-white/10 p-8 hover:border-primary/30 transition-all duration-500">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 mb-2">
                    Send me a message
                  </h3>
                  <p className="text-gray-400 text-sm">
                    I'll get back to you within 24 hours
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6" id="contact-form">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Email address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 focus:border-primary/50 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-300">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell me about your project or opportunity..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="min-h-[120px] bg-white/5 border-white/10 focus:border-primary/50 rounded-xl resize-none"
                    />
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-center text-sm text-gray-400">
                    Prefer a quick call? 
                    <Link href="/meet" className="text-primary hover:text-primary/80 ml-1 font-medium">
                      Schedule a meeting →
                    </Link>
                  </p>
                </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 text-base font-semibold rounded-xl"
                    disabled={isSending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-2 lg:order-2"
            >
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl border border-white/10 p-8 hover:border-primary/30 transition-all duration-500 h-full">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 mb-2">
                    Let's connect
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Reach out through any of these channels
                  </p>
                </div>
                
                <div className="space-y-12">
                  <Link
                    href="mailto:samrathreddy04@gmail.com"
                    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-gray-300 hover:text-primary transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-400">samrathreddy04@gmail.com</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="https://linkedin.com/in/samrath-reddy"
                    target="_blank"
                    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-gray-300 hover:text-primary transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <p className="text-sm text-gray-400">Professional profile</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="https://github.com/samrathreddy"
                    target="_blank"
                    className="group flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 text-gray-300 hover:text-primary transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Github className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-sm text-gray-400">View my code</p>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
} 