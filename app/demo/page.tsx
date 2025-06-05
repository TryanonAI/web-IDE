'use client';

import { motion } from 'framer-motion';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
      <main className="container max-w-screen-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Video Section */}
          <div className="relative rounded-xl border border-border/50 bg-card/95 p-8 shadow-lg backdrop-blur-sm">
            <div className="mb-8">
              <h3 className="flex items-center gap-3 text-2xl font-semibold text-foreground">
                <PlayCircle className="h-6 w-6 text-primary" />
                Getting Started with ANON AI
              </h3>
              <p className="mt-3 text-lg text-muted-foreground">
                Learn how to use ANON AI to build and deploy your projects
                quickly and efficiently. Follow along with our comprehensive
                guide.
              </p>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50 shadow-sm">
              <iframe
                src="https://www.youtube.com/embed/RpMAEqHVPKU?si=nwN_dBmvCWNCn9pB"
                title="ANON AI Demo Video"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
