'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Users, Heart, Code, Handshake, Instagram, MessageSquare } from "lucide-react"

const contactTopics = [
  {
    title: "Join Us on Remind",
    description: "Remind is our official communication app for announcements and updates. Join with class code @kmbeta, or tap here to sign up.",
    icon: MessageSquare,
    href: "https://www.remind.com/join/kmbeta"
  },
  {
    title: "General Inquiries",
    description: "For any general questions about the KMHS Beta Club, our activities, or mission.",
    icon: Mail,
  },
  {
    title: "Membership Questions",
    description: "For questions about joining, eligibility, or current member status.",
    icon: Users,
  },
  {
    title: "Service Hours",
    description: "For inquiries related to submitting, tracking, or finding service opportunities.",
    icon: Heart,
  },
  {
    title: "Sponsorship & Partnerships",
    description: "For inquiries about sponsoring our club or forming a community partnership, please contact us at our club email.",
    icon: Handshake,
  },
  {
    title: "Website Feedback",
    description: "Report an issue or provide feedback on our website.",
    icon: Code,
  },
  {
    title: "Stay Updated",
    description: "Follow our official Instagram for real-time updates and chapter highlights.",
    icon: Instagram,
    href: "https://www.instagram.com/kmhsbetaclub"
  }
]

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="mb-12 text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
            Contact Us
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Have a question? We'd love to hear from you. All communications for the topics below are handled through our club email.
            </p>
             <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="mailto:kmhsbeta@studizilla.com" className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    <Mail className="mr-2 h-5 w-5" /> kmhsbeta@studizilla.com
                </a>
                <a href="https://www.remind.com/join/kmbeta" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-primary px-6 py-3 text-lg font-semibold text-primary transition-colors hover:bg-primary/10">
                    <MessageSquare className="mr-2 h-5 w-5" /> Remind: @kmbeta
                </a>
                <a href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-primary px-6 py-3 text-lg font-semibold text-primary transition-colors hover:bg-primary/10">
                    <Instagram className="mr-2 h-5 w-5" /> @kmhsbetaclub
                </a>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {contactTopics.map((topic) => {
            const Icon = topic.icon
            const CardWrapper = topic.href ? 'a' : 'div'
            return (
              <CardWrapper key={topic.title} {...(topic.href ? { href: topic.href, target: "_blank", rel: "noopener noreferrer" } : {})} className={topic.href ? "group" : ""}>
                <Card className={`h-full border-border/50 bg-secondary/20 transition-all ${topic.href ? "group-hover:border-primary/50 group-hover:shadow-lg" : ""}`}>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="rounded-md bg-primary/10 p-3 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle>{topic.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{topic.description}</p>
                    </CardContent>
                </Card>
              </CardWrapper>
            )
          })}
        </div>
         <div className="mt-12 text-center text-muted-foreground">
            <p>We'll get back to you as soon as possible!</p>
        </div>
    </div>
  )
}
