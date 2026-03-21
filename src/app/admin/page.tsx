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
import { AdminList } from './super/admin-list';
import { MemberList } from './super/member-list';
import { User as UserIcon, Users, Shield, Image as ImageIcon, Settings } from "lucide-react";
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
import { ImageCropper } from '@/components/ui/image-cropper';

// --- Gallery Settings Component ---
function GallerySettingsManager() {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'gallerySettings'), [firestore]);
  const { data: settings, isLoading } = useDoc<GallerySettings>(settingsDocRef);

  const handleSettingChange = (key: keyof GallerySettings, value: boolean) => {
    setDocumentNonBlocking(settingsDocRef, { [key]: value }, { merge: true });
  };

  const settingsOptions: { key: keyof GallerySettings; label: string; description: string }[] = [
    { key: 'isTitleRequired', label: 'Require Title', description: "Make the 'Title' field mandatory." },
    { key: 'isDescriptionRequired', label: 'Require Description', description: "Make the 'Description' field mandatory." },
    { key: 'isNamesRequired', label: 'Require Names', description: "Make the 'Names' field mandatory." },
  ];

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Gallery Upload Settings</CardTitle>
                <CardDescription>Control which fields are required for photo uploads.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-12 w-full" />
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
            <CardDescription>Control which fields are required for photo uploads. Changes affect all admins.</CardDescription>
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


