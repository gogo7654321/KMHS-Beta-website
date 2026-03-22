'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Event, EventType, Admin } from '@/lib/types';
import { Calendar as CalendarIcon, Clock, MapPin, PlusCircle, Pencil, Trash2, History, Share2, Copy } from 'lucide-react';
import { format, isPast, parse } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { AddEditEventDialog } from '@/components/events/add-edit-event-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const eventTypes: ['All', ...EventType[]] = ['All', 'Meeting', 'Service', 'Fundraiser', 'Social'];

function ClientDateTime({ dateTime, endTime, formatStr, className, tag: Tag = 'span' }: { dateTime: string, endTime?: string, formatStr: string, className?: string, tag?: 'span' | 'div' }) {
    const [formatted, setFormatted] = useState<string | null>(null);
    useEffect(() => {
        const start = new Date(dateTime);
        let timeLabel = format(start, formatStr);
        if (endTime && formatStr === 'p') {
            try {
                const endParsed = parse(endTime, 'HH:mm', new Date());
                timeLabel = `${format(start, 'h:mm a')} - ${format(endParsed, 'h:mm a')}`;
            } catch (e) {
                console.error("Failed to parse end time", e);
            }
        } else if (formatStr !== 'p') {
             timeLabel = format(start, formatStr);
        }
        setFormatted(timeLabel);
    }, [dateTime, endTime, formatStr]);

    if (!formatted) {
        return <Skeleton className={cn("h-5 w-32", className)} />;
    }
    return <Tag className={className}>{formatted}</Tag>;
}

function EventCard({ event, canManage, isEventPast }: { event: Event, canManage: boolean, isEventPast: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();

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
        "group flex h-full flex-col overflow-hidden transition-all duration-300 border-2",
        isEventPast 
            ? "bg-card border-border/50" 
            : "bg-amber-400 border-amber-500 shadow-lg shadow-amber-400/20 hover:-translate-y-1"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className={cn(
            "font-headline text-xl", 
            isEventPast ? "text-foreground" : "text-amber-950 font-black"
          )}>
            {event.title}
          </CardTitle>
          <div className="flex flex-col items-end gap-1">
            <div className="flex flex-wrap justify-end gap-1">
                {(event.types || []).map(type => (
                    <Badge key={type} variant={isEventPast ? 'outline' : 'secondary'} className={cn(
                        "flex-shrink-0",
                        !isEventPast && "bg-amber-950 text-amber-50 border-none"
                    )}>
                        {type}
                    </Badge>
                ))}
            </div>
            {isEventPast && (
                <Badge variant="destructive" className="flex items-center gap-1 text-xs px-3 py-1 font-bold uppercase tracking-wider">
                    <History className="h-3 w-3" /> Past
                </Badge>
            )}
          </div>
        </div>
        <ClientDateTime 
            dateTime={event.dateTime} 
            formatStr="EEEE, MMMM do, yyyy" 
            className={cn("pt-2 font-semibold", isEventPast ? "text-primary/80" : "text-amber-900")} 
            tag="div" 
        />
      </CardHeader>
      <CardContent className="flex-grow">
        <p className={cn(
            "text-sm font-medium", 
            isEventPast ? "text-muted-foreground" : "text-amber-900/90"
        )}>
            {event.description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className={cn(
            "flex flex-col items-start gap-2 text-sm",
            isEventPast ? "text-muted-foreground" : "text-amber-950 font-bold"
        )}>
            <div className="flex items-center gap-2">
            <Clock className={cn("h-4 w-4", isEventPast ? "text-primary" : "text-amber-950")} />
            <ClientDateTime dateTime={event.dateTime} endTime={event.endTime} formatStr="p" />
            </div>
            <div className="flex items-center gap-2">
            <MapPin className={cn("h-4 w-4", isEventPast ? "text-primary" : "text-amber-950")} />
            <span>{event.location}</span>
            </div>
        </div>
        {canManage && (
            <div className={cn(
                "w-full flex justify-end gap-2 border-t pt-4 mt-2",
                isEventPast ? "border-border/50" : "border-amber-900/20"
            )}>
                <AddEditEventDialog mode="edit" event={event}>
                    <Button variant="ghost" size="icon" className={!isEventPast ? "hover:bg-amber-500/20 text-amber-950" : ""}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </AddEditEventDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={!isEventPast ? "hover:bg-red-500/20 text-red-900" : "text-destructive"}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
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
  const { toast } = useToast();
  
  const adminDocRef = useMemoFirebase(() => (user ? doc(firestore, 'admin', user.uid) : null), [firestore, user]);
  const { data: adminData } = useDoc<Admin>(adminDocRef);

  const canManage = !!adminData || user?.email === 'npatel012010@gmail.com';

  const eventsQuery = useMemoFirebase(
    () => query(collection(firestore, 'events'), orderBy('dateTime', 'desc')),
    [firestore]
  );
  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

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
            if (a.isPast && !b.isPast) return 1;
            if (!a.isPast && b.isPast) return -1;
            
            const dateA = new Date(a.dateTime).getTime();
            const dateB = new Date(b.dateTime).getTime();
            
            if (!a.isPast) return dateA - dateB;
            return dateB - dateA;
        });
  }, [events, filter, now]);

  const handleCopyFeedUrl = () => {
    const feedUrl = `${window.location.origin}/api/events/feed`;
    navigator.clipboard.writeText(feedUrl);
    toast({
        title: "URL Copied!",
        description: "Add this link as a 'Subscription' or 'From URL' in your calendar app.",
    });
  };

  const handleSubscribe = () => {
    const feedUrl = `${window.location.origin}/api/events/feed`.replace(/^https?:\/\//, 'webcal://');
    window.location.href = feedUrl;
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="flex flex-col items-center justify-between gap-4 mb-12 text-center sm:flex-row sm:text-left">
        <div>
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl">
            Upcoming Events
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Stay updated with Kennesaw Mountain High School Beta activities and achievements.
            </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2">
                        <Share2 className="h-5 w-5" />
                        Sync Calendar
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-bold leading-none">Live Sync</h4>
                        <p className="text-sm text-muted-foreground">
                            Automatically sync Kennesaw Mountain Beta events to your device.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Button onClick={handleSubscribe} className="w-full font-bold">
                            Sync with Device
                        </Button>
                        <Button variant="outline" onClick={handleCopyFeedUrl} className="w-full gap-2">
                            <Copy className="h-4 w-4" />
                            Copy Feed URL
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {canManage && (
                <AddEditEventDialog mode="add">
                    <Button size="lg" className="bg-amber-400 text-amber-950 hover:bg-amber-500 font-bold border-2 border-amber-500">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Add Event
                    </Button>
                </AddEditEventDialog>
            )}
        </div>
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