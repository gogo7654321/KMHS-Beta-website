
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LoginSelectionPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">Loading...</div>;
  }

  if (user) {
    router.push('/admin');
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">Welcome Back</h1>
        <p className="mt-4 text-muted-foreground md:text-xl">Please select your account type to continue.</p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {/* Member Choice */}
        <Card className="group relative flex flex-col border-2 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
              <User className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Member</CardTitle>
            <CardDescription>Chapter students and service hour tracking.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow text-center text-muted-foreground">
            <p>Access your service hours, RSVPs, and member-only resources.</p>
          </CardContent>
          <CardFooter className="pt-6">
            <div className="flex w-full flex-col items-center gap-3">
              <Button variant="secondary" className="w-full gap-2 opacity-50 cursor-not-allowed" disabled>
                Member Log In
                <Clock className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="animate-pulse bg-amber-400/10 text-amber-500 border-amber-500/50 px-4 py-1">
                Coming Soon
              </Badge>
            </div>
          </CardFooter>
        </Card>

        {/* Admin Choice */}
        <Card className="group relative flex flex-col border-2 border-primary/20 transition-all hover:border-primary hover:shadow-xl hover:shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Shield className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Administrator</CardTitle>
            <CardDescription>Faculty advisors and chapter leadership.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow text-center text-muted-foreground">
            <p>Manage events, approve service hours, and update chapter content.</p>
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
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
