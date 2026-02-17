'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';

interface AnnouncementEditorProps {
  initialContent: string;
}

export function AnnouncementEditor({ initialContent }: AnnouncementEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    setIsLoading(true);
    const announcementDocRef = doc(firestore, 'siteContent', 'home');
    setDocumentNonBlocking(
      announcementDocRef,
      { announcementText: content },
      { merge: true }
    );
    toast({
      title: 'Announcement Updated',
      description: 'The home page announcement has been saved.',
    });
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Home Page Announcement</DialogTitle>
          <DialogDescription>
            This text will be displayed prominently at the top of the home page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="announcement-text">Announcement Text</Label>
            <Textarea
              id="announcement-text"
              placeholder="Enter announcement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    