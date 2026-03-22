'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
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
  rectSortingStrategy,
} from '@radix-ui/react-sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Admin, Photo, PhotoCategory } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { AddEditPhotoDialog } from '@/components/gallery/add-edit-photo-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, PlusCircle, ZoomIn, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


const photoCategories: ['All', ...PhotoCategory[]] = ['All', 'Service', 'Academics', 'Social', 'Ceremonies'];

function ClientDateTime({ dateTime, formatStr, className, tag: Tag = 'span' }: { dateTime: string, formatStr: string, className?: string, tag?: 'span' | 'div' }) {
    const [formatted, setFormatted] = useState<string | null>(null);
    useEffect(() => {
        setFormatted(format(new Date(dateTime), formatStr));
    }, [dateTime, formatStr]);

    if (!formatted) {
        return <Skeleton className={cn("h-4 w-24", className)} />;
    }
    return <Tag className={className}>{formatted}</Tag>;
}


function PhotoCard({ photo, canManage, onSelect }: { photo: Photo, canManage: boolean, onSelect: (photo: Photo) => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = useStorage();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(firestore, 'photos', photo.id));
      if (photo.imageUrl && photo.imageUrl.includes('firebasestorage.googleapis.com')) {
        const imageRef = ref(storage, photo.imageUrl);
        await deleteObject(imageRef);
      }
      toast({ title: 'Photo Deleted', description: `"${photo.title}" has been removed.` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
    }
  };

  return (
    <Card className="group relative flex flex-col overflow-hidden rounded-lg border-border/80 bg-background text-card-foreground transition-all duration-300 hover:shadow-primary/10 hover:-translate-y-1">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {canManage && (
          <>
            <AddEditPhotoDialog mode="edit" photo={photo} photoCount={0}>
              <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><Pencil className="h-4 w-4" /></Button>
            </AddEditPhotoDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete the photo &quot;{photo.title}&quot;. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <div className="relative aspect-square w-full cursor-pointer overflow-hidden" onClick={() => onSelect(photo)}>
        <Image 
          src={photo.imageUrl} 
          alt={photo.description || photo.title} 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
          className="object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ZoomIn className="h-8 w-8 text-primary" />
        </div>
      </div>
       <CardContent className="p-4 flex-grow">
          <h3 className="font-semibold leading-snug tracking-tight truncate group-hover:text-primary">
              {photo.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{photo.description}</p>
      </CardContent>
    </Card>
  );
}


function SortablePhotoCard({ photo, canManage, onSelect }: { photo: Photo, canManage: boolean, onSelect: (photo: Photo) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative group/sortable">
        <PhotoCard photo={photo} canManage={canManage} onSelect={onSelect} />
        {canManage && (
          <div {...attributes} {...listeners} className="absolute -top-2 -right-2 z-20 cursor-grab touch-none rounded-full bg-primary p-2 text-primary-foreground opacity-0 transition-opacity group-hover/sortable:opacity-100">
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}


export default function GalleryPage() {
  const [filter, setFilter] = useState<typeof photoCategories[number]>('All');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [photoItems, setPhotoItems] = useState<Photo[]>([]);

  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);
  const canManage = !!adminData || user?.email === 'npatel012010@gmail.com';

  const photosQuery = useMemoFirebase(() => query(collection(firestore, 'photos'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: photos, isLoading } = useCollection<Photo>(photosQuery);
  
  useEffect(() => {
    if (photos) {
      const sorted = [...photos].sort((a, b) => (a.order ?? photos.length) - (b.order ?? photos.length));
      setPhotoItems(sorted);
      setHasChanges(false);
    }
  }, [photos]);

  const filteredPhotos = photoItems.filter(photo => filter === 'All' || photo.category === filter);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPhotoItems(items => {
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
    photoItems.forEach((photo, index) => {
      const photoRef = doc(firestore, 'photos', photo.id);
      batch.update(photoRef, { order: index });
    });

    try {
      await batch.commit();
      toast({ title: 'Success', description: 'Photo order has been saved.' });
      setHasChanges(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  const renderGrid = () => {
    if (isLoading) {
      return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
      );
    }
    if (filteredPhotos.length === 0) {
       return (
        <div className="py-16 text-center">
            <p className="text-xl text-muted-foreground">No photos in this category yet.</p>
             {canManage && filter === 'All' && (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/20 p-12 text-center">
                    <Camera className="h-16 w-16 text-primary" />
                    <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">No Photos Yet</h2>
                    <p className="mt-2 text-muted-foreground">Click 'Add Photo' to get started.</p>
                </div>
            )}
        </div>
      );
    }

    if (canManage) {
        return (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredPhotos.map(p => p.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredPhotos.map(photo => (
                            <SortablePhotoCard key={photo.id} photo={photo} canManage={canManage} onSelect={setSelectedPhoto} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} canManage={false} onSelect={setSelectedPhoto} />
            ))}
        </div>
    );
  }

  return (
    <>
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="flex flex-col items-center justify-between gap-4 mb-8 text-center sm:flex-row sm:text-left">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">Photo Gallery</h1>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">A glimpse into our activities, achievements, and memorable moments at Kennesaw Mountain High School.</p>
        </div>
        <div className="flex gap-2">
            {canManage && hasChanges && (
                <Button size="lg" onClick={handleSaveOrder}>Save Order</Button>
            )}
            {canManage && (
                <AddEditPhotoDialog mode="add" photoCount={photos?.length || 0}>
                    <Button size="lg"><PlusCircle className="mr-2 h-5 w-5" />Add Photo</Button>
                </AddEditPhotoDialog>
            )}
        </div>
      </div>
      
      <Tabs defaultValue="All" onValueChange={(value) => setFilter(value as typeof photoCategories[number])} className="w-full">
        <div className="flex justify-center">
          <TabsList className="mb-8 grid grid-cols-3 bg-card sm:grid-cols-5 h-auto p-1">
            {photoCategories.map(type => <TabsTrigger key={type} value={type} className="py-2">{type}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value={filter} forceMount>{renderGrid()}</TabsContent>
      </Tabs>
    </div>

    <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
      <DialogContent className="max-w-5xl border-primary/50 bg-background/80 p-2 backdrop-blur-md">
        <DialogHeader>
            <DialogTitle>{selectedPhoto?.title || 'Photo View'}</DialogTitle>
        </DialogHeader>
        {selectedPhoto && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="relative lg:col-span-2">
                  <Image src={selectedPhoto.imageUrl} alt={selectedPhoto.title} width={1600} height={1200} className="max-h-[85vh] w-full rounded-md object-contain" />
              </div>
              <div className="flex flex-col p-4">
                  <h3 className="text-2xl font-bold">{selectedPhoto.title}</h3>
                  <p className="mt-2 text-sm text-white/90">{selectedPhoto.description}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                      <Badge variant="secondary">{selectedPhoto.category}</Badge>
                      <ClientDateTime dateTime={selectedPhoto.createdAt} formatStr="PPP" />
                  </div>
                  {selectedPhoto.names && selectedPhoto.names.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold text-white">In this photo:</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedPhoto.names.map(name => <Badge key={name}>{name}</Badge>)}
                        </div>
                    </div>
                  )}
              </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
