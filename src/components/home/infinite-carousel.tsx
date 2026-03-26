'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Photo } from '@/lib/types';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon } from 'lucide-react';

export function InfiniteCarousel() {
  const firestore = useFirestore();
  
  // Fetch recent photos for the carousel
  const photosQuery = useMemoFirebase(
    () => query(collection(firestore, 'photos'), orderBy('createdAt', 'desc'), limit(15)),
    [firestore]
  );
  
  const { data: photos, isLoading } = useCollection<Photo>(photosQuery);

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden bg-secondary/5 py-12 border-y border-border/40">
        <div className="flex gap-6 px-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64 w-80 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Filter for only images
  const imagePhotos = photos?.filter(p => p.mediaType === 'image') || [];
  
  // If no photos exist yet, show a subtle placeholder or return null
  if (imagePhotos.length === 0) {
    return (
      <div className="w-full bg-secondary/5 py-16 border-y border-border/40 flex flex-col items-center justify-center text-muted-foreground/30">
        <ImageIcon className="h-12 w-12 mb-2" />
        <p className="text-xs uppercase font-bold tracking-widest">Gallery empty — Upload photos to see them here</p>
      </div>
    );
  }

  // Repeat the photos to ensure the marquee loop is seamless even on large screens
  const carouselItems = [...imagePhotos, ...imagePhotos, ...imagePhotos];

  return (
    <div className="relative w-full overflow-hidden bg-secondary/5 py-12 border-y border-border/40">
      <div className="flex w-max animate-marquee gap-6 px-6 hover:[animation-play-state:paused]">
        {carouselItems.map((photo, index) => (
          <div
            key={`${photo.id}-${index}`}
            className="group relative h-64 w-80 shrink-0 overflow-hidden rounded-xl border-2 border-border/40 shadow-lg transition-all duration-500 hover:border-primary/50 hover:shadow-primary/10 bg-muted"
          >
            <Image
              src={photo.imageUrl}
              alt={photo.title || 'KMHS Beta Gallery'}
              fill
              sizes="320px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              style={{ transform: photo.rotation ? `rotate(${photo.rotation}deg)` : undefined }}
            />
            {photo.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest line-clamp-1">{photo.title}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Edge gradients for a professional fade effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10" />
    </div>
  );
}
