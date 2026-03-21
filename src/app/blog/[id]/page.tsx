
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Image from 'next/image';
import { ChevronLeft, Calendar, User, Tag } from 'lucide-react';

export default function BlogPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const blogRef = useMemoFirebase(() => id ? doc(firestore, 'blogs', id as string) : null, [firestore, id]);
  const { data: post, isLoading } = useDoc<BlogPost>(blogRef);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-96 w-full mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
      </div>
    );
  }

  if (!post || post.status === 'draft') {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-2xl font-bold">Article Not Found</h1>
        <p className="mt-2 text-muted-foreground">This story might have been removed or is still in drafting.</p>
        <Button onClick={() => router.push('/blog')} className="mt-6">Back to Blog</Button>
      </div>
    );
  }

  return (
    <article className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/blog')} className="mb-8 gap-2 group">
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Stories
      </Button>

      <div className="mb-10 space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-6 text-muted-foreground border-y border-border/50 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {format(new Date(post.createdAt), 'MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {post.imageUrl && (
        <figure className="mb-12 space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-primary/20 bg-muted shadow-2xl">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
          </div>
          {post.imageCaption && (
            <figcaption className="text-center text-sm italic text-muted-foreground">
              {post.imageCaption}
            </figcaption>
          )}
        </figure>
      )}

      <div className="prose prose-invert prose-primary max-w-none">
        <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/90 font-body">
          {post.content}
        </div>
      </div>

      <div className="mt-20 border-t border-border/50 pt-12 text-center">
        <h2 className="font-headline text-2xl font-bold mb-4">Proudly represented by</h2>
        <p className="text-primary font-headline text-xl font-bold">Kennesaw Mountain High School Beta</p>
        <p className="text-muted-foreground text-sm mt-2">Leading by Serving Others</p>
        <Button onClick={() => router.push('/blog')} className="mt-8">View More Stories</Button>
      </div>
    </article>
  );
}
