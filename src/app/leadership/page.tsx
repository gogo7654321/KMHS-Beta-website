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
    <Card className="group overflow-hidden rounded-lg bg-card text-center">
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
  const studizillaText = "Studizilla";

  // State for animations
  const [typedName, setTypedName] = useState(isSuperAdmin ? '' : fullName);
  const [typedPosition, setTypedPosition] = useState(isSuperAdmin ? '' : position);
  const [typedBio, setTypedBio] = useState(isSuperAdmin ? '' : bio);
  const [typedStudizilla, setTypedStudizilla] = useState(isSuperAdmin ? '' : studizillaText);

  // Animation phase control
  const [nameFinished, setNameFinished] = useState(!isSuperAdmin);
  const [positionFinished, setPositionFinished] = useState(!isSuperAdmin);
  const [bioFinished, setBioFinished] = useState(!isSuperAdmin);

  // Typing effect for Name
  useEffect(() => {
    if (isSuperAdmin && !nameFinished) {
      const nameInterval = setInterval(() => {
        setTypedName((current) => {
          if (current.length < fullName.length) {
            return fullName.substring(0, current.length + 1);
          }
          clearInterval(nameInterval);
          setNameFinished(true);
          return fullName;
        });
      }, 75);
      return () => clearInterval(nameInterval);
    }
  }, [isSuperAdmin, fullName, nameFinished]);

  // Typing effect for Position
  useEffect(() => {
    if (isSuperAdmin && nameFinished && !positionFinished) {
      const posInterval = setInterval(() => {
        setTypedPosition((current) => {
          if (current.length < position.length) {
            return position.substring(0, current.length + 1);
          }
          clearInterval(posInterval);
          setPositionFinished(true);
          return position;
        });
      }, 60);
      return () => clearInterval(posInterval);
    }
  }, [isSuperAdmin, nameFinished, position, positionFinished]);

    // Typing effect for Bio
  useEffect(() => {
    if (isSuperAdmin && positionFinished && !bioFinished) {
        const bioInterval = setInterval(() => {
            setTypedBio((current) => {
                if (current.length < bio.length) {
                    return bio.substring(0, current.length + 1);
                }
                clearInterval(bioInterval);
                setBioFinished(true);
                return bio;
            });
        }, 20); // Faster typing for bio
        return () => clearInterval(bioInterval);
    }
  }, [isSuperAdmin, positionFinished, bio, bioFinished]);

  // Typing effect for "Studizilla" button
  useEffect(() => {
    if (isSuperAdmin && bioFinished) {
      const studizillaInterval = setInterval(() => {
        setTypedStudizilla((current) => {
          if (current.length < studizillaText.length) {
            return studizillaText.substring(0, current.length + 1);
          }
          clearInterval(studizillaInterval);
          return studizillaText;
        });
      }, 100);
      return () => clearInterval(studizillaInterval);
    }
  }, [isSuperAdmin, bioFinished]);


  let hostname: string | null = null;
  if (isSuperAdmin && admin.personalUrl) {
    try {
      hostname = new URL(admin.personalUrl).hostname;
    } catch (e) {
      console.error("Invalid personal URL for admin:", admin.email);
    }
  }

  const BlinkingCursor = ({ active, className }: { active: boolean, className?: string }) => 
    active ? <span className={cn("inline-block w-0.5 animate-pulse bg-blue-400", className)} /> : null;
  
  // Determine cursor visibility for each phase
  const showNameCursor = isSuperAdmin && !nameFinished;
  const showPositionCursor = isSuperAdmin && nameFinished && !positionFinished;
  const showBioCursor = isSuperAdmin && positionFinished && !bioFinished;
  const showStudizillaCursor = isSuperAdmin && bioFinished && typedStudizilla.length < studizillaText.length;

  return (
    <Card className={cn(
      "group relative flex flex-col overflow-hidden rounded-lg bg-card text-center transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-2",
      "opacity-0 animate-fade-in",
      !isSuperAdmin && "[animation-delay:500ms]",
      isSuperAdmin && "shadow-[0_0_35px_8px_#3b82f6bf] transition-shadow duration-300 hover:shadow-[0_0_50px_15px_#3b82f6]"
    )}>
      {isDraggable && (
        <div className="absolute top-2 right-2 cursor-grab touch-none text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100">
          <GripVertical />
        </div>
      )}
      <div className={cn(
        "aspect-[4/5] w-full overflow-hidden bg-secondary"
      )}>
        <Image
          src={admin.imageUrl || defaultAvatar?.imageUrl || ''}
          alt={`Portrait of ${admin.firstName} ${admin.lastName}`}
          data-ai-hint="professional headshot"
          width={400}
          height={500}
          quality={100}
          priority={isSuperAdmin}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardHeader>
        <CardTitle className={cn(
          "font-headline text-xl font-bold text-foreground min-h-[28px] flex justify-center items-center",
          isSuperAdmin && "bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
        )}>
          {typedName}
          <BlinkingCursor active={showNameCursor} className="h-6 ml-1" />
        </CardTitle>
        <CardDescription className={cn(
          "font-semibold text-primary min-h-[24px] flex justify-center items-center",
        )}>
          {typedPosition}
          <BlinkingCursor active={showPositionCursor} className="h-5 ml-1" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col px-6 pb-6">
        <p className="flex-grow text-sm text-muted-foreground min-h-[50px]">
            {typedBio}
            <BlinkingCursor active={showBioCursor} className="h-4 ml-1" />
        </p>
        <p className="mt-4 text-xs font-bold text-foreground/90">Grade: {admin.grade}</p>
        {isSuperAdmin && admin.personalUrl && (
          <Button asChild className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 font-headline font-bold tracking-wide text-base text-primary-foreground opacity-90 hover:opacity-100 transition-opacity">
            <Link href={admin.personalUrl} target="_blank" rel="noopener noreferrer">
              {hostname ? (
                <Image 
                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                  alt={`${hostname} favicon`}
                  width={16}
                  height={16}
                  quality={100}
                  className="mr-2 h-4 w-4 rounded-sm"
                />
              ) : (
                <LinkIcon className="mr-2 h-4 w-4" />
              )}
              {typedStudizilla}
              <BlinkingCursor active={showStudizillaCursor} className="h-5 ml-1" />
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

  const content = () => {
    if (isLoading) {
      return Array.from({ length: 6 }).map((_, i) => <LeadershipSkeleton key={i} />);
    }
    if (!adminItems?.length) {
      return (
        <div className="col-span-full py-16 text-center">
          <p className="text-xl text-muted-foreground">Leadership information is not yet available.</p>
        </div>
      );
    }

    if (isSuperAdminViewer) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={adminItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {adminItems.map(admin => (
              <SortableAdminCard key={admin.id} admin={admin} />
            ))}
          </SortableContext>
        </DndContext>
      );
    }

    return adminItems.map(admin => <AdminCard key={admin.id} admin={admin} isDraggable={false} />);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
          Our Leadership Team
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
          Meet the dedicated students and faculty advisors leading our chapter to success.
        </p>
      </div>

      {isSuperAdminViewer && hasChanges && (
        <div className="mb-8 flex justify-center">
          <Button size="lg" onClick={handleSaveOrder}>
            Save Order
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">{content()}</div>
    </div>
  );
}
