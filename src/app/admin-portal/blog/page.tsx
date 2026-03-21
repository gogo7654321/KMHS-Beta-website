
'use client';

import React from 'react';
import { useFirestore, useCollection, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { BlogPost, Admin } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddEditBlogDialog } from '@/components/admin/blog/add-edit-blog-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, PlusCircle, BookOpen, ExternalLink, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminBlogManagement() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const blogQuery = useMemoFirebase(() => query(collection(firestore, 'blogs'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: posts, isLoading } = useCollection<BlogPost>(blogQuery);

  const handleDelete = (id: string, title: string) => {
    deleteDocumentNonBlocking(doc(firestore, 'blogs', id));
    toast({ title: 'Article Deleted', description: `"${title}" has been removed.` });
  };

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 gap-2"><Link href="/admin-portal"><ChevronLeft className="h-4 w-4" /> Back to Portal</Link></Button>
          <h1 className="font-headline text-4xl font-bold">Manage Chapter Stories</h1>
          <p className="text-muted-foreground">Draft and publish content for Kennesaw Mountain High School Beta.</p>
        </div>
        <AddEditBlogDialog mode="add">
            <Button size="lg" className="font-bold gap-2">
                <PlusCircle className="h-5 w-5" />
                Write New Post
            </Button>
        </AddEditBlogDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Article Library
          </CardTitle>
          <CardDescription>All your blog posts, including drafts and published stories.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : posts && posts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="capitalize">
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{post.title}</TableCell>
                    <TableCell className="text-muted-foreground">{post.authorName}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(post.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/blog/${post.id}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                      </Button>
                      <AddEditBlogDialog mode="edit" post={post}>
                        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                      </AddEditBlogDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Article?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove &quot;{post.title}&quot;. This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(post.id, post.title)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-24 border-2 border-dashed rounded-lg bg-secondary/5">
              <p className="text-muted-foreground text-lg">No stories found. Start sharing your chapter's impact!</p>
              <AddEditBlogDialog mode="add">
                <Button variant="outline" className="mt-4">Write Your First Story</Button>
              </AddEditBlogDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
