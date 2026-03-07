
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Event, EventType, Admin } from '@/lib/types';
import { Calendar as CalendarIcon, Clock, MapPin, PlusCircle, Pencil, Trash2, History } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { AddEditEventDialog } from '@/components/events/add-edit-event-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const eventTypes: ['All', ...EventType[]] = ['All', 'Meeting', 'Service', 'Fundraiser', 'Social'];

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

function EventCard({ event, canManage, isEventPast }: { event: Event, canManage: boolean, isEventPast: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const getBadgeVariant = (type: string) => {
    switch (type) {
        case 'Meeting': return 'outline';
        case 'Service': return 'default';
        case 'Fundraiser': return 'destructive';
        case 'Social': return 'secondary';
        default: return 'default';
    }
  };

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
    <Card className={cn(
        "group flex h-full flex-col overflow-hidden bg-card transition-all duration-300",
        isEventPast ? "opacity-60 grayscale-[0.5]" : "hover:border-primary/80 hover:shadow-primary/10 hover:-translate-y-1"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className={cn("font-headline text-xl", isEventPast ? "text-muted-foreground" : "text-foreground")}>
            {event.title}
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-1">
                {(event.types || []).map(type => (
                    <Badge key={type} variant={isEventPast ? 'outline' : getBadgeVariant(type)} className="flex-shrink-0">
                        {type}
                    </Badge>
                ))}
            </div>
            {isEventPast && (
                <Badge variant="secondary" className="bg-muted text-muted-foreground border-none flex items-center gap-1">
                    <History className="h-3 w-3" /> Past
                </Badge>
            )}
          </div>
        </div>
        <ClientDateTime dateTime={event.dateTime} formatStr="EEEE, MMMM do, yyyy" className={cn("pt-2", isEventPast ? "text-muted-foreground" : "text-primary/80")} tag="div" />
      </CardHeader>
      <CardContent className="flex-grow">
        <p className={cn("text-sm", isEventPast ? "text-muted-foreground/80" : "text-muted-foreground")}>{event.description}</p>
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

export default function EventsPage() {
  const [filter, setFilter] = useState<typeof eventTypes[number]>('All');
  const [now, setNow] = useState(new Date());

  const firestore = useFirestore();
  const { user } = useUser();
  
  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);

  const canManage = !!adminData || user?.email === 'npatel012010@gmail.com';

  const eventsQuery = useMemoFirebase(
    () => query(collection(firestore, 'events'), orderBy('dateTime', 'desc')),
    [firestore]
  );
  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

  // Update "now" every minute to keep statuses fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const processedEvents = useMemo(() => {
    if (!events) return [];
    
    return events
        .filter(event => filter === 'All' ? true : event.types?.includes(filter as EventType))
        .map(event => ({
            ...event,
            isPast: isPast(new Date(event.dateTime))
        }))
        .sort((a, b) => {
            // Sort by status and date: Upcoming first (ascending), then Past (descending)
            if (a.isPast && !b.isPast) return 1;
            if (!a.isPast && b.isPast) return -1;
            
            const dateA = new Date(a.dateTime).getTime();
            const dateB = new Date(b.dateTime).getTime();
            
            // For upcoming: closer date first
            if (!a.isPast) return dateA - dateB;
            // For past: most recent past event first
            return dateB - dateA;
        });
  }, [events, filter, now]);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="flex flex-col items-center justify-between gap-4 mb-12 text-center sm:flex-row sm:text-left">
        <div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
            KMHS Beta Events
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Find out what&apos;s happening and view our chapter history.
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

      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full sm:w-auto overflow-x-auto">
                <TabsList className="bg-card">
                    {eventTypes.map(type => (
                        <TabsTrigger key={type} value={type}>{type}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
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
        ) : processedEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {processedEvents.map(event => (
                    <EventCard key={event.id} event={event} canManage={canManage} isEventPast={event.isPast} />
                ))}
            </div>
        ) : (
            <div className="py-24 text-center border-2 border-dashed rounded-xl bg-secondary/10">
                <p className="text-xl text-muted-foreground font-medium">No events found in this category.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or check back later.</p>
            </div>
        )}
      </div>
    </div>
  );
}
