
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import type { Admin } from '@/lib/types';
import { placeholderImages } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function LeadershipSkeleton() {
  return (
    <Card className="group overflow-hidden rounded-lg bg-card text-center border">
      <div className="aspect-[4/5] w-full overflow-hidden bg-secondary">
        <Skeleton className="h-full w-full" />
      </div>
      <CardHeader>
        <Skeleton className="mx-auto h-6 w-3/4" />
        <Skeleton className="mx-auto mt-2 h-4 w-1/2" />
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mx-auto mt-4 h-3 w-1/4" />
      </CardContent>
    </Card>
  );
}

function AdminCard({ admin, isDraggable }: { admin: Admin; isDraggable: boolean }) {
  const defaultAvatar = placeholderImages.find(p => p.id === 'default-avatar');
  const isSuperAdmin = admin.email === 'npatel012010@gmail.com';

  const fullName = `${admin.firstName} ${admin.lastName}`;
  const position = admin.position;
  const bio = admin.bio || 'No bio available.';

  // Safety fallback for images to prevent renderer crashes
  const profileImage = admin.imageUrl || defaultAvatar?.imageUrl || 'https://placehold.co/400x500?text=Portrait';

  let hostname: string | null = null;
  if (isSuperAdmin && admin.personalUrl) {
    try {
      hostname = new URL(admin.personalUrl).hostname;
    } catch (e) {
      // Quietly handle invalid URLs
    }
  }

  return (
    <Card className={cn(
      "group relative flex flex-col overflow-hidden rounded-lg bg-card text-center transition-all duration-300 border",
      "hover:shadow-primary/20 hover:-translate-y-2",
      isSuperAdmin && "shadow-[0_0_20px_5px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_10px_rgba(59,130,246,0.5)]"
    )}>
      {isDraggable && (
        <div className="absolute top-2 right-2 cursor-grab touch-none text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100 z-10">
          <GripVertical className="h-5 w-5" />
        </div>
      )}
      <div className="aspect-[4/5] w-full overflow-hidden bg-secondary relative">
        <Image
          src={profileImage}
          alt={`Portrait of ${fullName}`}
          data-ai-hint="professional headshot"
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle className={cn(
          "font-headline text-xl font-bold text-foreground min-h-[28px] flex justify-center items-center",
          isSuperAdmin && "bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        )}>
          {fullName}
        </CardTitle>
        <CardDescription className="font-semibold text-primary min-h-[24px] flex justify-center items-center">
          {position}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col px-6 pb-6">
        <p className="flex-grow text-sm text-muted-foreground min-h-[50px]">
          {bio}
        </p>
        {admin.grade && (
          <p className="mt-4 text-xs font-bold text-foreground/90 uppercase tracking-widest">
            Grade {admin.grade}
          </p>
        )}
        {isSuperAdmin && admin.personalUrl && (
          <Button asChild className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 font-headline font-bold tracking-wide text-primary-foreground">
            <Link href={admin.personalUrl} target="_blank" rel="noopener noreferrer">
              {hostname ? (
                /* Using plain <img> for dynamic favicon to prevent Next.js image optimization crashes on external domains */
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                  alt={`${hostname} favicon`}
                  width={16}
                  height={16}
                  className="mr-2 h-4 w-4 rounded-sm"
                />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              View Portfolio
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function SortableAdminCard({ admin }: { admin: Admin }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: admin.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AdminCard admin={admin} isDraggable={true} />
    </div>
  );
}

export default function LeadershipPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const adminsCollectionRef = useMemoFirebase(() => collection(firestore, 'admin'), [firestore]);
  const { data: admins, isLoading } = useCollection<Admin>(adminsCollectionRef);

  const [adminItems, setAdminItems] = useState<Admin[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (admins) {
      const sorted = [...admins].sort((a, b) => (a.order ?? admins.length) - (b.order ?? admins.length));
      setAdminItems(sorted);
      setHasChanges(false);
    }
  }, [admins]);

  const isSuperAdminViewer = user?.email === 'npatel012010@gmail.com';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAdminItems(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        setHasChanges(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function handleSaveOrder() {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    adminItems.forEach((admin, index) => {
      const adminRef = doc(firestore, 'admin', admin.id);
      batch.update(adminRef, { order: index });
    });

    try {
      await batch.commit();
      toast({ title: 'Success', description: 'Leadership order has been saved.' });
      setHasChanges(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
          Kennesaw Mountain High School Beta Leadership
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Meet the dedicated students and faculty advisors leading our Kennesaw Mountain High School chapter.
        </p>
      </div>

      {isSuperAdminViewer && hasChanges && (
        <div className="mb-8 flex justify-center">
          <Button size="lg" onClick={handleSaveOrder} className="font-bold">
            Save New Order
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <LeadershipSkeleton key={i} />)
        ) : adminItems.length > 0 ? (
          isSuperAdminViewer ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={adminItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                {adminItems.map(admin => (
                  <SortableAdminCard key={admin.id} admin={admin} />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            adminItems.map(admin => <AdminCard key={admin.id} admin={admin} isDraggable={false} />)
          )
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl">
            <p className="text-xl text-muted-foreground font-medium">No leadership members listed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
