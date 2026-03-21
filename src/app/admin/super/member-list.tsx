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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
        description: 'The student record has been deleted.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: e.message,
      });
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Syncing chapter roster...</div>;
  }

  if (error) {
    return <div className="text-destructive py-8 text-center">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" disabled>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="rounded-md border bg-background overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Member Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[120px]">Member ID</TableHead>
                  <TableHead className="w-[80px]">Grade</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members && members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium whitespace-nowrap">{member.firstName} {member.lastName}</TableCell>
                      <TableCell className="whitespace-nowrap">{member.email}</TableCell>
                      <TableCell className="font-mono text-xs">#{member.memberId}</TableCell>
                      <TableCell>{member.grade}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <EditMemberDialog member={member}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                              </Button>
                          </EditMemberDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Member Profile?</AlertDialogTitle>
                                <AlertDialogDescription>
                                   Remove <span className="font-semibold text-foreground">{member.firstName} {member.lastName}</span> from the chapter database. This action is irreversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(member.id)}
                                >
                                  Delete Profile
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
                      No student members found.
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
