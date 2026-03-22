'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { BlogPost } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Calendar, User } from 'lucide-react';

export default function BlogPage() {
  const firestore = useFirestore();
  
  const blogsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'blogs'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  
  const { data: allBlogs, isLoading } = useCollection<BlogPost>(blogsQuery);

  const blogs = allBlogs?.filter(post => post.status === 'published');

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-primary">
          Impact Stories
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Stories, updates, and community impact from Kennesaw Mountain High School Beta members.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : blogs && blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((post) => (
            <Link href={`/blog/${post.id}`} key={post.id} className="group">
              <Card className="h-full overflow-hidden border-border/50 bg-secondary/10 transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <Calendar className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                  {post.tags?.[0] && (
                    <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">
                      {post.tags[0]}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.createdAt), 'MMMM d, yyyy')}
                  </div>
                  <CardTitle className="line-clamp-2 font-headline group-hover:text-primary">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-3 text-sm text-muted-foreground mb-4 opacity-80">
                    {post.content.replace(/[#*`]/g, '').substring(0, 150)}...
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-primary">
                    <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.authorName}
                    </span>
                    <span className="flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed rounded-xl bg-secondary/5">
          <p className="text-xl text-muted-foreground font-medium">Our first story is being written.</p>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon for chapter updates!</p>
        </div>
      )}
    </div>
  );
}