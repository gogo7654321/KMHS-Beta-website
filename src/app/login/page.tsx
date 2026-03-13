
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, ArrowRight } from 'lucide-react';

export default function LoginSelectionPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">Select Portal</h1>
        <p className="mt-4 text-muted-foreground md:text-xl">Choose your account type to access KMHS Beta tools.</p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="group relative flex flex-col border-2 border-primary/20 transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
              <User className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Member</CardTitle>
            <CardDescription>Chapter students and service hour logging.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow text-center text-muted-foreground">
            <p>Log your community service hours and view upcoming project history.</p>
          </CardContent>
          <CardFooter className="pt-6">
            <Button asChild className="w-full group/btn font-bold">
              <Link href="/login/member">
                Member Log In
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="group relative flex flex-col border-2 border-primary/20 transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Shield className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Administrator</CardTitle>
            <CardDescription>Faculty advisors and club leadership.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow text-center text-muted-foreground">
            <p>Approve service logs, manage members, and post new club events.</p>
          </CardContent>
          <CardFooter className="pt-6">
            <Button asChild className="w-full group/btn font-bold">
              <Link href="/login/admin">
                Admin Log In
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-12">
        <Button variant="ghost" asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
