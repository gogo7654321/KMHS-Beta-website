
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
import { Pencil, Trash2, PlusCircle, BookOpen, ExternalLink, ChevronLeft, Zap, Target } from 'lucide-react';
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

  const seoTopics = [
    "Top 5 Service Opportunities in Cobb County for High Schoolers",
    "Everything You Need to Know About Kennesaw Mountain High School Beta Club",
    "How to Log Service Hours at Kennesaw Mountain High School",
    "The Impact of Community Service in Kennesaw, Georgia",
    "KMHS Student Leadership: Meet the Beta Club Officers"
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="shadow-lg">
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

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                SEO Engine
              </CardTitle>
              <CardDescription>Target these topics to rank #1 for Kennesaw Mountain High School searches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {seoTopics.map((topic, i) => (
                <div key={i} className="flex gap-3 text-sm p-3 rounded-md bg-background/50 border border-border/50 group hover:border-primary/50 transition-colors">
                  <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="font-medium leading-tight">{topic}</p>
                </div>
              ))}
              <div className="pt-4 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  <strong>SEO Tip:</strong> Always include "Kennesaw Mountain High School" in the first 100 words of every post.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AdSense Approval</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Aim for at least 10 high-quality articles.</p>
              <p>• Posts should be 500+ words long.</p>
              <p>• Use original photos from Kennesaw Mountain events.</p>
              <p>• Make sure "Visibility" is set to Published.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
