'use client';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import type { Admin, GallerySettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminList } from '../admin/super/admin-list';
import { MemberList } from '../admin/super/member-list';
import { User as UserIcon, Users, Shield, Image as ImageIcon, Settings, LayoutDashboard, BookOpen, Clock, Heart } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { placeholderImages } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { ImageCropper } from '@/components/ui/image-cropper';

function GallerySettingsManager() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'gallerySettings'), [firestore]);
  const { data: settings, isLoading } = useDoc<GallerySettings>(settingsDocRef);

  const handleSettingChange = (key: keyof GallerySettings, value: boolean) => {
    setDocumentNonBlocking(settingsDocRef, { [key]: value }, { merge: true });
  };

  const settingsOptions: { key: keyof GallerySettings; label: string; description: string }[] = [
    { key: 'isTitleRequired', label: 'Require Title', description: "For photo uploads." },
    { key: 'isDescriptionRequired', label: 'Require Description', description: "For photo uploads." },
    { key: 'isNamesRequired', label: 'Require Names', description: "For photo uploads." },
  ];

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  
  return (
    <Card className="border-border/60">
        <CardHeader>
            <CardTitle className="text-lg">Gallery Requirements</CardTitle>
            <CardDescription className="text-xs">Global photo submission rules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {settingsOptions.map(option => (
                 <div key={option.key} className="flex items-center justify-between rounded-lg border p-3 bg-background/50">
                    <div className="space-y-0.5">
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-[10px] text-muted-foreground">{option.description}</p>
                    </div>
                    <Switch
                        checked={settings?.[option.key] ?? false}
                        onCheckedChange={(checked) => handleSettingChange(option.key, checked)}
                    />
                </div>
            ))}
        </CardContent>
    </Card>
  );
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  grade: z.coerce.number().min(9, "Grade 9-12").max(12, "Grade 9-12"),
  position: z.string().min(1, 'Position is required'),
  bio: z.string().max(300, 'Bio max 300 chars').optional(),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  personalUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function MyProfileCard() {
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; name: string } | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(userDocRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', position: '', grade: 9, bio: '', imageUrl: '', personalUrl: '' },
  });

  useEffect(() => {
    if (adminData) {
      form.reset({
        firstName: adminData.firstName || '',
        lastName: adminData.lastName || '',
        position: adminData.position || '',
        grade: adminData.grade || 9,
        bio: adminData.bio || '',
        imageUrl: adminData.imageUrl || '',
        personalUrl: adminData.personalUrl || '',
      });
    }
  }, [adminData, form]);

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

  const handleImageUpload = async (blob: Blob, fileName: string) => {
    if (!user || !storage) return;
    setIsUploading(true);
    const { id: tid } = toast({ title: 'Uploading...' });
    const filePath = `admin-avatars/${user.uid}/${Date.now()}_${fileName}`;
    try {
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      form.setValue('imageUrl', url, { shouldDirty: true });
      toast({ id: tid, title: 'Upload Successful' });
    } catch (e: any) {
      toast({ id: tid, variant: 'destructive', title: 'Error', description: e.message });
    } finally { 
      setIsUploading(false); 
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsFormLoading(true);
    try {
      if (data.imageUrl && data.imageUrl !== user.photoURL) {
        await updateProfile(user, { photoURL: data.imageUrl });
      }
      setDocumentNonBlocking(doc(firestore, 'admin', user.uid), data, { merge: true });
      toast({ title: 'Profile Updated' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: e.message });
    } finally { setIsFormLoading(false); }
  };

  if (isAdminLoading) return <Skeleton className="h-[500px] w-full" />;

  return (
    <>
    <Card className="border-border/60 shadow-lg sticky top-24">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Leadership Profile</CardTitle>
        <CardDescription className="text-xs">Your public info on the Leadership page.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <div className="flex flex-col items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-secondary shadow-md bg-muted">
                    <Image src={form.watch('imageUrl') || placeholderImages.find(p => p.id === 'default-avatar')?.imageUrl || ''} alt="Avatar" fill className="object-cover" />
                </div>
                <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" accept="image/*" />
                <Button type="button" variant="outline" size="sm" className="font-bold text-xs" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <ImageIcon className="mr-2 h-3 w-3" />}
                  Change Portrait
                </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">First Name</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Last Name</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl></FormItem> )} />
            </div>
            <FormField control={form.control} name="position" render={({ field }) => ( <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Position</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel className="text-xs font-bold uppercase text-muted-foreground">Short Bio</FormLabel><FormControl><Textarea className="min-h-[100px] text-sm resize-none" {...field} /></FormControl></FormItem> )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isFormLoading} className="w-full font-bold h-11">{isFormLoading ? 'Saving...' : 'Save Profile'}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>

    {imageToCrop && (
      <ImageCropper
        image={imageToCrop.url}
        aspect={1}
        circular={true}
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

export default function AdminPortalPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login/admin');
  }, [user, isUserLoading, router]);

  if (isUserLoading || isAdminLoading) return <div className="container py-24 text-center">Checking credentials...</div>;
  if (!user) return null;

  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';
  
  if (!adminData && !isSuperAdmin) return <div className="container py-24 text-center">Restricted Access.</div>;

  return (
    <div className="container mx-auto py-8 md:py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary">Admin Portal</h1>
                        <p className="mt-1 text-muted-foreground text-sm">Managing operations for Kennesaw Mountain High School Beta</p>
                    </div>
                    <Button variant="outline" asChild className="w-full md:w-auto font-bold h-11 md:h-10">
                        <Link href="/member-portal" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Member View</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="p-6 border-border/60 bg-secondary/10 flex flex-col items-center text-center hover:border-primary/40 transition-colors">
                        <BookOpen className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-bold mb-1">Chapter Blog</h3>
                        <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-widest">SEO Engine</p>
                        <Button className="w-full font-bold h-10" asChild><Link href="/admin-portal/blog">Manage Stories</Link></Button>
                    </Card>
                    <Card className="p-6 border-border/60 bg-secondary/10 flex flex-col items-center text-center hover:border-primary/40 transition-colors">
                        <Clock className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-bold mb-1">Club Events</h3>
                        <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-widest">Schedule</p>
                        <Button className="w-full font-bold h-10" asChild><Link href="/events">Edit Calendar</Link></Button>
                    </Card>
                    <Card className="p-6 border-border/60 bg-secondary/10 flex flex-col items-center text-center hover:border-primary/40 transition-colors">
                        <Heart className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-bold mb-1">Service Logs</h3>
                        <p className="text-[10px] text-muted-foreground mb-4 uppercase font-bold tracking-widest">Verify Hours</p>
                        <Button className="w-full font-bold h-10" asChild><Link href="/service-hours">Review Logs</Link></Button>
                    </Card>
                </div>

                {isSuperAdmin && (
                    <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-primary" />
                        <CardTitle className="text-xl">Super Admin Panel</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        <Tabs defaultValue="admins" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-none sm:rounded-md h-12">
                                <TabsTrigger value="admins" className="text-xs uppercase font-bold tracking-wider">Admins</TabsTrigger>
                                <TabsTrigger value="members" className="text-xs uppercase font-bold tracking-wider">Members</TabsTrigger>
                                <TabsTrigger value="settings" className="text-xs uppercase font-bold tracking-wider">Settings</TabsTrigger>
                            </TabsList>
                            <TabsContent value="admins" className="mt-6 px-4 sm:px-0"><AdminList /></TabsContent>
                            <TabsContent value="members" className="mt-6 px-4 sm:px-0"><MemberList /></TabsContent>
                            <TabsContent value="settings" className="mt-6 px-4 sm:px-0"><GallerySettingsManager /></TabsContent>
                        </Tabs>
                    </CardContent>
                    </Card>
                )}

                <div className="pt-8 border-t border-border/60">
                    <Button variant="destructive" className="w-full md:w-auto font-bold px-10 h-12 md:h-10" onClick={() => auth.signOut()}>Log Out</Button>
                </div>
            </div>
            <div className="lg:col-span-1"><MyProfileCard /></div>
        </div>
    </div>
  );
}
