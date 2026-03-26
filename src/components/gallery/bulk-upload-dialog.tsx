
'use client';

import React, { useState, useRef } from 'react';
import { useFirestore, useStorage } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, Loader2, UploadCloud, CheckCircle2, Video } from 'lucide-react';
import type { Photo } from '@/lib/types';

interface BulkUploadDialogProps {
  albumId: string;
  children: React.ReactNode;
}

export function BulkUploadDialog({ albumId, children }: BulkUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const handleUpload = async (files: FileList) => {
    if (!storage || !firestore || files.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    const totalFiles = files.length;
    let completed = 0;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');
      setStatus(`Uploading ${i + 1} of ${totalFiles}: ${file.name}`);
      
      try {
        const filePath = `gallery/${albumId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        const photoRef = doc(collection(firestore, 'photos'));
        const photoData: Photo = {
          id: photoRef.id,
          albumId,
          imageUrl: url, // Source URL
          mediaType: isVideo ? 'video' : 'image',
          createdAt: new Date().toISOString(),
          order: Date.now() + i,
        };

        setDocumentNonBlocking(photoRef, photoData, { merge: false });
        
        completed++;
        setProgress((completed / totalFiles) * 100);
      } catch (error: any) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setIsUploading(false);
    setStatus('Upload Complete!');
    toast({ title: 'Bulk Upload Successful', description: `${completed} items added to the album.` });
    
    setTimeout(() => {
        setIsOpen(false);
        setProgress(0);
        setStatus('');
    }, 1500);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Media</DialogTitle>
          <DialogDescription>
            Select multiple images and videos to upload to this album.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-secondary/10 gap-4">
            {!isUploading && status !== 'Upload Complete!' ? (
                <>
                    <div className="flex gap-4">
                        <UploadCloud className="h-12 w-12 text-muted-foreground opacity-50" />
                        <Video className="h-12 w-12 text-muted-foreground opacity-50" />
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()} className="font-bold px-8">
                        Choose Files
                    </Button>
                    <p className="text-xs text-muted-foreground px-10 text-center">
                        Supports images and videos (MP4, MOV) up to 50MB per file.
                    </p>
                </>
            ) : isUploading ? (
                <div className="w-full px-10 space-y-4 text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="text-sm font-medium">{status}</p>
                    <Progress value={progress} className="h-2" />
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-12 w-12" />
                    <p className="font-bold">{status}</p>
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelect}
                multiple
                accept="image/*,video/*"
                className="hidden"
            />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isUploading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
