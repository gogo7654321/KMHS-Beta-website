
'use client';

import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Member, ServiceHour, Admin } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Clock, Award, History, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function MemberPortalPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const isSuperAdmin = user?.email === 'npatel012010@gmail.com';

  // Check for member profile
  const memberDocRef = useMemoFirebase(() => user ? doc(firestore, 'members', user.uid) : null, [firestore, user]);
  const { data: memberData, isLoading: isMemberLoading } = useDoc<Member>(memberDocRef);

  // Check for admin profile
  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  const hoursQuery = useMemoFirebase(() => {
    if (!user) return null;
    
    // Only run query if profile is loaded or user is super admin (who has immediate access)
    const canQuery = isSuperAdmin || memberData || adminData;
    const stillLoading = isMemberLoading || isAdminLoading;
    
    if (!canQuery && !stillLoading) return null;
    if (stillLoading) return null;
    
    return query(
      collection(firestore, 'service-hours'),
      where('memberId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, user, memberData, adminData, isMemberLoading, isAdminLoading, isSuperAdmin]);

  const { data: serviceHours, isLoading: isHoursLoading } = useCollection<ServiceHour>(hoursQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/member');
    }
  }, [user, isUserLoading, router]);

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

  // If the user is an admin but doesn't have a member profile
  if (!memberData && (adminData || isSuperAdmin)) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-16 w-16 text-primary mb-6" />
        <h1 className="text-3xl font-bold">Leadership Account Detected</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          You are logged in as {isSuperAdmin ? 'the Super Admin' : `an administrator (${adminData?.position})`}. To access the member portal features like service hour tracking, you must also have a member profile.
        </p>
        <div className="mt-8 flex gap-4">
            <Button asChild variant="outline">
                <Link href="/admin">Go to Admin Portal</Link>
            </Button>
            <Button asChild>
                <Link href="/signup/member">Create Member Profile</Link>
            </Button>
        </div>
      </div>
    );
  }

  if (!memberData) {
      return (
        <div className="container mx-auto py-12 px-4 text-center">
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
            <p className="mt-2 text-muted-foreground">We couldn't find a member profile associated with this account.</p>
            <Button asChild className="mt-6">
                <Link href="/signup/member">Complete Registration</Link>
            </Button>
        </div>
      );
  }

  const totalApprovedHours = serviceHours
    ? serviceHours.filter(h => h.status === 'approved').reduce((acc, h) => acc + h.hours, 0)
    : 0;

  const annualGoal = 30; // From bylaws
  const progressPercent = Math.min((totalApprovedHours / annualGoal) * 100, 100);

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold">Welcome, {memberData.firstName}</h1>
          <p className="text-muted-foreground">KMHS Beta Club Member Portal</p>
        </div>
        <Button asChild className="font-bold">
          <Link href="/portal/log-hours">
            <PlusCircle className="mr-2 h-5 w-5" />
            Log Service Hours
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApprovedHours} / {annualGoal}</div>
            <p className="text-xs text-muted-foreground mt-1">Annual Goal Progress</p>
            <Progress value={progressPercent} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceHours?.filter(h => h.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Logs waiting for leadership review</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Status</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">In Good Standing</div>
            <p className="text-xs text-muted-foreground mt-1">Grade {memberData.grade} Member</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Service History
          </CardTitle>
          <CardDescription>Your logged volunteer activities and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceHours && serviceHours.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event/Activity</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceHours.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="font-medium">{log.eventName}</TableCell>
                    <TableCell>{log.hours}</TableCell>
                    <TableCell>
                      <Badge variant={
                        log.status === 'approved' ? 'default' : 
                        log.status === 'pending' ? 'outline' : 'destructive'
                      } className="gap-1">
                        {log.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                        {log.status === 'pending' && <Clock className="h-3 w-3" />}
                        {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-secondary/5">
              <p className="text-muted-foreground">No service hours logged yet.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/portal/log-hours">Log Your First Hour</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
