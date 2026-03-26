
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Album } from '@/lib/types';
import { Loader2, Save } from 'lucide-react';

const albumSchema = z.object({
  title: z.string().min(2, 'Title is required.'),
  description: z.string().optional(),
});

type AlbumFormValues = z.infer<typeof albumSchema>;

interface AddEditAlbumDialogProps {
  mode: 'add' | 'edit';
  album?: Album;
  children: React.ReactNode;
}

export function AddEditAlbumDialog({ mode, album, children }: AddEditAlbumDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<AlbumFormValues>({
    resolver: zodResolver(albumSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && album) {
        form.reset({
          title: album.title,
          description: album.description || '',
        });
      } else {
        form.reset({ title: '', description: '' });
      }
    }
  }, [isOpen, mode, album, form]);

  const onSubmit = async (data: AlbumFormValues) => {
    setIsLoading(true);
    try {
      const albumData = {
        title: data.title,
        description: data.description || '',
        createdAt: album?.createdAt || new Date().toISOString(),
        order: album?.order ?? Date.now(),
      };

      const docRef = mode === 'add' ? doc(collection(firestore, 'albums')) : doc(firestore, 'albums', album!.id);
      setDocumentNonBlocking(docRef, { ...albumData, id: docRef.id }, { merge: mode === 'edit' });

      toast({
        title: `Album ${mode === 'add' ? 'Created' : 'Updated'}`,
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Create Album' : 'Edit Album'}</DialogTitle>
          <DialogDescription>Group photos from a specific event or project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Album Title</FormLabel><FormControl><Input placeholder="e.g., Interest Meeting 2026" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Brief context about these photos..." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="font-bold">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {mode === 'add' ? 'Create Album' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
