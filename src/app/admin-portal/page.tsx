
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
import { User as UserIcon, Users, Shield, Image as ImageIcon, Settings, LayoutDashboard } from "lucide-react";
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

function GallerySettingsManager() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'gallerySettings'), [firestore]);
  const { data: settings, isLoading } = useDoc<GallerySettings>(settingsDocRef);

  const handleSettingChange = (key: keyof GallerySettings, value: boolean) => {
    setDocumentNonBlocking(settingsDocRef, { [key]: value }, { merge: true });
  };

  const settingsOptions: { key: keyof GallerySettings; label: string; description: string }[] = [
    { key: 'isTitleRequired', label: 'Require Title', description: "Mandatory 'Title' for photo uploads." },
    { key: 'isDescriptionRequired', label: 'Require Description', description: "Mandatory 'Description' for photo uploads." },
    { key: 'isNamesRequired', label: 'Require Names', description: "Mandatory 'Names' for photo uploads." },
  ];

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gallery Upload Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
        <CardHeader>
            <CardTitle>Gallery Upload Settings</CardTitle>
            <CardDescription>Global requirements for photo submissions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
            {settingsOptions.map(option => (
                 <div key={option.key} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>{option.label}</FormLabel>
                        <FormDescription>{option.description}</FormDescription>
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

  const handleImageUpload = async (file: File) => {
    if (!user || !storage) return;
    setIsUploading(true);
    const { id: tid } = toast({ title: 'Uploading avatar...' });
    const filePath = `admin-avatars/${user.uid}/${Date.now()}_${file.name}`;
    try {
      await uploadBytes(ref(storage, filePath), file);
      const url = await getDownloadURL(ref(storage, filePath));
      form.setValue('imageUrl', url, { shouldDirty: true });
      toast({ id: tid, title: 'Upload Successful' });
    } catch (e: any) {
      toast({ id: tid, variant: 'destructive', title: 'Upload Failed', description: e.message });
    } finally { setIsUploading(false); }
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
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally { setIsFormLoading(false); }
  };

  if (isAdminLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leadership Profile</CardTitle>
        <CardDescription>Public info for the Leadership page.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <div className="flex flex-col items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border">
                    <Image src={form.watch('imageUrl') || placeholderImages.find(p => p.id === 'default-avatar')?.imageUrl || ''} alt="Avatar" fill className="object-cover" />
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} className="hidden" accept="image/*" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>Change Photo</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
            </div>
            <FormField control={form.control} name="position" render={({ field }) => ( <FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl></FormItem> )} />
            <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem> )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isFormLoading} className="w-full">{isFormLoading ? 'Saving...' : 'Save Profile'}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
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

  if (isUserLoading || isAdminLoading) return <div className="container py-24 text-center">Verifying credentials...</div>;
  if (!user || !adminData) return null;

  const isSuperAdmin = user?.email === 'npatel012010@gmail.com';

  return (
    <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold font-headline">Admin Portal</h1>
                        <p className="mt-2 text-muted-foreground">Managing {adminData.firstName}'s Chapter Operations</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/member-portal" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Member Dashboard</Link>
                    </Button>
                </div>

                {isSuperAdmin && (
                    <Card className="border-primary/50">
                    <CardHeader><div className="flex items-center gap-4"><Shield className="h-8 w-8 text-primary" /><CardTitle className="text-2xl">Super Admin Panel</CardTitle></div></CardHeader>
                    <CardContent>
                        <Tabs defaultValue="admins">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="admins"><UserIcon className="mr-2" />Admins</TabsTrigger>
                                <TabsTrigger value="members"><Users className="mr-2" />Members</TabsTrigger>
                                <TabsTrigger value="settings"><Settings className="mr-2" />Settings</TabsTrigger>
                            </TabsList>
                            <TabsContent value="admins" className="mt-4"><AdminList /></TabsContent>
                            <TabsContent value="members" className="mt-4"><MemberList /></TabsContent>
                            <TabsContent value="settings" className="mt-4"><GallerySettingsManager /></TabsContent>
                        </Tabs>
                    </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <Card className="p-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold">Events</h3>
                        <p className="text-sm text-muted-foreground mb-4">Post announcements and projects.</p>
                        <Button className="w-full" asChild><Link href="/events">Manage Events</Link></Button>
                    </Card>
                    <Card className="p-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold">Service Logs</h3>
                        <p className="text-sm text-muted-foreground mb-4">Approve or reject student hours.</p>
                        <Button className="w-full" asChild><Link href="/service-hours">Verify Hours</Link></Button>
                    </Card>
                    <Card className="p-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold">Chapter Gallery</h3>
                        <p className="text-sm text-muted-foreground mb-4">Curate activity photos.</p>
                        <Button className="w-full" asChild><Link href="/gallery">Update Gallery</Link></Button>
                    </Card>
                </div>
                <div className="pt-8">
                    <Button variant="destructive" onClick={() => auth.signOut()}>Log Out</Button>
                </div>
            </div>
            <div className="lg:col-span-1"><MyProfileCard /></div>
        </div>
    </div>
  );
}
