'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import type { Member } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { EditMemberDialog } from './edit-member-dialog';

export function MemberList() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const membersCollectionRef = useMemoFirebase(() => collection(firestore, 'members'), [firestore]);
  const { data: members, isLoading, error } = useCollection<Member>(membersCollectionRef);

  const handleDelete = async (memberId: string) => {
    try {
      await deleteDoc(doc(firestore, 'members', memberId));
      toast({
        title: 'Member Removed',
        description: 'The member has been removed successfully.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error Removing Member',
        description: e.message || 'Could not remove member.',
      });
    }
  };

  if (isLoading) {
    return <div>Loading members...</div>;
  }

  if (error) {
    return <div className="text-destructive">Error loading members: {error.message}</div>;
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button disabled>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>
      <ScrollArea className="h-[400px] rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Position ID</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members && members.length > 0 ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.positionId}</TableCell>
                  <TableCell>{member.grade}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <EditMemberDialog member={member}>
                        <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </EditMemberDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                             This will permanently delete the member record for <span className="font-semibold text-foreground">{member.firstName} {member.lastName}</span>. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(member.id)}
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
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </>
  );
}
