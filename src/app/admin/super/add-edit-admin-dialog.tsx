'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useFirestore, useStorage } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Admin } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { placeholderImages } from '@/lib/data';

const adminFormSchemaBase = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  grade: z.coerce.number().min(9, 'Grade must be between 9-12').max(12, 'Grade must be between 9-12'),
  position: z.string().min(1, 'Position is required'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(300, 'Bio must be 300 characters or less.').optional(),
  imageUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
  personalUrl: z.string().url('Must be a valid URL.').optional().or(z.literal('')),
});

const addAdminSchema = adminFormSchemaBase
  .extend({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const editAdminSchema = adminFormSchemaBase;

type AddAdminFormValues = z.infer<typeof addAdminSchema>;
type EditAdminFormValues = z.infer<typeof editAdminSchema>;

interface AddEditAdminDialogProps {
  mode: 'add' | 'edit';
  admin?: Admin;
  children: React.ReactNode;
}

const defaultAddValues = {
  firstName: '', lastName: '', grade: 9, position: '',
  email: '', password: '', confirmPassword: '', bio: '', imageUrl: '', personalUrl: '',
};

export function AddEditAdminDialog({ mode, admin, children }: AddEditAdminDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const schema = mode === 'add' ? addAdminSchema : editAdminSchema;
  const form = useForm<AddAdminFormValues | EditAdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'edit' && admin ? { ...admin, personalUrl: admin.personalUrl || '' } : defaultAddValues,
  });
  
  const watchedImageUrl = form.watch('imageUrl');

  React.useEffect(() => {
    if (isOpen) {
      const values = mode === 'edit' && admin ? { ...admin, grade: admin.grade || 9, bio: admin.bio ?? '', imageUrl: admin.imageUrl ?? '', personalUrl: admin.personalUrl ?? '' } : defaultAddValues;
      form.reset(values);
    }
  }, [isOpen, form, mode, admin]);

  const handleImageUpload = async (file: File, userId: string): Promise<string> => {
    if (!storage) {
        throw new Error("Firebase Storage not available.");
    }
    setIsUploading(true);
    const toastId = toast({ title: 'Uploading image...' }).id;

    try {
        const filePath = `admin-avatars/${userId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        
        console.log(`Starting upload for: ${filePath}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        form.setValue('imageUrl', downloadURL);
        toast({ id: toastId, title: 'Upload successful!', description: 'Image has been uploaded.' });
        return downloadURL;
    } catch (error: any) {
        console.error("FIREBASE STORAGE UPLOAD FAILED:", error);
        toast({
            id: toastId,
            variant: 'destructive',
            title: 'Upload Failed',
            description: `Error: ${error.code || error.message}. Please check CORS & storage rules.`,
            duration: 9000,
        });
        throw error; // Re-throw to prevent form submission
    } finally {
        setIsUploading(false);
    }
  };


  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && mode === 'edit' && admin?.id) {
        handleImageUpload(file, admin.id);
    } else if (file && mode === 'add') {
        const previewUrl = URL.createObjectURL(file);
        form.setValue('imageUrl', previewUrl);
    }
  };

  const onSubmit = async (data: AddAdminFormValues | EditAdminFormValues) => {
    setIsLoading(true);
    const file = fileInputRef.current?.files?.[0];

    try {
      // ADD MODE
      if (mode === 'add') {
        const addData = data as AddAdminFormValues;
        const q = query(collection(firestore, 'admin'), where('email', '==', addData.email));
        if (!(await getDocs(q)).empty) {
          toast({ variant: 'destructive', title: 'Creation Failed', description: 'An admin with this email already exists.' });
          setIsLoading(false); return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, addData.email, addData.password);
        const user = userCredential.user;

        if (user) {
          let finalImageUrl = '';
          if (file) {
            finalImageUrl = await handleImageUpload(file, user.uid);
          }
          const newAdminData: Omit<Admin, 'id'> & { id: string } = {
            id: user.uid, firstName: addData.firstName, lastName: addData.lastName,
            email: addData.email, position: addData.position, grade: addData.grade,
            bio: addData.bio || '', imageUrl: finalImageUrl || '', personalUrl: addData.personalUrl || '',
          };
          setDocumentNonBlocking(doc(firestore, 'admin', user.uid), newAdminData, { merge: false });
          toast({ title: 'Admin Created', description: 'Admin account has been created.' });
        }
      // EDIT MODE
      } else if (mode === 'edit' && admin) {
        const editData = data as EditAdminFormValues;
        const oldImageUrl = admin.imageUrl; 
        const newImageUrl = editData.imageUrl || ''; 

        // The upload is handled by `onFileChange` in edit mode. We just need to save the new URL from the form data.
        const updatedData: Partial<Admin> = { ...editData };
        setDocumentNonBlocking(doc(firestore, 'admin', admin.id), updatedData, { merge: true });
        toast({ title: 'Admin Updated', description: 'Profile has been updated.' });
        
        // After successful update, delete old image if it exists and is different
        if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com') && oldImageUrl !== newImageUrl) {
            try {
                const oldImageRef = ref(storage, oldImageUrl);
                await deleteObject(oldImageRef);
            } catch (deleteError: any) {
                console.error("Failed to delete old admin picture:", deleteError);
                toast({
                    variant: "destructive",
                    title: "Cleanup Failed",
                    description: "The admin profile was updated, but the old image could not be deleted.",
                    duration: 7000,
                });
            }
        }
      }
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: mode === 'add' ? 'Creation Failed' : 'Update Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultAvatar = placeholderImages.find(p => p.id === 'default-avatar');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Administrator' : 'Edit Administrator'}</DialogTitle>
          <DialogDescription>{mode === 'add' ? 'Create a new administrator account and profile.' : `Editing profile for ${admin?.firstName} ${admin?.lastName}.`}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col items-center gap-4">
                  <Image src={watchedImageUrl || defaultAvatar?.imageUrl || ''} alt="Avatar preview" width={100} height={100} priority className="rounded-full h-24 w-24 object-cover border-4 border-secondary" />
                  <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isUploading}><ImageIcon className="mr-2 h-4 w-4"/>{isUploading ? 'Uploading...' : 'Upload Image'}</Button>
              </div>
              <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="position" render={({ field }) => ( <FormItem><FormLabel>Position</FormLabel><FormControl><Input placeholder="e.g., President" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="grade" render={({ field }) => ( <FormItem><FormLabel>Grade</FormLabel><FormControl><Input type="number" placeholder="12" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              <div className="sm:col-span-2">
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="admin@example.com" {...field} disabled={mode === 'edit'} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="sm:col-span-2">
                <FormField control={form.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="A short bio for the leadership page..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="sm:col-span-2">
                <FormField control={form.control} name="personalUrl" render={({ field }) => ( <FormItem><FormLabel>Personal URL</FormLabel><FormControl><Input placeholder="https://example.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              {mode === 'add' && (
                <>
                  <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading || isUploading} className="w-full sm:w-auto">
                {isLoading ? (mode === 'add' ? 'Creating...' : 'Saving...') : (mode === 'add' ? 'Create Admin' : 'Save Changes')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
