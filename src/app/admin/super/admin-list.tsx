'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Admin } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AddEditAdminDialog } from './add-edit-admin-dialog';

export function AdminList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const adminsCollectionRef = useMemoFirebase(() => collection(firestore, 'admin'), [firestore]);
  const { data: admins, isLoading, error } = useCollection<Admin>(adminsCollectionRef);

  const handleDelete = async (adminId: string) => {
    try {
      await deleteDoc(doc(firestore, 'admin', adminId));
      toast({
        title: 'Admin Removed',
        description: 'The administrator has been removed successfully.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error Removing Admin',
        description: e.message || 'Could not remove administrator.',
      });
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading administrators...</div>;
  }

  if (error) {
    return <div className="text-destructive py-8 text-center">Error loading admins: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddEditAdminDialog mode="add">
          <Button size="sm" className="font-bold">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </AddEditAdminDialog>
      </div>
      
      <div className="rounded-md border bg-background overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className="w-[80px]">Grade</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins && admins.length > 0 ? (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium whitespace-nowrap">{admin.firstName} {admin.lastName}</TableCell>
                      <TableCell className="whitespace-nowrap">{admin.email}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={admin.email === 'npatel012010@gmail.com' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold tracking-tight">
                          {admin.email === 'npatel012010@gmail.com' ? 'Super Admin' : admin.position}
                        </Badge>
                      </TableCell>
                      <TableCell>{admin.grade || 'N/A'}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <AddEditAdminDialog mode="edit" admin={admin}>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                          </AddEditAdminDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={admin.email === 'npatel012010@gmail.com'}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Administrator?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Permanently remove <span className="font-semibold text-foreground">{admin.firstName} {admin.lastName}</span> from chapter leadership.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(admin.id)}
                                >
                                  Delete Record
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No administrators found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
