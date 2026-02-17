
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Event, EventType, Admin } from '@/lib/types';
import { Calendar, Clock, MapPin, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { AddEditEventDialog } from '@/components/events/add-edit-event-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const eventTypes: ['All', ...EventType[]] = ['All', 'Service', 'Social', 'Meeting', 'Fundraiser'];

function ClientDateTime({ dateTime, formatStr, className, tag: Tag = 'span' }: { dateTime: string, formatStr: string, className?: string, tag?: 'span' | 'div' }) {
    const [formatted, setFormatted] = useState<string | null>(null);
    useEffect(() => {
        setFormatted(format(new Date(dateTime), formatStr));
    }, [dateTime, formatStr]);

    if (!formatted) {
        return <Skeleton className={cn("h-5 w-32", className)} />;
    }
    return <Tag className={className}>{formatted}</Tag>;
}

function EventCard({ event, canManage }: { event: Event, canManage: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const badgeVariant = {
    Service: 'default',
    Social: 'secondary',
    Meeting: 'outline',
    Fundraiser: 'destructive',
  }[event.type] as 'default' | 'secondary' | 'outline' | 'destructive' | undefined;

  const handleDelete = () => {
    if (!event) return;
    const eventRef = doc(firestore, 'events', event.id);
    deleteDocumentNonBlocking(eventRef);
    toast({
      title: 'Event Deleted',
      description: `'${event.title}' has been removed.`,
    });
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden bg-card transition-all duration-300 hover:border-primary/80 hover:shadow-primary/10 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="font-headline text-xl text-foreground">{event.title}</CardTitle>
          <Badge variant={badgeVariant} className="flex-shrink-0">{event.type}</Badge>
        </div>
        <ClientDateTime dateTime={event.dateTime} formatStr="EEEE, MMMM do, yyyy" className="pt-2 text-primary/80" tag="div" />
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{event.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <ClientDateTime dateTime={event.dateTime} formatStr="p" />
            </div>
            <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{event.location}</span>
            </div>
        </div>
        {canManage && (
            <div className="w-full flex justify-end gap-2 border-t pt-4 mt-2">
                <AddEditEventDialog mode="edit" event={event}>
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                </AddEditEventDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the event &quot;{event.title}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

function EventsGrid({ events, canManage, filter }: { events: Event[], canManage: boolean, filter: EventType | 'All' }) {
    const filteredEvents = events.filter(event =>
        filter === 'All' ? true : event.type === filter
    );

    if (filteredEvents.length > 0) {
        return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map(event => (
                    <EventCard key={event.id} event={event} canManage={canManage} />
                ))}
            </div>
        );
    }

    return (
        <div className="py-16 text-center">
            <p className="text-xl text-muted-foreground">No upcoming events of this type.</p>
            {canManage && filter === 'All' && (
                <p className="mt-2 text-sm text-muted-foreground">Click &quot;Add Event&quot; to get started.</p>
            )}
        </div>
    );
}

export default function EventsPage() {
  const [filter, setFilter] = useState<typeof eventTypes[number]>('All');
  const firestore = useFirestore();
  const { user } = useUser();
  
  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);

  const canManage = !!adminData || user?.email === 'npatel012010@gmail.com';

  const eventsQuery = useMemoFirebase(
    () => query(collection(firestore, 'events'), orderBy('dateTime', 'asc')),
    [firestore]
  );
  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="flex flex-col items-center justify-between gap-4 mb-12 text-center sm:flex-row sm:text-left">
        <div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
            Upcoming Events
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Get involved! Here's what's happening in our Beta Club.
            </p>
        </div>
        {canManage && (
            <AddEditEventDialog mode="add">
                <Button size="lg">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add Event
                </Button>
            </AddEditEventDialog>
        )}
      </div>

      <Tabs defaultValue="All" onValueChange={(value) => setFilter(value as typeof eventTypes[number])} className="w-full">
        <div className="flex justify-center">
          <TabsList className="mb-8 grid grid-cols-3 bg-card sm:grid-cols-5">
            {eventTypes.map(type => (
              <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {isLoading ? (
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                        <CardFooter><Skeleton className="h-8 w-1/2" /></CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <TabsContent value={filter} forceMount>
                <EventsGrid events={events || []} canManage={canManage} filter={filter} />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
