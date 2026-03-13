
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
import { PlusCircle, Clock, Award, History, CheckCircle2, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';
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

  // Determine if viewer is Super Admin
  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';

  // Check for existing member profile
  const memberDocRef = useMemoFirebase(() => user ? doc(firestore, 'members', user.uid) : null, [firestore, user]);
  const { data: memberData, isLoading: isMemberLoading } = useDoc<Member>(memberDocRef);

  // Check for admin profile (Leadership data)
  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  // Strictly guard the service hours query. 
  // It MUST NOT run if the member profile does not exist yet to prevent permission errors.
  const hoursQuery = useMemoFirebase(() => {
    // Only fetch if we have a user AND a confirmed member profile.
    if (!user || isMemberLoading || !memberData) return null;
    
    // We filter by memberId to ensure security rules pass for non-admins.
    return query(
      collection(firestore, 'service-hours'),
      where('memberId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, user, memberData, isMemberLoading]);

  const { data: serviceHours, isLoading: isHoursLoading } = useCollection<ServiceHour>(hoursQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login/member');
    }
  }, [user, isUserLoading, router]);

  /**
   * handleCreateMemberFromAdmin
   * Syncs existing leadership data into a member profile.
   */
  const handleCreateMemberFromAdmin = async () => {
    if (!user) return;
    setIsCreatingProfile(true);

    try {
      const memberDocRef = doc(firestore, 'members', user.uid);
      
      // Map leadership (admin) data to member data
      const newMemberData: Member = {
        id: user.uid,
        firstName: adminData?.firstName || user.displayName?.split(' ')[0] || 'Admin',
        lastName: adminData?.lastName || user.displayName?.split(' ')[1] || 'User',
        email: user.email || '',
        grade: adminData?.grade || 12, // Default to senior if unknown
        totalHours: 0,
      };

      // Set the document in Firestore
      setDocumentNonBlocking(memberDocRef, newMemberData, { merge: false });
      
      toast({
        title: "Profile Synced",
        description: "Your leadership details have been used to create your member profile.",
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
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

  // If the user is an admin (or super admin) but doesn't have a member profile yet
  if (!memberData && (adminData || isSuperAdmin)) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-20 w-20 text-primary mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold font-headline">Leadership Account Detected</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          You are currently signed in as {isSuperAdmin ? 'the Super Admin' : `a club officer (${adminData?.position})`}. 
          To view your personal dashboard and log hours, we need to initialize your member profile.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button onClick={handleCreateMemberFromAdmin} disabled={isCreatingProfile} size="lg" className="font-bold text-lg px-8">
                {isCreatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  'Create Member Profile'
                )}
            </Button>
            <Button variant="outline" size="lg" asChild>
                <Link href="/admin">Go to Admin Portal</Link>
            </Button>
        </div>
      </div>
    );
  }

  if (!memberData) {
      return (
        <div className="container mx-auto py-24 px-4 text-center">
            <h1 className="text-2xl font-bold">Profile Not Found</h1>
            <p className="mt-2 text-muted-foreground">We couldn't find a member profile associated with this account.</p>
            <Button asChild className="mt-6">
                <Link href="/signup/member">Register Now</Link>
            </Button>
        </div>
      );
  }

  const totalApprovedHours = serviceHours
    ? serviceHours.filter(h => h.status === 'approved').reduce((acc, h) => acc + h.hours, 0)
    : 0;

  const annualGoal = 30; // Defined by KMHS Beta Bylaws
  const progressPercent = Math.min((totalApprovedHours / annualGoal) * 100, 100);

  return (
    <div className="container mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-4xl font-bold">Welcome, {memberData.firstName}</h1>
          <p className="text-muted-foreground">KMHS Beta Club Member Portal</p>
        </div>
        <div className="flex gap-2">
            {isSuperAdmin && (
                <Button variant="outline" asChild>
                    <Link href="/admin">Admin View</Link>
                </Button>
            )}
            <Button asChild className="font-bold">
                <Link href="/portal/log-hours">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Log Service Hours
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
            <p className="text-xs text-muted-foreground mt-1">Annual Goal Progress</p>
            <Progress value={progressPercent} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {serviceHours?.filter(h => h.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Logs waiting for approval</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Member Status</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Grade {memberData.grade} • {isSuperAdmin ? 'Super Admin' : (adminData ? 'Officer' : 'Member')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <History className="h-5 w-5 text-primary" />
            Service History
          </CardTitle>
          <CardDescription>View all your volunteer contributions and their verification status.</CardDescription>
        </CardHeader>
        <CardContent>
          {serviceHours && serviceHours.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event/Activity</TableHead>
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
            <div className="text-center py-20 border-2 border-dashed rounded-lg bg-secondary/5">
              <p className="text-muted-foreground text-lg">No service hours found.</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/portal/log-hours">Submit Your First Log</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
