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
import { Pencil, FileText, Loader2 } from 'lucide-react';

interface BylawsEditorProps {
  initialContent: string;
}

export function BylawsEditor({ initialContent }: BylawsEditorProps) {
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
    const bylawsDocRef = doc(firestore, 'siteContent', 'bylaws');
    
    const updateData = {
      content: content,
      updatedAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(bylawsDocRef, updateData, { merge: true });
    
    toast({
      title: 'Bylaws Updated',
      description: 'The official chapter bylaws have been saved and timestamped.',
    });
    
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-bold border-primary/50 text-primary hover:bg-primary/5">
          <Pencil className="h-4 w-4" />
          Modify Bylaws
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Bylaws Governance Editor
          </DialogTitle>
          <DialogDescription>
            Use standard Markdown for formatting. Changes will be timestamped and visible to all members immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow py-4">
          <div className="grid w-full items-center gap-1.5 h-full">
            <Label htmlFor="bylaws-content" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Document Content</Label>
            <Textarea
              id="bylaws-content"
              placeholder="Enter chapter bylaws using Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm leading-relaxed bg-secondary/5 border-primary/20"
            />
          </div>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading} className="font-bold gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish Updates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
