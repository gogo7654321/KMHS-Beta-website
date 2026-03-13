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

export default function MemberPortalPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Determine if current user is Super Admin
  const isSuperAdmin = user?.email === 'npatel012010@gmail.com';

  // Fetch Member profile
  const memberDocRef = useMemoFirebase(() => user ? doc(firestore, 'members', user.uid) : null, [firestore, user]);
  const { data: memberData, isLoading: isMemberLoading } = useDoc<Member>(memberDocRef);

  // Fetch Leadership profile
  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  // Define isAdmin for local checks
  const isAdmin = !!adminData || isSuperAdmin;

  // Protected query: Only run if we have a user AND a confirmed member profile to avoid permission ghosts
  const hoursQuery = useMemoFirebase(() => {
    // SECURITY CRITICAL: This query MUST be filtered by memberId to match common member-level security rules.
    if (!user || isMemberLoading || !memberData) return null;
    
    return query(
      collection(firestore, 'service-hours'),
      where('memberId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, user?.uid, memberData?.id, isMemberLoading]);

  const { data: serviceHours, isLoading: isHoursLoading } = useCollection<ServiceHour>(hoursQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/member');
    }
  }, [user, isUserLoading, router]);

  // Generates a random 5-digit numeric member ID
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
      
      toast({
        title: "Member Profile Initialized",
        description: `Welcome, ${newMemberData.firstName}! Your 5-digit ID is #${newMemberData.memberId}.`,
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Initialization Failed",
        description: error.message || "Failed to create member profile.",
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  if (isUserLoading || isMemberLoading || isAdminLoading || (hoursQuery && isHoursLoading)) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!memberData && isAdmin) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-20 w-20 text-primary mb-6 animate-bounce" />
        <h1 className="text-3xl font-bold font-headline">Member Portal Setup</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Hello {adminData?.firstName || 'Officer'}! You are logged into the Member Portal, but you don't have a member record yet. 
          Initialize your dashboard to start logging your own service hours.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button onClick={handleCreateMemberFromAdmin} disabled={isCreatingProfile} size="lg" className="font-bold text-lg px-8">
                {isCreatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Create My Member Profile'
                )}
            </Button>
            <Button variant="outline" size="lg" asChild>
                <Link href="/admin-portal">Go to Admin Portal</Link>
            </Button>
        </div>
      </div>
    );
  }

  if (!memberData) {
      return (
        <div className="container mx-auto py-24 px-4 text-center">
            <h1 className="text-2xl font-bold">Registration Required</h1>
            <p className="mt-2 text-muted-foreground">We couldn't find a member profile for this account.</p>
            <Button asChild className="mt-6">
                <Link href="/signup/member">Join the Chapter</Link>
            </Button>
        </div>
      );
  }

  const totalApprovedHours = serviceHours
    ? serviceHours.filter(h => h.status === 'approved').reduce((acc, h) => acc + h.hours, 0)
    : 0;

  const annualGoal = 30;
  const progressPercent = Math.min((totalApprovedHours / annualGoal) * 100, 100);

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold">Member Portal</h1>
          <p className="text-muted-foreground">Welcome back, {memberData.firstName} • ID: #{memberData.memberId}</p>
        </div>
        <div className="flex gap-2">
            {isAdmin && (
                <Button variant="outline" asChild>
                    <Link href="/admin-portal" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" /> Admin Portal
                    </Link>
                </Button>
            )}
            <Button asChild className="font-bold">
                <Link href="/member-portal/log-hours">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Log Hours
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Approved Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalApprovedHours} <span className="text-sm font-normal text-muted-foreground">/ {annualGoal}</span></div>
            <p className="text-xs text-muted-foreground mt-1">Goal Completion</p>
            <Progress value={progressPercent} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {serviceHours?.filter(h => h.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Member Status</CardTitle>
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
          <CardTitle className="flex items-center gap-2 font-headline">
            <History className="h-5 w-5 text-primary" />
            Service History
          </CardTitle>
          <CardDescription>Your logged volunteer contributions and status.</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceHours && serviceHours.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceHours.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">{log.date ? format(new Date(log.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                    <TableCell className="font-semibold">{log.eventName}</TableCell>
                    <TableCell>{log.hours}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={
                        log.status === 'approved' ? 'default' : 
                        log.status === 'pending' ? 'outline' : 'destructive'
                      } className="gap-1 capitalize">
                        {log.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {log.status === 'pending' && <Clock className="h-3 w-3 animate-pulse" />}
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-24 border-2 border-dashed rounded-lg bg-secondary/5">
              <p className="text-muted-foreground text-lg font-medium">No service history yet.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/member-portal/log-hours">Log Your First Activity</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
