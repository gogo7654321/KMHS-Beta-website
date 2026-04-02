'use client';

import React from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Admin } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BylawsEditor } from '@/components/faq/bylaws-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { Shield, Clock, Info } from 'lucide-react';

const DEFAULT_BYLAWS = `# Article I: Membership & Academic Standing

## Academic Requirements
A minimum 3.5 unweighted GPA is required for all general members. Executive officers and administrators must maintain a higher standard of a 3.7 unweighted GPA.

## Probation
Any member falling below their respective GPA threshold will be placed on 'Administrative Probation' for exactly one semester. Failure to return to the required GPA by the end of said semester results in permanent removal from the chapter roster.

## Service Mandate
Members must complete a minimum of 30 individual service hours per academic year. This includes participation in mandatory club-wide service projects.

# Article II: Financial Obligations & Dues

## New Member Fees
A one-time fee of $50 is required for new inductees, covering National Beta induction, certificate, and the official chapter T-shirt.

## Returning Member Fees
An annual fee of $25 is required for returning members, covering chapter operations and the current year’s T-shirt.

## Hard Deadline Clause
All dues must be paid in full by the date specifically designated by the Executive Leadership Team. Failure to meet this deadline will result in immediate forfeiture of membership and removal from the official National Beta Club registry without exception.

# Article III: Attendance & Accountability

## General Meetings
Meetings are held the 2nd and 4th Wednesday of each month.

## The Dismissal Threshold
Any member who accumulates three (3) consecutive absences or seven (7) total absences within one academic year shall be summarily dismissed.

## Mandatory Review
Members missing any meeting must schedule a 1-on-1 accountability session with the Faculty Advisor or the Director of Membership to justify their continued status in the club.

# Article IV: Executive Board & Governance

## Supreme Authority
In accordance with school policy, the Faculty Advisor maintains 100% discretionary power over all club operations, including the appointment, reassignment, and removal of any officer or member.

## The Executive Committee
The President, Vice President, and Faculty Advisor constitute the 'Executive Committee.'

## Officer Removal
An officer may be removed from their position if the Executive Committee (Pres/VP/Advisor) reaches a unanimous consensus, or by direct mandate of the Faculty Advisor.

## Attendance for Leaders
Board members are held to a higher standard. Missing two (2) board meetings (staff or convention prep) constitutes an automatic resignation of the title.

# Article V: Structural Reorganization (The 'Sunset' Clause)

## Operational Efficiency
The Executive Committee is required to review the board’s structure every six months to ensure 'Lean Operations.'

## Role Dissolution
The Executive Committee reserves the absolute right to dissolve, merge, or 'sunset' any Board of Directors position (including Ambassadors, Co-Treasurers, or specialized Directors) if the role is deemed redundant or no longer serves the club's immediate strategic goals.

## Transfer of Duties
Upon the dissolution of a role, all remaining responsibilities shall revert to the Core Executive Board.

# Article VI: Convention & Competition

## Mandatory Competition
To maintain an active leadership title, all Board members must compete in at least one category at the State or National Convention.

## Exemptions
Exceptions are strictly limited to 'Special Circumstances' and must be vetted and approved by a joint vote of the Vice President and the Secretary.`;

interface BylawsContent {
  content: string;
  updatedAt?: string;
}

export default function BylawsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);

  const bylawsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'bylaws'), [firestore]);
  const { data: bylawsData, isLoading } = useDoc<BylawsContent>(bylawsDocRef);

  const isSuperAdmin = user?.email === 'npatel012010@gmail.com' || user?.uid === 'rSpqFXxlV4fxauxvGXNxYy2Njlx1';
  const canEdit = !!adminData || isSuperAdmin;

  const content = bylawsData?.content || DEFAULT_BYLAWS;
  const updateDate = bylawsData?.updatedAt ? new Date(bylawsData.updatedAt) : new Date('2026-01-01T00:00:00Z');

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
        <div className="text-center sm:text-left">
          <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl text-primary">
            Chapter Bylaws
          </h1>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Effective: {format(updateDate, 'MMMM d, yyyy')}
            </span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block"></span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Governing: KMHS Executive Committee
            </span>
          </div>
        </div>
        {canEdit && <BylawsEditor initialContent={content} />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-20 w-full mt-8" />
        </div>
      ) : (
        <article className="prose prose-invert prose-primary max-w-none rounded-xl border border-border/50 bg-secondary/10 p-8 shadow-2xl md:p-12">
          <div className="mb-8 flex items-center gap-3 rounded-lg bg-primary/10 p-4 text-sm text-primary">
            <Info className="h-5 w-5 shrink-0" />
            <p className="font-medium">
              These regulations serve as the supreme operating authority for the Kennesaw Mountain High School National Beta Club chapter.
            </p>
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      )}

      <div className="mt-12 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
        End of Official Document • KMHS Beta Chapter
      </div>
    </div>
  );
}
