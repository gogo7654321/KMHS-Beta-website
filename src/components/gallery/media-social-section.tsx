
'use client';

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Photo, PhotoComment, Member } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Send, Trash2, Loader2, LogIn } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MediaSocialSectionProps {
  photo: Photo;
}

export function MediaSocialSection({ photo }: MediaSocialSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const memberDocRef = useMemoFirebase(() => user ? doc(firestore, 'members', user.uid) : null, [firestore, user]);
  const { data: memberData } = useDoc<Member>(memberDocRef);

  const commentsQuery = useMemoFirebase(
    () => query(collection(firestore, 'photos', photo.id, 'comments'), orderBy('createdAt', 'desc')),
    [firestore, photo.id]
  );
  const { data: comments, isLoading: isCommentsLoading } = useCollection<PhotoComment>(commentsQuery);

  const isLiked = user ? photo.likes?.includes(user.uid) : false;
  const likesCount = photo.likes?.length || 0;

  const handleLike = () => {
    if (!user) {
      toast({ title: 'Sign In Required', description: 'Log in to like this photo.' });
      return;
    }

    const photoRef = doc(firestore, 'photos', photo.id);
    updateDocumentNonBlocking(photoRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        userId: user.uid,
        userName: memberData ? `${memberData.firstName} ${memberData.lastName}` : (user.displayName || 'Member'),
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const commentsRef = collection(firestore, 'photos', photo.id, 'comments');
      addDocumentNonBlocking(commentsRef, commentData);
      
      setCommentText('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post comment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = (commentId: string) => {
    const commentRef = doc(firestore, 'photos', photo.id, 'comments', commentId);
    // Note: Security rules handle permissions
    updateDocumentNonBlocking(commentRef, { deleted: true }); // Simplified for demo, rules actually allow delete
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/40">
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                size="sm" 
                className={cn("gap-2 px-3", isLiked && "text-red-500 hover:text-red-600 hover:bg-red-500/10")} 
                onClick={handleLike}
            >
                <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                <span className="font-bold">{likesCount}</span>
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MessageSquare className="h-5 w-5" />
                <span className="font-bold">{comments?.length || 0}</span>
            </div>
        </div>
      </div>

      <ScrollArea className="flex-grow p-4">
        <div className="space-y-6">
          {isCommentsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px] bg-secondary">{comment.userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{comment.userName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground space-y-2">
                <MessageSquare className="h-8 w-8 mx-auto opacity-20" />
                <p className="text-xs uppercase font-bold tracking-widest">No comments yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40 bg-muted/30">
        {user ? (
          <form onSubmit={handlePostComment} className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px] text-sm resize-none bg-background"
            />
            <Button 
                type="submit" 
                disabled={!commentText.trim() || isSubmitting} 
                className="w-full font-bold gap-2"
                size="sm"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post Comment
            </Button>
          </form>
        ) : (
          <div className="text-center py-2 space-y-3">
            <p className="text-xs text-muted-foreground">Join the conversation</p>
            <Button asChild variant="outline" size="sm" className="w-full font-bold gap-2">
                <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    Log In to Comment
                </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
