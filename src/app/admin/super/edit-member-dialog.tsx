'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
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
import type { Member } from '@/lib/types';

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  grade: z.coerce.number().min(9, 'Grade must be between 9-12').max(12, 'Grade must be between 9-12'),
  positionId: z.string().min(1, 'Position ID is required'),
  email: z.string().email('Invalid email address'),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface EditMemberDialogProps {
  member: Member;
  children: React.ReactNode;
}

export function EditMemberDialog({ member, children }: EditMemberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: member,
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(member);
    }
  }, [isOpen, form, member]);

  const onSubmit = async (data: MemberFormValues) => {
    setIsLoading(true);
    try {
      const memberDocRef = doc(firestore, 'members', member.id);
      
      const updatedData: Partial<Member> = {
        firstName: data.firstName,
        lastName: data.lastName,
        grade: data.grade,
        positionId: data.positionId,
        email: data.email,
      };

      setDocumentNonBlocking(memberDocRef, updatedData, { merge: true });

      toast({
        title: 'Member Updated',
        description: 'The member profile has been successfully updated.',
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Editing profile for {member.firstName} {member.lastName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="positionId" render={({ field }) => (
                  <FormItem><FormLabel>Position ID</FormLabel><FormControl><Input placeholder="e.g., Member" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="grade" render={({ field }) => (
                  <FormItem><FormLabel>Grade</FormLabel><FormControl><Input type="number" placeholder="12" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="sm:col-span-2">
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="member@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
