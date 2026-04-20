'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, Rocket, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Z.ai Logo" className="h-8 w-8" />
            <span className="text-lg font-bold">Z.ai Code</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Home</Button>
            <Button variant="outline" size="sm">Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Build Faster with
              <span className="block text-primary/80">Z.ai Code</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Modern Next.js scaffold optimized for AI-powered development. 
              Built with TypeScript, Tailwind CSS, and shadcn/ui.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg">
              <Rocket className="mr-2 h-4 w-4" />
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              <Code className="mr-2 h-4 w-4" />
              View Docs
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-4 pt-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">TypeScript</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Full type safety with strict TypeScript configuration</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tailwind CSS</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Utility-first styling with shadcn/ui components</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Optimized for AI-assisted development workflows</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Z.ai Code
        </div>
      </footer>
    </div>
  )
}
