'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Heart, ChevronLeft } from "lucide-react";
import Link from 'next/link';

export default function ServiceHoursPage() {
  return (
    <div className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center justify-center text-center">
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl text-primary">
          Chapter Impact
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Leading by serving others at Kennesaw Mountain High School.
        </p>
      </div>

      <div className="max-w-[600px] w-full border-2 border-dashed border-primary/20 rounded-2xl p-12 bg-secondary/5 shadow-2xl">
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full h-24 w-24 mx-auto"></div>
          <Heart className="h-20 w-20 text-primary mx-auto relative animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-bold font-headline mb-4">Tracking Coming Soon</h2>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          We are currently building a robust dashboard to showcase our chapter's collective impact and celebrate our top volunteers. Check back soon for real-time statistics!
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="font-bold px-8 h-12">
            <Link href="/">Return Home</Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="font-bold px-8 h-12">
            <Link href="/blog">Read Impact Stories</Link>
          </Button>
        </div>
      </div>

      <div className="mt-16 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
        Kennesaw Mountain High School Beta • Service & Leadership
      </div>
    </div>
  );
}
