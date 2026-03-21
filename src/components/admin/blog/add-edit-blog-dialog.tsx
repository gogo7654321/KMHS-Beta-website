'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useStorage, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { BlogPost, Admin } from '@/lib/types';
import { ImageIcon, Loader2, Save, Info } from 'lucide-react';
import Image from 'next/image';
import { ImageCropper } from '@/components/ui/image-cropper';

const blogFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  content: z.string().min(50, 'Please provide more substantial content for your article.'),
  status: z.enum(['draft', 'published']),
  tags: z.string(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  imageCaption: z.string().optional(),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

interface AddEditBlogDialogProps {
  mode: 'add' | 'edit';
  post?: BlogPost;
  children: React.ReactNode;
}

export function AddEditBlogDialog({ mode, post, children }: AddEditBlogDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);

  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: '',
      content: '',
      status: 'draft',
      tags: '',
      imageUrl: '',
      imageCaption: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && post) {
        form.reset({
          title: post.title,
          content: post.content,
          status: post.status,
          tags: post.tags?.join(', ') || '',
          imageUrl: post.imageUrl || '',
          imageCaption: post.imageCaption || '',
        });
      } else {
        form.reset({
          title: '',
          content: '',
          status: 'draft',
          tags: '',
          imageUrl: '',
          imageCaption: '',
        });
      }
    }
  }, [isOpen, mode, post, form]);

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

  const handleImageUpload = async (blob: Blob, originalName: string) => {
    if (!storage) return;
    setIsUploading(true);
    const { id: tid } = toast({ title: 'Uploading image...' });
    const filePath = `blog-images/${Date.now()}_${originalName}`;
    try {
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      form.setValue('imageUrl', url);
      toast({ id: tid, title: 'Upload complete' });
    } catch (e: any) {
      toast({ id: tid, variant: 'destructive', title: 'Upload Failed', description: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: BlogFormValues) => {
    if (!user || (!adminData && !isSuperAdmin)) {
        toast({ variant: 'destructive', title: 'Action Denied', description: 'Administrative identity not verified.' });
        return;
    }
    
    setIsLoading(true);
    try {
      const authorName = adminData 
        ? `${adminData.firstName} ${adminData.lastName}` 
        : (user.displayName || user.email || 'Administrator');

      const blogData: Omit<BlogPost, 'id'> = {
        title: data.title,
        content: data.content,
        status: data.status,
        tags: data.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        imageUrl: data.imageUrl,
        imageCaption: data.imageCaption,
        authorName: authorName,
        createdAt: post?.createdAt || new Date().toISOString(),
      };

      const blogRef = mode === 'add' ? doc(collection(firestore, 'blogs')) : doc(firestore, 'blogs', post!.id);
      setDocumentNonBlocking(blogRef, { ...blogData, id: blogRef.id }, { merge: mode === 'edit' });

      toast({
        title: mode === 'add' ? 'Story Created' : 'Story Updated',
        description: `"${data.title}" has been saved.`,
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Write New Chapter Story' : 'Edit Chapter Story'}</DialogTitle>
          <DialogDescription>
            Compose an article for the Kennesaw Mountain Beta blog. Use detailed content for better AdSense results.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Article Title</FormLabel><FormControl><Input placeholder="e.g., Highlights from the National Convention" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="draft">Draft (Hidden)</SelectItem>
                                <SelectItem value="published">Published (Public)</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem><FormLabel>Tags (Comma separated)</FormLabel><FormControl><Input placeholder="Service, Convention, Awards" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>

            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                <FormLabel>Cover Media</FormLabel>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative aspect-video w-full sm:w-48 overflow-hidden rounded-md border bg-secondary">
                        {form.watch('imageUrl') ? (
                            <Image src={form.watch('imageUrl') || ''} alt="Preview" fill className="object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>
                        )}
                    </div>
                    <div className="flex-1 space-y-3">
                         <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" accept="image/*" />
                         <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                            Upload & Crop Cover Photo
                         </Button>
                         <FormField control={form.control} name="imageCaption" render={({ field }) => (
                            <FormItem><FormControl><Input placeholder="Photo caption..." {...field} /></FormControl></FormItem>
                         )}/>
                    </div>
                </div>
            </div>

            <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Article Content
                      <Badge variant="outline" className="font-normal gap-1 text-[10px] py-0">
                        <Info className="h-3 w-3" /> Supports Markdown
                      </Badge>
                    </FormLabel>
                    <FormControl><Textarea placeholder="Share the full details of this event or achievement..." className="min-h-[300px] leading-relaxed font-mono text-sm" {...field} /></FormControl>
                    <FormDescription>
                      You can paste text from Gemini. Use **bold** for emphasis and - for bullets.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
            )}/>

            <DialogFooter>
              <Button type="submit" disabled={isLoading || isUploading} className="w-full sm:w-auto font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {mode === 'add' ? 'Create Post' : 'Update Post'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {imageToCrop && (
      <ImageCropper
        image={imageToCrop.url}
        aspect={16 / 9}
        onCropComplete={(blob) => {
          handleImageUpload(blob, imageToCrop.name);
          setImageToCrop(null);
        }}
        onCancel={() => setImageToCrop(null)}
      />
    )}
    </>
  );
}