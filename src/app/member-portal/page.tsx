
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
import { PlusCircle, Clock, Award, History, CheckCircle2, AlertCircle, ShieldAlert, Loader2, LayoutDashboard } from 'lucide-react';
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

  // Check if current user is the Super Admin by email
  const isSuperAdmin = user?.email === 'npatel012010@gmail.com';

  // Check for existing member profile
  const memberDocRef = useMemoFirebase(() => user ? doc(firestore, 'members', user.uid) : null, [firestore, user]);
  const { data: memberData, isLoading: isMemberLoading } = useDoc<Member>(memberDocRef);

  // Check for admin profile to see if this is an officer
  const adminDocRef = useMemoFirebase(() => user ? doc(firestore, 'admin', user.uid) : null, [firestore, user]);
  const { data: adminData, isLoading: isAdminLoading } = useDoc<Admin>(adminDocRef);

  const isAdmin = !!adminData || isSuperAdmin;

  // The query only runs when user, memberData, and loading states are settled.
  // This prevents permission errors that occur when querying before the profile exists.
  const hoursQuery = useMemoFirebase(() => {
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
      
      // Creating a completely new member account document using leadership data as source
      const newMemberData: Member = {
        id: user.uid,
        memberId: generateMemberId(),
        firstName: adminData?.firstName || user.displayName?.split(' ')[0] || 'Member',
        lastName: adminData?.lastName || user.displayName?.split(' ')[1] || 'User',
        email: user.email || '',
        grade: adminData?.grade || 12,
        totalHours: 0,
      };

      // Set without merge to ensure a clean new member document is created
      setDocumentNonBlocking(memberDocRef, newMemberData, { merge: false });
      
      toast({
        title: "Member Profile Created",
        description: `Welcome, ${newMemberData.firstName}! Your dashboard is ready.`,
      });
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
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

  // If the user is an admin or super admin but has NO member profile, prompt for creation.
  if (!memberData && isAdmin) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center text-center">
        <ShieldAlert className="h-20 w-20 text-primary mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold font-headline">Member Dashboard Initialization</h1>
        <p className="mt-4 text-muted-foreground max-w-md">
          Hello {adminData?.firstName || 'Officer'}! You are logged into the Member Portal, but we haven't created a member record for you yet. 
          Would you like to initialize your service dashboard?
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
                <Link href="/admin-portal">Return to Admin Portal</Link>
            </Button>
        </div>
      </div>
    );
  }

  if (!memberData) {
      return (
        <div className="container mx-auto py-24 px-4 text-center">
            <h1 className="text-2xl font-bold">Member Account Required</h1>
            <p className="mt-2 text-muted-foreground">We couldn't find a member profile for this account.</p>
            <Button asChild className="mt-6">
                <Link href="/signup/member">Create Member Account</Link>
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
          <h1 className="font-headline text-4xl font-bold">Welcome, {memberData.firstName}</h1>
          <p className="text-muted-foreground">KMHS Beta Club • Member ID: #{memberData.memberId}</p>
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
                    Log Service Hours
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-primary/20 bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Verified Hours</CardTitle>
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
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {serviceHours?.filter(h => h.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Logs awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Account Status</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">Active</div>
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
          <CardDescription>All your logged volunteer contributions.</CardDescription>
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

function ShieldAlert({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
        </svg>
    );
}
