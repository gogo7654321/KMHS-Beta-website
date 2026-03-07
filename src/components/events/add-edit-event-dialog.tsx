
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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Event, EventType } from '@/lib/types';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

const eventTypes: EventType[] = ['Meeting', 'Service', 'Fundraiser', 'Social'];

const eventFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  location: z.string().min(2, 'Location is required.'),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm.'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:mm.').optional(),
  types: z.array(z.string()).min(1, 'Select at least one event type.'),
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
      endTime: '13:00',
      types: [],
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
          endTime: event.endTime || format(new Date(eventDate.getTime() + 3600000), 'HH:mm'),
          types: event.types || [],
        });
      } else {
        form.reset({
            title: '',
            description: '',
            location: '',
            date: new Date(),
            time: '12:00',
            endTime: '13:00',
            types: [],
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
        endTime: data.endTime,
        types: data.types as EventType[],
        rsvpEnabled: false,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
             
             <FormField
              control={form.control}
              name="types"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Event Categories</FormLabel>
                    <FormDescription>
                      Select one or more categories that this event falls under.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {eventTypes.map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="types"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={type}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(type)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== type
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {type}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <div className="grid grid-cols-2 gap-2">
                  <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                      <FormItem><FormLabel>End</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                </div>
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
