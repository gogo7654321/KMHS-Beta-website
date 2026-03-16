'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { benefits } from '@/lib/data';
import { MoveRight, Megaphone, Instagram } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Admin, HomePageContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnouncementEditor } from '@/components/home/announcement-editor';

function AnnouncementBar() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  const announcementDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'home'), [firestore]);
  const { data: announcementData, isLoading: isAnnouncementLoading } = useDoc<HomePageContent>(announcementDocRef);
  
  const isLoading = isUserLoading || isAdminLoading || isAnnouncementLoading;

  const announcementText = announcementData?.announcementText;
  const isSuperAdmin = user?.email === 'npatel012010@gmail.com';
  const canEdit = !!adminData || isSuperAdmin;
  
  const hasContent = announcementText && announcementText.trim() !== '';

  if (isLoading) {
    return (
      <div className="border-b border-primary/20 bg-primary/10">
        <div className="container mx-auto flex min-h-[52px] items-center justify-center gap-4 px-4 py-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!hasContent && !canEdit) {
    return null; // Don't show the bar if there's no text and user can't edit
  }

  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="container mx-auto flex min-h-[52px] items-center justify-center gap-4 px-4 py-3">
        <Megaphone className="h-5 w-5 flex-shrink-0 text-primary" />
        <p className="flex-grow text-center text-sm font-medium text-foreground">
          {hasContent ? announcementText : (canEdit ? 'No announcement set. Click edit to add one.' : '')}
        </p>
        {canEdit && (
          <div className="ml-auto flex-shrink-0">
            <AnnouncementEditor initialContent={announcementText || ''} />
          </div>
        )}
      </div>
    </div>
  );
}


export default function Home() {
  return (
    <div className="flex flex-col">
      <AnnouncementBar />
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-background to-secondary pt-32 pb-40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-primary-foreground">
            <h1 className="font-headline text-5xl font-black tracking-tighter text-primary sm:text-7xl lg:text-8xl xl:text-9xl drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]">
              KMHS BETA
            </h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold text-foreground/90 md:text-xl">
              Lead by Serving Others.
            </p>
            <p className="mt-2 max-w-2xl text-md text-foreground/70 md:text-lg">
              Fostering academic achievement, character, leadership, and service within our community.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="group text-lg">
                <Link href="/events">
                  Explore Events <MoveRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="group text-lg border-primary text-primary hover:bg-primary/10">
                <a href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer">
                  Follow Us <Instagram className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section id="benefits" className="w-full py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Why Join Beta?
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              Unlock your potential and make a difference.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="group flex flex-col items-center overflow-hidden border-border/80 bg-card text-center transition-all duration-300 hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                  <CardHeader className="items-center pt-8">
                    <div className="mb-4 rounded-full border-4 border-primary/20 bg-secondary p-5 text-primary transition-all duration-300 group-hover:bg-primary/10 group-hover:border-primary/50">
                      <Icon className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <CardTitle className="font-headline text-2xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8">
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Call to Action */}
      <section className="w-full py-20 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 text-primary mb-6">
            <Instagram className="h-8 w-8" />
          </div>
          <h2 className="font-headline text-3xl font-bold mb-4">Stay Connected</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Don't miss out on chapter updates, event photos, and community service highlights. Follow our journey on Instagram.
          </p>
          <Button asChild size="lg" className="font-bold">
            <a href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer">
              Follow @kmhsbetaclub
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
