'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Member, ServiceHour, Admin } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Clock, Award, History, CheckCircle2, AlertCircle, Loader2, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function MemberPortalPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Determine if current user is Super Admin
  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';

  // Fetch Member profile
  const memberDocRef = useMemoFirebase(() => user ? doc(firestore, 'members', user.uid) : null, [firestore, user]);
  const { data: memberData, isLoading: isMemberLoading } = useDoc<Member>(memberDocRef);

  // Fetch Leadership profile
  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  // Define isAdmin for local checks
  const isAdmin = !!adminData || isSuperAdmin;

  const hoursQuery = useMemoFirebase(() => {
    if (!user || isMemberLoading || isAdminLoading || !memberData) return null;
    return query(collection(firestore, 'service-hours'), where('memberId', '==', user.uid), orderBy('date', 'desc'));
  }, [firestore, user?.uid, memberData?.id, isMemberLoading, isAdminLoading]);

  const { data: serviceHours, isLoading: isHoursLoading } = useCollection<ServiceHour>(hoursQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/member');
    }
  }, [user, isUserLoading, router]);

  const generateMemberId = () => Math.floor(10000 + Math.random() * 90000).toString();

  const handleCreateMemberFromAdmin = async () => {
    if (!user) return;
    setIsCreatingProfile(true);
    try {
      const memberDocRef = doc(firestore, 'members', user.uid);
      const newMemberData: Member = {
        id: user.uid,
        memberId: generateMemberId(),
        firstName: adminData?.firstName || user.displayName?.split(' ')[0] || 'Member',
        lastName: adminData?.lastName || user.displayName?.split(' ')[1] || 'User',
        email: user.email || '',
        grade: adminData?.grade || 12,
        totalHours: 0,
      };
      setDocumentNonBlocking(memberDocRef, newMemberData, { merge: false });
      toast({ title: "Profile Initialized", description: `Welcome, ${newMemberData.firstName}!` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Initialization Failed", description: error.message });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  if (isUserLoading || isMemberLoading || isAdminLoading || (hoursQuery && isHoursLoading)) {
    return (
      <div className="container mx-auto py-12 px-4 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return null;

  if (!memberData && isAdmin) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-20 w-20 text-primary mb-6" />
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Setup Required</h1>
        <p className="mt-4 text-muted-foreground max-w-md text-sm md:text-base">
          Hello {adminData?.firstName || 'Officer'}! Initialize your student dashboard to start logging your own service hours.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button onClick={handleCreateMemberFromAdmin} disabled={isCreatingProfile} className="font-bold h-12 flex-1">
                {isCreatingProfile ? <Loader2 className="mr-2 animate-spin" /> : null}
                Create Member Profile
            </Button>
            <Button variant="outline" asChild className="h-12 flex-1"><Link href="/admin-portal">Admin Portal</Link></Button>
        </div>
      </div>
    );
  }

  if (!memberData) {
      return (
        <div className="container mx-auto py-24 px-4 text-center">
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
            <Button asChild className="mt-6 font-bold"><Link href="/signup/member">Join the Chapter</Link></Button>
        </div>
      );
  }

  const totalApprovedHours = serviceHours ? serviceHours.filter(h => h.status === 'approved').reduce((acc, h) => acc + h.hours, 0) : 0;
  const annualGoal = 30;
  const progressPercent = Math.min((totalApprovedHours / annualGoal) * 100, 100);

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Member Portal</h1>
          <p className="text-muted-foreground text-sm md:text-base">Welcome back, {memberData.firstName} • ID: #{memberData.memberId}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isAdmin && (
                <Button variant="outline" asChild className="font-bold flex-1 md:flex-none">
                    <Link href="/admin-portal" className="gap-2"><LayoutDashboard className="h-4 w-4" /> Admin Portal</Link>
                </Button>
            )}
            <Button disabled className="font-bold bg-muted text-muted-foreground border-2 border-dashed flex-1 md:flex-none">
                <PlusCircle className="mr-2 h-5 w-5" />
                Log Hours (Coming Soon)
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Approved Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalApprovedHours} <span className="text-sm font-normal text-muted-foreground">/ {annualGoal}</span></div>
            <Progress value={progressPercent} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{serviceHours?.filter(h => h.status === 'pending').length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 italic">Waiting for officer approval</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 hidden lg:block">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Member Status</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary uppercase">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Grade {memberData.grade} • {isSuperAdmin ? 'Super Admin' : (adminData ? 'Officer' : 'Member')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-xl">
            <History className="h-5 w-5 text-primary" />
            Service History
          </CardTitle>
          <CardDescription>Your logged contributions and verification status.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {serviceHours && serviceHours.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Event Activity</TableHead>
                      <TableHead className="w-[80px]">Hours</TableHead>
                      <TableHead className="text-right w-[120px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceHours.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-xs">{log.date ? format(new Date(log.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                        <TableCell className="font-semibold">{log.eventName}</TableCell>
                        <TableCell>{log.hours}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={log.status === 'approved' ? 'default' : log.status === 'pending' ? 'outline' : 'destructive'} className="text-[10px] capitalize">
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="text-center py-20 bg-secondary/5 m-6 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground text-sm font-medium">No service logs found yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
