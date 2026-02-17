
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Event, EventType } from '@/lib/types';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const eventTypes: EventType[] = ['Service', 'Social', 'Meeting', 'Fundraiser'];

const eventFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  location: z.string().min(2, 'Location is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm.'),
  type: z.enum(['Service', 'Social', 'Meeting', 'Fundraiser'], { required_error: 'Event type is required.' }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface AddEditEventDialogProps {
  mode: 'add' | 'edit';
  event?: Event;
  children: React.ReactNode;
  onEventAddedOrUpdated?: () => void;
}

export function AddEditEventDialog({ mode, event, children, onEventAddedOrUpdated }: AddEditEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      date: undefined,
      time: '12:00',
      type: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && event) {
        const eventDate = new Date(event.dateTime);
        form.reset({
          title: event.title,
          description: event.description,
          location: event.location,
          date: eventDate,
          time: format(eventDate, 'HH:mm'),
          type: event.type,
        });
      } else {
        form.reset({
            title: '',
            description: '',
            location: '',
            date: new Date(),
            time: '12:00',
            type: 'Service',
        });
      }
    }
  }, [isOpen, mode, event, form]);

  const onSubmit = async (data: EventFormValues) => {
    setIsLoading(true);
    try {
      const [hours, minutes] = data.time.split(':');
      const combinedDateTime = new Date(data.date);
      combinedDateTime.setHours(parseInt(hours, 10));
      combinedDateTime.setMinutes(parseInt(minutes, 10));

      const eventData: Omit<Event, 'id'> = {
        title: data.title,
        description: data.description,
        location: data.location,
        dateTime: combinedDateTime.toISOString(),
        type: data.type,
      };

      let eventRef;
      if (mode === 'add') {
        eventRef = doc(collection(firestore, 'events'));
      } else if (event) {
        eventRef = doc(firestore, 'events', event.id);
      } else {
        throw new Error('Cannot update event without ID.');
      }
      
      const finalData = { ...eventData, id: eventRef.id };
      setDocumentNonBlocking(eventRef, finalData, { merge: mode === 'edit' });

      toast({
        title: `Event ${mode === 'add' ? 'Created' : 'Updated'}`,
        description: `'${data.title}' has been saved successfully.`,
      });

      onEventAddedOrUpdated?.();
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Event' : 'Edit Event'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Fill out the details for the new event.' : `Editing '${event?.title}'.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Annual Food Drive" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select an event type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem><FormLabel>Time (24h format)</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., KMHS Front Entrance" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief description of the event." className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Saving...' : mode === 'add' ? 'Create Event' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
