'use client';

import React, { useEffect } from 'react';
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
import { Pencil, Trash2, PlusCircle, BookOpen, ExternalLink, ChevronLeft, Zap, Target } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function AdminBlogManagement() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login/admin');
  }, [user, isUserLoading, router]);

  const blogQuery = useMemoFirebase(() => query(collection(firestore, 'blogs'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: posts, isLoading } = useCollection<BlogPost>(blogQuery);

  const handleDelete = (id: string, title: string) => {
    deleteDocumentNonBlocking(doc(firestore, 'blogs', id));
    toast({ title: 'Article Deleted', description: `"${title}" removed.` });
  };

  const seoTopics = [
    "Top 5 Service Opportunities in Cobb County",
    "Everything About Kennesaw Mountain Beta Club",
    "How to Log Service Hours at Kennesaw Mountain",
    "Student Leadership: Meet our Officers"
  ];

  if (isUserLoading || isAdminLoading) return <div className="container py-24 text-center">Verifying permissions...</div>;
  if (!user || (!adminData && !isSuperAdmin)) return null;

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 gap-2"><Link href="/admin-portal"><ChevronLeft className="h-4 w-4" /> Back to Portal</Link></Button>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Manage Stories</h1>
          <p className="text-muted-foreground text-sm md:text-base">Publish content for Kennesaw Mountain High School Beta.</p>
        </div>
        <AddEditBlogDialog mode="add">
            <Button size="lg" className="w-full md:w-auto font-bold gap-2">
                <PlusCircle className="h-5 w-5" />
                Write New Post
            </Button>
        </AddEditBlogDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Article Library
              </CardTitle>
              <CardDescription>Manage drafts and published stories.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isLoading ? (
                <div className="space-y-4 p-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : posts && posts.length > 0 ? (
                <ScrollArea className="w-full">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="w-[150px]">Author</TableHead>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="text-right w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="capitalize text-[10px]">
                                {post.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold line-clamp-1">{post.title}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{post.authorName}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{format(new Date(post.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                  <Link href={`/blog/${post.id}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                                </Button>
                                <AddEditBlogDialog mode="edit" post={post}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                                </AddEditBlogDialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Article?</AlertDialogTitle>
                                      <AlertDialogDescription>Remove &quot;{post.title}&quot; permanently.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(post.id, post.title)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              ) : (
                <div className="text-center py-24 border-2 border-dashed rounded-lg bg-secondary/5 m-6">
                  <p className="text-muted-foreground">No stories found. Start sharing your impact!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                SEO Engine
              </CardTitle>
              <CardDescription className="text-xs">Topics to rank #1 for Kennesaw Mountain searches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {seoTopics.map((topic, i) => (
                <div key={i} className="flex gap-2 text-xs p-3 rounded-md bg-background/50 border border-border/50">
                  <Target className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="font-medium leading-tight">{topic}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
