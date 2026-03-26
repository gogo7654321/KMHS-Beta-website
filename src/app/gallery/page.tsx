'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, where, deleteDoc, limit } from 'firebase/firestore';
import type { Admin, Album, Photo, Event } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AddEditAlbumDialog } from '@/components/gallery/add-edit-album-dialog';
import { BulkUploadDialog } from '@/components/gallery/bulk-upload-dialog';
import { AddEditPhotoDialog } from '@/components/gallery/add-edit-photo-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderPlus, Image as ImageIcon, ChevronLeft, Plus, Trash2, ZoomIn, PlayCircle, Calendar as CalendarIcon, ExternalLink, Heart, MessageSquare, Loader2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MediaSocialSection } from '@/components/gallery/media-social-section';

function AlbumCard({ album, onClick }: { album: Album; onClick: () => void }) {
  return (
    <Card 
        className="group cursor-pointer overflow-hidden border-border/60 bg-secondary/10 hover:border-primary/50 transition-all hover:shadow-lg"
        onClick={onClick}
    >
      <div className="relative aspect-video w-full bg-muted overflow-hidden">
        {album.coverImageUrl ? (
          <Image src={album.coverImageUrl} alt={album.title} fill className="object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-12 w-12" />
            <p className="text-xs mt-2 uppercase font-bold tracking-tighter">Empty Album</p>
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{album.title}</CardTitle>
        <CardDescription className="text-xs flex justify-between">
            <span>{album.createdAt ? format(new Date(album.createdAt), 'MMM d, yyyy') : 'Recently Created'}</span>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const albumId = searchParams.get('album');
  
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);
  const canManage = !!adminData || user?.email === 'npatel012010@gmail.com';

  const albumsQuery = useMemoFirebase(() => query(collection(firestore, 'albums'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: albums, isLoading: isAlbumsLoading } = useCollection<Album>(albumsQuery);

  const photosQuery = useMemoFirebase(() => 
    albumId ? query(collection(firestore, 'photos'), where('albumId', '==', albumId)) : null,
    [firestore, albumId]
  );
  const { data: photos, isLoading: isPhotosLoading } = useCollection<Photo>(photosQuery);

  // Get selected photo data in real-time for likes/comments
  const selectedPhotoRef = useMemoFirebase(() => selectedPhotoId ? doc(firestore, 'photos', selectedPhotoId) : null, [firestore, selectedPhotoId]);
  const { data: selectedPhoto } = useDoc<Photo>(selectedPhotoRef);

  const linkedEventQuery = useMemoFirebase(() => 
    albumId ? query(collection(firestore, 'events'), where('albumId', '==', albumId), limit(1)) : null,
    [firestore, albumId]
  );
  const { data: linkedEvents } = useCollection<Event>(linkedEventQuery);
  const linkedEvent = linkedEvents?.[0];

  const currentAlbum = albums?.find(a => a.id === albumId);

  const handleDeletePhoto = async (id: string) => {
    try {
        await deleteDoc(doc(firestore, 'photos', id));
        toast({ title: 'Item Deleted' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: e.message });
    }
  };

  const handleSetCover = async (imageUrl: string) => {
    if (!albumId) return;
    try {
        const { setDocumentNonBlocking } = await import('@/firebase/non-blocking-updates');
        setDocumentNonBlocking(doc(firestore, 'albums', albumId), { coverImageUrl: imageUrl }, { merge: true });
        toast({ title: 'Cover Updated', description: 'Album cover image set successfully.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  if (albumId) {
    return (
        <div className="container mx-auto px-4 py-12 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <Button variant="ghost" onClick={() => router.push('/gallery')} className="mb-4 gap-2 px-0 hover:bg-transparent text-muted-foreground hover:text-primary">
                        <ChevronLeft className="h-4 w-4" /> Back to Gallery
                    </Button>
                    <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">
                        {currentAlbum?.title || 'Album View'}
                    </h1>
                    <p className="mt-2 text-muted-foreground">{currentAlbum?.description || 'Photos and videos from this activity.'}</p>
                </div>
                {canManage && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <AddEditPhotoDialog albumId={albumId} mode="add" photoCount={photos?.length || 0}>
                            <Button variant="outline" className="flex-1 md:flex-none gap-2 font-bold">
                                <Plus className="h-4 w-4" /> Add Photo
                            </Button>
                        </AddEditPhotoDialog>
                        <BulkUploadDialog albumId={albumId}>
                            <Button className="flex-1 md:flex-none gap-2 font-bold">
                                <Plus className="h-4 w-4" /> Bulk Upload
                            </Button>
                        </BulkUploadDialog>
                    </div>
                )}
            </div>

            {linkedEvent && (
                <Card className="mb-8 border-primary/30 bg-primary/5">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Associated Event</p>
                                <h3 className="font-headline text-xl font-bold">{linkedEvent.title}</h3>
                                <p className="text-xs text-muted-foreground">{format(new Date(linkedEvent.dateTime), 'PPPP')}</p>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="font-bold gap-2">
                            <Link href="/events">
                                <ExternalLink className="h-4 w-4" />
                                Event Details
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isPhotosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)}
                </div>
            ) : photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.sort((a, b) => (a.order || 0) - (b.order || 0)).map(photo => (
                        <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-secondary/20 border border-border/40 cursor-pointer" onClick={() => setSelectedPhotoId(photo.id)}>
                            {photo.mediaType === 'video' ? (
                                <div className="relative h-full w-full bg-black flex items-center justify-center">
                                    <video src={photo.imageUrl} className="h-full w-full object-cover opacity-60" muted />
                                    <PlayCircle className="absolute h-12 w-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                                </div>
                            ) : (
                                <Image 
                                    src={photo.imageUrl} 
                                    alt="Gallery photo" 
                                    fill 
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="object-cover transition-transform group-hover:scale-105" 
                                />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                <div className="flex gap-4 mb-2">
                                    <div className="flex items-center gap-1 text-white text-xs font-bold">
                                        <Heart className="h-4 w-4 fill-primary text-primary" /> {photo.likes?.length || 0}
                                    </div>
                                    <div className="flex items-center gap-1 text-white text-xs font-bold">
                                        <MessageSquare className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                                <Button size="sm" variant="secondary" className="font-bold gap-2">
                                    <ZoomIn className="h-4 w-4" /> View
                                </Button>
                                {canManage && (
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <AddEditPhotoDialog albumId={albumId} mode="edit" photo={photo} photoCount={photos.length}>
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-white border-white/20">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </AddEditPhotoDialog>
                                        {photo.mediaType !== 'video' && (
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-white border-white/20" onClick={() => handleSetCover(photo.imageUrl)} title="Set as Album Cover">
                                                <ImageIcon className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDeletePhoto(photo.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-24 text-center border-2 border-dashed rounded-xl bg-secondary/5">
                    <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground font-medium">No photos or videos in this album yet.</p>
                </div>
            )}

            <Dialog open={!!selectedPhotoId} onOpenChange={() => setSelectedPhotoId(null)}>
                <DialogContent className="max-w-6xl h-[90vh] md:h-[80vh] bg-background border-primary/20 p-0 overflow-hidden flex flex-col md:flex-row">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Media Viewer</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-grow bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0">
                        {selectedPhoto ? (
                            selectedPhoto.mediaType === 'video' ? (
                                <video 
                                    src={selectedPhoto.imageUrl} 
                                    className="max-h-full max-w-full" 
                                    controls 
                                    autoPlay 
                                />
                            ) : (
                                <Image 
                                    src={selectedPhoto.imageUrl} 
                                    alt="Zoomed view" 
                                    fill 
                                    className="object-contain" 
                                    priority
                                />
                            )
                        ) : (
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        )}
                    </div>

                    <div className="w-full md:w-[350px] shrink-0 h-full overflow-hidden flex flex-col">
                        {selectedPhoto && <MediaSocialSection photo={selectedPhoto} />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl text-primary">Photo Gallery</h1>
          <p className="mt-4 max-w-[700px] text-muted-foreground md:text-xl">Memorable moments of service and leadership at Kennesaw Mountain High School.</p>
        </div>
        {canManage && (
            <AddEditAlbumDialog mode="add">
                <Button size="lg" className="w-full md:w-auto font-bold gap-2">
                    <FolderPlus className="h-5 w-5" /> New Album
                </Button>
            </AddEditAlbumDialog>
        )}
      </div>

      {isAlbumsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
          </div>
      ) : albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {albums.map(album => (
                  <AlbumCard 
                    key={album.id} 
                    album={album} 
                    onClick={() => router.push(`/gallery?album=${album.id}`)} 
                  />
              ))}
          </div>
      ) : (
          <div className="py-24 text-center border-2 border-dashed rounded-xl bg-secondary/5">
              <FolderPlus className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-xl text-muted-foreground font-medium">Our visual history starts here.</p>
              <p className="mt-2 text-sm text-muted-foreground">Create an album to share media from recent events.</p>
          </div>
      )}
    </div>
  );
}