// --- Profile Editor Component ---
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  grade: z.coerce.number().min(9, "Grade must be between 9-12").max(12, "Grade must be between 9-12"),
  position: z.string().min(1, 'Position is required'),
  bio: z.string().max(300, 'Bio must be 300 characters or less.').optional(),
  imageUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  personalUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function MyProfileCard() {
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{ url: string; name: string } | null>(null);
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(userDocRef);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      position: '',
      grade: 9,
      bio: '',
      imageUrl: '',
      personalUrl: '',
    },
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

  const handleImageUpload = async (blob: Blob, originalName: string) => {
    if (!user || !storage) {
      toast({ variant: 'destructive', title: 'Upload Error', description: 'User not authenticated or storage not available.' });
      return;
    }
    
    setIsUploading(true);
    const { id: uploadToastId } = toast({ title: 'Uploading...', description: 'Your image is being uploaded.' });
    
    const filePath = `admin-avatars/${user.uid}/${Date.now()}_${originalName}`;
    const storageRef = ref(storage, filePath);
    
    try {
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      form.setValue('imageUrl', downloadURL, { shouldDirty: true });
      
      toast({
        id: uploadToastId,
        title: 'Image Uploaded',
        description: 'Click "Save Profile" to apply the change.',
      });
  
    } catch (error: any) {
      toast({
        id: uploadToastId,
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
        duration: 9000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const watchedImageUrl = form.watch('imageUrl');
  const defaultAvatar = placeholderImages.find(p => p.id === 'default-avatar');

  const onSubmit = async (data: ProfileFormValues) => {
    setIsFormLoading(true);
    if (!user) {
      toast({ variant: 'destructive', title: 'Not Authenticated' });
      setIsFormLoading(false);
      return;
    }

    try {
      const oldImageUrl = adminData?.imageUrl; // Grab old image URL

      if (data.imageUrl && data.imageUrl !== user.photoURL) {
        await updateProfile(user, { photoURL: data.imageUrl });
      }

      const adminDocRef = doc(firestore, 'admin', user.uid);
      const updatedData: Partial<Admin> = {
        ...data,
      };
      setDocumentNonBlocking(adminDocRef, updatedData, { merge: true });
      toast({ title: 'Profile Updated', description: 'Your changes have been saved.' });

      // After successful update, delete old image if it exists and is different
      if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com') && oldImageUrl !== data.imageUrl) {
        try {
          const oldImageRef = ref(storage, oldImageUrl);
          await deleteObject(oldImageRef);
        } catch (deleteError: any) {
          console.error("Failed to delete old profile picture:", deleteError);
        }
      }

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsFormLoading(false);
    }
  };

  if (isAdminLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>This information is displayed publicly on the Leadership page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex justify-center items-center flex-col gap-4">
                     <Skeleton className="h-32 w-32 rounded-full" />
                     <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>This information is displayed publicly on the Leadership page.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <div className="flex justify-center items-center flex-col gap-4">
                <AvatarImage src={watchedImageUrl || defaultAvatar?.imageUrl || ''} alt="Profile Preview" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload & Crop Photo'}
                </Button>
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <FormField control={form.control} name="position" render={({ field }) => ( <FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={form.control} name="grade" render={({ field }) => ( <FormItem><FormLabel>Grade</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us a bit about yourself..." className="resize-none" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
             <FormField control={form.control} name="personalUrl" render={({ field }) => ( <FormItem><FormLabel>Personal URL</FormLabel><FormControl><Input placeholder="https://example.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isFormLoading} className="w-full">
              {isFormLoading ? 'Saving...' : 'Save Profile'}
            </Button>
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

function AvatarImage({ src, alt }: { src: string; alt: string }) {
    return (
        <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-secondary shadow-lg bg-muted">
            <Image
                src={src}
                alt={alt}
                key={src}
                data-ai-hint="professional headshot"
                fill
                sizes="128px"
                priority
                className="h-full w-full object-cover"
            />
        </div>
    );
}

// --- Main Admin Page ---
export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/admin');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || isAdminLoading;
  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';

  if (isLoading) {
    return <div className="container mx-auto py-12 text-center">Loading...</div>;
  }

  if (!user || (!adminData && !isSuperAdmin)) {
    return null;
  }

  return (
    <div className="container mx-auto py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="text-center lg:text-left">
                    <h1 className="text-4xl font-bold font-headline text-primary uppercase tracking-tight">Kennesaw Mountain High School</h1>
                    <h2 className="text-2xl font-bold mt-2">Admin Portal</h2>
                    <p className="mt-4 text-lg">Welcome, {adminData?.firstName || user.email}</p>
                </div>

                {isSuperAdmin && (
                    <Card className="border-primary/50 bg-secondary/30">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle className="font-headline text-2xl">Super Admin Panel</CardTitle>
                            <CardDescription>Full access to all site data and controls.</CardDescription>
                        </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="admins" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="admins"><UserIcon className="mr-2" />Admins</TabsTrigger>
                            <TabsTrigger value="members"><Users className="mr-2" />Members</TabsTrigger>
                             <TabsTrigger value="settings"><Settings className="mr-2 h-5 w-5" />Settings</TabsTrigger>
                        </TabsList>
                        <TabsContent value="admins" className="mt-4">
                            <AdminList />
                        </TabsContent>
                        <TabsContent value="members" className="mt-4">
                            <MemberList />
                        </TabsContent>
                         <TabsContent value="settings" className="mt-4">
                            <GallerySettingsManager />
                        </TabsContent>
                        </Tabs>
                    </CardContent>
                    </Card>
                )}

                <div className="text-center lg:text-left">
                    <h2 className="text-2xl font-semibold">Management Sections</h2>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-xl font-bold">Events</h3>
                        <p className="mt-2 text-muted-foreground">Manage club events.</p>
                        <Button className="mt-4" onClick={() => router.push('/events')}>Go to Events</Button>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-xl font-bold">Members</h3>
                        <p className="mt-2 text-muted-foreground">
                        View and manage members.
                        </p>
                        <Button className="mt-4">Go to Members</Button>
                    </div>
                    <div className="rounded-lg border bg-card p-6">
                        <h3 className="text-xl font-bold">Service Hours</h3>
                        <p className="mt-2 text-muted-foreground">
                        Track and approve hours.
                        </p>
                        <Button className="mt-4" onClick={() => router.push('/service-hours')}>Go to Service Hours</Button>
                    </div>
                    </div>
                </div>
                <div className="text-center lg:text-left">
                    <Button variant="destructive" onClick={() => auth.signOut()}>
                    Sign Out
                    </Button>
                </div>
            </div>

            <div className="lg:col-span-1">
                <MyProfileCard />
            </div>
        </div>
    </div>
  );
}