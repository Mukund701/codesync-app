// src/app/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Link from "next/link";
import { Code, Share2, Type } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Header />
      <main className="container mx-auto px-4 pt-32 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Collaborate in Real-Time,
            <br />
            <span className="text-primary">Instantly.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            CodeSync is a blazingly fast, real-time collaborative code editor.
            Share a link and start coding together, no matter where you are.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6">Get Started for Free</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                I have an account
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Features</h2>
            <p className="text-lg text-muted-foreground mt-2">Everything you need for a seamless coding session.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-card border rounded-lg text-center">
              <div className="inline-block p-4 bg-primary/10 text-primary rounded-lg mb-4">
                <Share2 className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Live Collaboration</h3>
              <p className="text-muted-foreground">
                See changes, cursors, and selections from your teammates in real-time. It’s like you’re in the same room.
              </p>
            </div>
            <div className="p-8 bg-card border rounded-lg text-center">
              <div className="inline-block p-4 bg-primary/10 text-primary rounded-lg mb-4">
                <Code className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Multi-Language Support</h3>
              <p className="text-muted-foreground">
                Switch between JavaScript, Python, Java, and more with synchronized syntax highlighting for everyone.
              </p>
            </div>
            <div className="p-8 bg-card border rounded-lg text-center">
              <div className="inline-block p-4 bg-primary/10 text-primary rounded-lg mb-4">
                <Type className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">Simple & Fast</h3>
              <p className="text-muted-foreground">
                No installations, no complex setup. Just create a room, share the link, and start coding instantly.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
