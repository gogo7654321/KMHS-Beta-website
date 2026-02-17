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
import { ScrollArea } from '@/components/ui/scroll-area';
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
    return <div>Loading admins...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error loading admins: {error.message}</div>;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <AddEditAdminDialog mode="add">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        </AddEditAdminDialog>
      </div>
      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins && admins.length > 0 ? (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.firstName} {admin.lastName}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant={admin.email === 'npatel012010@gmail.com' ? 'default' : 'secondary'}>
                      {admin.email === 'npatel012010@gmail.com' ? 'Super Admin' : admin.position}
                    </Badge>
                  </TableCell>
                  <TableCell>{admin.grade}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <AddEditAdminDialog mode="edit" admin={admin}>
                       <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </AddEditAdminDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={admin.email === 'npatel012010@gmail.com'}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the admin record for <span className="font-semibold text-foreground">{admin.firstName} {admin.lastName}</span>. This action does not remove their authentication account and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(admin.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No administrators found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}
