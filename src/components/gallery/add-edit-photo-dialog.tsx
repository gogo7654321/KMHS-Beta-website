'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useStorage, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Photo, PhotoCategory, GallerySettings } from '@/lib/types';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { ImageCropper } from '@/components/ui/image-cropper';

const photoCategories: PhotoCategory[] = ['Service', 'Academics', 'Social', 'Ceremonies'];

const createPhotoFormSchema = (settings?: GallerySettings) => z.object({
  title: settings?.isTitleRequired
    ? z.string().min(2, 'Title is required and must be at least 2 characters.')
    : z.string().optional(),
  description: settings?.isDescriptionRequired
    ? z.string().min(10, 'Description is required and must be at least 10 characters.')
    : z.string().optional(),
  category: z.enum(photoCategories, { required_error: 'Category is required.' }),
  names: settings?.isNamesRequired
    ? z.string().min(1, 'At least one name is required.')
    : z.string().optional(),
  image: z.any().optional(),
});

type PhotoFormValues = z.infer<ReturnType<typeof createPhotoFormSchema>>;

interface AddEditPhotoDialogProps {
  albumId: string;
  mode: 'add' | 'edit';
  photo?: Photo;
  children: React.ReactNode;
  photoCount: number;
}

export function AddEditPhotoDialog({ albumId, mode, photo, children, photoCount }: AddEditPhotoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'gallerySettings'), [firestore]);
  const { data: gallerySettings } = useDoc<GallerySettings>(settingsDocRef);
  
  const photoFormSchema = useMemo(() => createPhotoFormSchema(gallerySettings ?? undefined), [gallerySettings]);

  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema),
  });
  
  useEffect(() => {
    form.reset(
        mode === 'edit' && photo ? {
          title: photo.title,
          description: photo.description,
          category: photo.category,
          names: photo.names?.join(', ') || '',
        } : {
          title: '',
          description: '',
          category: undefined,
          names: '',
        }
    );
  }, [photoFormSchema, form, mode, photo]);


  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && photo) {
        form.reset({
          title: photo.title,
          description: photo.description,
          category: photo.category,
          names: photo.names?.join(', ') || '',
        });
        setImagePreview(photo.imageUrl);
      } else {
        form.reset({
          title: '',
          description: '',
          category: undefined,
          names: '',
        });
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  }, [isOpen, mode, photo, form]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop({ url: reader.result as string, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (blob: Blob, originalName: string) => {
    setIsLoading(true);
    const { id: tid } = toast({ title: 'Processing image...' });
    
    try {
        const filePath = `gallery/${albumId}/${Date.now()}_${originalName}`;
        const storageRef = ref(storage, filePath);
        
        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);

        form.setValue('image', imageUrl);
        setImagePreview(imageUrl);
        
        toast({ id: tid, title: 'Image ready!' });
    } catch (error: any) {
        toast({ id: tid, variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const onSubmit = async (data: PhotoFormValues) => {
    setIsLoading(true);

    if (mode === 'add' && !imagePreview) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please select and crop an image.' });
        setIsLoading(false);
        return;
    }
    
    if (mode === 'edit' && !photo) {
        toast({ variant: 'destructive', title: 'Error', description: 'Photo data missing.' });
        setIsLoading(false);
        return;
    }

    try {
        const namesArray = data.names?.split(',').map(name => name.trim()).filter(name => name.length > 0) || [];

        const photoData = {
            albumId,
            title: data.title || '',
            description: data.description || '',
            category: data.category,
            imageUrl: imagePreview!,
            createdAt: photo?.createdAt || new Date().toISOString(),
            names: namesArray,
            order: photo?.order ?? photoCount,
            mediaType: 'image' as const,
        };

        let docRef;
        if (mode === 'add') {
            docRef = doc(collection(firestore, 'photos'));
        } else {
            docRef = doc(firestore, 'photos', photo!.id);
        }
        
        const finalData = { ...photoData, id: docRef.id };
        setDocumentNonBlocking(docRef, finalData, { merge: mode === 'edit' });

        if (mode === 'edit' && imagePreview !== photo?.imageUrl && photo?.imageUrl) {
          if (photo.imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const oldImageRef = ref(storage, photo.imageUrl);
                await deleteObject(oldImageRef);
            } catch (deleteError: any) {
                console.warn("Clean-up failed:", deleteError.message);
            }
          }
        }

        toast({
            title: `Photo ${mode === 'add' ? 'Added' : 'Updated'}`,
            description: `"${data.title}" saved.`,
        });
        setIsOpen(false);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{mode === 'add' ? 'Add Photo' : 'Edit Photo'}</DialogTitle>
          <DialogDescription>{mode === 'add' ? 'Upload a new photo to the chapter gallery.' : `Editing details for "${photo?.title}".`}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full h-48 rounded-md bg-muted overflow-hidden border shrink-0">
                    {imagePreview ? (
                        <Image src={imagePreview} alt="Image preview" fill className="object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="h-12 w-12" />
                            <p>No image selected</p>
                        </div>
                    )}
                </div>
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <ImageIcon className="mr-2 h-4 w-4"/> {mode === 'add' ? 'Select & Crop Image' : 'Replace & Crop Image'}
                </Button>
                <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*" className="hidden" />
            </div>

            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., State Convention" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Brief summary..." className="resize-none" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )}/>
            
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {photoCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="names" render={({ field }) => ( 
                <FormItem>
                    <FormLabel>People in Photo</FormLabel>
                    <FormControl><Textarea placeholder="e.g., John Doe, Jane Smith" {...field} value={field.value || ''} /></FormControl>
                    <FormDescription className="text-xs">Comma separated.</FormDescription>
                    <FormMessage />
                </FormItem> 
            )}/>

            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
              <Button type="submit" disabled={isLoading} className="w-full font-bold h-12 md:h-10">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Saving...' : mode === 'add' ? 'Add Photo' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {imageToCrop && (
      <ImageCropper
        image={imageToCrop.url}
        aspect={1}
        onCropComplete={(blob) => {
          handleCroppedImage(blob, imageToCrop.name);
          setImageToCrop(null);
        }}
        onCancel={() => setImageToCrop(null)}
      />
    )}
    </>
  );
}
