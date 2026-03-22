'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { benefits } from '@/lib/data';
import { MoveRight, Megaphone, Instagram, Camera } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import type { Admin, HomePageContent, BlogPost } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AnnouncementEditor } from '@/components/home/announcement-editor';
import Image from 'next/image';
import { format } from 'date-fns';

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
    return null;
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

function RecentStories() {
  const firestore = useFirestore();
  const storiesQuery = useMemoFirebase(() =>
    query(collection(firestore, 'blogs'), orderBy('createdAt', 'desc'), limit(6)),
    [firestore]
  );
  const { data: allStories, isLoading } = useCollection<BlogPost>(storiesQuery);
  const publishedStories = allStories?.filter(s => s.status === 'published').slice(0, 3);

  if (isLoading) {
    return (
      <section className="w-full py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 bg-card/50"><Skeleton className="h-full w-full" /></Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!publishedStories || publishedStories.length === 0) return null;

  return (
    <section className="w-full py-20 bg-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
          <div className="text-center md:text-left">
            <h2 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">Recent Stories</h2>
            <p className="mt-4 text-muted-foreground text-sm md:text-base">Impact highlights from Kennesaw Mountain High School Beta.</p>
          </div>
          <Button asChild variant="outline" className="font-bold group border-primary/50 text-primary hover:bg-primary/5">
            <Link href="/blog">View All Posts <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {publishedStories.map((post) => (
            <Link href={`/blog/${post.id}`} key={post.id} className="group">
              <Card className="h-full overflow-hidden border-border/50 bg-background transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {post.imageUrl ? (
                    <Image src={post.imageUrl} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary"><Megaphone className="h-12 w-12 text-muted-foreground opacity-20" /></div>
                  )}
                </div>
                <CardHeader className="p-6">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-primary mb-2">{post.tags?.[0] || 'Chapter News'}</div>
                  <CardTitle className="line-clamp-2 font-headline text-xl leading-tight group-hover:text-primary transition-colors">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                   <p className="line-clamp-2 text-sm text-muted-foreground mb-4 opacity-80">{post.content.replace(/[#*`]/g, '').substring(0, 100)}...</p>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 border-t border-border/50 pt-4">{format(new Date(post.createdAt), 'MMMM d, yyyy')}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstagramHighlights() {
  const igPhotos = [
    { id: 1, url: 'https://picsum.photos/seed/ig1/600/600', hint: 'student volunteering' },
    { id: 2, url: 'https://picsum.photos/seed/ig2/600/600', hint: 'chapter meeting' },
    { id: 3, url: 'https://picsum.photos/seed/ig3/600/600', hint: 'service project' },
    { id: 4, url: 'https://picsum.photos/seed/ig4/600/600', hint: 'awards ceremony' },
    { id: 5, url: 'https://picsum.photos/seed/ig5/600/600', hint: 'school spirit' },
    { id: 6, url: 'https://picsum.photos/seed/ig6/600/600', hint: 'community impact' },
  ];

  return (
    <section className="w-full py-20 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary mb-4">
            <Instagram className="h-6 w-6" />
          </div>
          <h2 className="font-headline text-4xl font-bold tracking-tighter">Instagram Highlights</h2>
          <p className="mt-4 text-muted-foreground">Follow our journey @kmhsbetaclub for real-time impact.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {igPhotos.map((photo) => (
            <a key={photo.id} href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-md">
              <Image src={photo.url} alt="Instagram Post" fill sizes="(max-width: 768px) 50vw, 16vw" data-ai-hint={photo.hint} className="object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                <Camera className="text-white h-8 w-8" />
              </div>
            </a>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild size="lg" className="font-bold">
            <a href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer">View Full Feed</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      <AnnouncementBar />
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-background to-secondary pt-32 pb-40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-primary-foreground">
            <h2 className="font-headline text-lg font-bold tracking-widest text-primary/80 uppercase mb-4">Kennesaw Mountain High School</h2>
            <h1 className="font-headline text-6xl font-black tracking-tighter text-primary sm:text-8xl lg:text-9xl drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]">BETA CLUB</h1>
            <p className="mt-4 max-w-3xl text-lg font-semibold text-foreground/90 md:text-xl">Lead by Serving Others.</p>
            <p className="mt-2 max-w-2xl text-md text-foreground/70 md:text-lg">Fostering academic achievement, character, leadership, and service within the Kennesaw Mountain community.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="group text-lg font-bold"><Link href="/events">Explore Events <MoveRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" /></Link></Button>
              <Button asChild variant="outline" size="lg" className="group text-lg border-primary text-primary hover:bg-primary/10 font-bold"><a href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer">Follow Us <Instagram className="ml-2 h-5 w-5" /></a></Button>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      <section id="benefits" className="w-full py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center">
            <h2 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Why Join Beta?</h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">Unlock your potential and make a difference at Kennesaw Mountain High School.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="group flex flex-col items-center overflow-hidden border-border/80 bg-card text-center transition-all duration-300 hover:border-primary/80 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                  <CardHeader className="items-center pt-8">
                    <div className="mb-4 rounded-full border-4 border-primary/20 bg-secondary p-5 text-primary transition-all duration-300 group-hover:bg-primary/10 group-hover:border-primary/50"><Icon className="h-10 w-10 transition-transform duration-300 group-hover:scale-110" /></div>
                    <CardTitle className="font-headline text-2xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8"><p className="text-muted-foreground">{benefit.description}</p></CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <RecentStories />
      <InstagramHighlights />
    </div>
  );
}
