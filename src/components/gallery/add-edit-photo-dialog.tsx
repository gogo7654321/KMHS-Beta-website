
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
  mode: 'add' | 'edit';
  photo?: Photo;
  children: React.ReactNode;
  photoCount: number;
}

export function AddEditPhotoDialog({ mode, photo, children, photoCount }: AddEditPhotoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PhotoFormValues) => {
    setIsLoading(true);
    const imageFile: File | undefined = fileInputRef.current?.files?.[0];

    if (mode === 'add' && !imageFile) {
        toast({ variant: 'destructive', title: 'Image Required', description: 'Please select an image to upload.' });
        setIsLoading(false);
        return;
    }
    
    if (mode === 'edit' && !photo) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Cannot update: original photo data is missing.' });
        setIsLoading(false);
        return;
    }

    try {
        let imageUrl = photo?.imageUrl || '';
        
        if (imageFile) {
            const toastId = toast({ title: 'Uploading image...' }).id;
            const filePath = `gallery/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, filePath);
            
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);

            toast({ id: toastId, title: 'Upload successful!' });
        }
        
        const namesArray = data.names?.split(',').map(name => name.trim()).filter(name => name.length > 0) || [];

        const photoData = {
            title: data.title || '',
            description: data.description || '',
            category: data.category,
            imageUrl: imageUrl,
            createdAt: photo?.createdAt || new Date().toISOString(),
            names: namesArray,
            order: photo?.order ?? photoCount,
        };

        let docRef;
        if (mode === 'add') {
            docRef = doc(collection(firestore, 'photos'));
        } else {
            docRef = doc(firestore, 'photos', photo!.id);
        }
        
        const finalData = { ...photoData, id: docRef.id };
        setDocumentNonBlocking(docRef, finalData, { merge: mode === 'edit' });

        if (mode === 'edit' && imageFile && photo?.imageUrl) {
          if (photo.imageUrl.includes('firebasestorage.googleapis.com')) {
            try {
                const oldImageRef = ref(storage, photo.imageUrl);
                await deleteObject(oldImageRef);
            } catch (deleteError: any) {
                console.warn("Could not delete old gallery image:", deleteError.message);
            }
          }
        }

        toast({
            title: `Photo ${mode === 'add' ? 'Added' : 'Updated'}`,
            description: `"${data.title}" has been saved.`,
        });
        setIsOpen(false);

    } catch (error: any) {
        console.error("Gallery operation failed:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred. Check the console for details.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Photo to Gallery' : 'Edit Photo'}</DialogTitle>
          <DialogDescription>{mode === 'add' ? 'Upload a new photo and provide its details.' : `Editing details for "${photo?.title}".`}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full h-48 rounded-md bg-muted overflow-hidden border">
                    {imagePreview ? (
                        <Image src={imagePreview} alt="Image preview" fill objectFit="cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <ImageIcon className="h-12 w-12" />
                            <p>Image Preview</p>
                        </div>
                    )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <ImageIcon className="mr-2 h-4 w-4"/> {mode === 'add' ? 'Select Image' : 'Replace Image'}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" className="hidden" />
            </div>

            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., State Convention Winners" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief description of the photo." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select a photo category" /></SelectTrigger>
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
                    <FormControl><Textarea placeholder="e.g., John Doe, Jane Smith" {...field} /></FormControl>
                    <FormDescription>Enter names separated by commas.</FormDescription>
                    <FormMessage />
                </FormItem> 
            )}/>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Saving...' : mode === 'add' ? 'Add Photo' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
