
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, orderBy, deleteField } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Event, EventType, Album } from '@/lib/types';
import { CalendarIcon, Loader2, Link as LinkIcon } from 'lucide-react';
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
  albumId: z.string().optional(),
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

  const albumsQuery = useMemoFirebase(() => query(collection(firestore, 'albums'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: albums } = useCollection<Album>(albumsQuery);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      date: new Date(),
      time: '12:00',
      endTime: '13:00',
      types: [],
      albumId: 'none',
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
          albumId: event.albumId || 'none',
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
            albumId: 'none',
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

      // Firestore's setDoc rejects `undefined` field values, so build the
      // payload without undefined fields. Only include optional fields when set.
      const eventData: Record<string, any> = {
        title: data.title,
        description: data.description,
        location: data.location,
        dateTime: combinedDateTime.toISOString(),
        types: data.types as EventType[],
        rsvpEnabled: false,
      };

      if (data.endTime) {
        eventData.endTime = data.endTime;
      }

      const hasAlbum = data.albumId && data.albumId !== 'none';
      if (hasAlbum) {
        eventData.albumId = data.albumId;
      } else if (mode === 'edit') {
        // Clear any previously-linked album when "None" is selected.
        eventData.albumId = deleteField();
      }

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
        description: `'${data.title}' saved.`,
      });

      onEventAddedOrUpdated?.();
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">{mode === 'add' ? 'Add New Event' : 'Edit Event'}</DialogTitle>
          <DialogDescription>
            Configure the details and optional gallery linkage for this event.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
            <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Winter Interest Meeting" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             
             <FormField
              control={form.control}
              name="types"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Event Categories</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
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
                              <FormLabel className="font-normal cursor-pointer text-sm">
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
                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
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

            <div className="rounded-lg border bg-secondary/10 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                    <LinkIcon className="h-4 w-4" /> Gallery Linkage
                </div>
                <FormField control={form.control} name="albumId" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-xs">Link to Gallery Album</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="No album linked" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="none">None (No Link)</SelectItem>
                                {albums?.map(album => (
                                    <SelectItem key={album.id} value={album.id}>{album.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription className="text-[10px]">
                            Links this event to a collection of photos.
                        </FormDescription>
                    </FormItem>
                )}/>
            </div>

            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., KMHS Fine Arts Hall" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Full event details..." className="resize-none min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
              <Button type="submit" disabled={isLoading} className="w-full font-bold h-12 sm:h-10">
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
