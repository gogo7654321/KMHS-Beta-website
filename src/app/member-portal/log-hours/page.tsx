'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function LogHoursPage() {
  return (
    <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center text-center">
      <div className="mb-6 w-full max-w-[600px] text-left">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/member-portal">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <div className="max-w-[600px] w-full border-2 border-dashed border-primary/20 rounded-xl p-12 bg-secondary/5">
        <Clock className="h-20 w-20 text-primary mx-auto mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold font-headline mb-4">Hour Logging Coming Soon</h1>
        <p className="text-muted-foreground text-lg mb-10">
          We are currently finalizing the verification workflow. Check back soon to start logging your individual service hours!
        </p>
        <Button asChild size="lg" className="font-bold">
          <Link href="/member-portal">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
