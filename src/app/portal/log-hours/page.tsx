
'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const hoursSchema = z.object({
  eventName: z.string().min(2, 'Event name is required'),
  hours: z.coerce.number().min(0.5, 'Minimum 0.5 hours required').max(24, 'Cannot log more than 24 hours'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(5, 'Brief description required'),
});

type HoursFormValues = z.infer<typeof hoursSchema>;

export default function LogHoursPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<HoursFormValues>({
    resolver: zodResolver(hoursSchema),
    defaultValues: {
      eventName: '',
      hours: 1,
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const onSubmit = async (data: HoursFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const hourData = {
        memberId: user.uid,
        eventName: data.eventName,
        hours: data.hours,
        date: data.date,
        description: data.description,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      addDocumentNonBlocking(collection(firestore, 'service-hours'), hourData);
      
      toast({
        title: "Hours Logged",
        description: "Your service log has been submitted for review.",
      });
      
      router.push('/portal');
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message || "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 flex flex-col items-center">
      <div className="mb-6 w-full max-w-[600px]">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/portal">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-[600px] border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Log Service Hours</CardTitle>
          <CardDescription>
            Submit your volunteer activity for verification.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event / Activity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Winter Food Drive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Worked</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Service</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of Work</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What did you do at this event?" 
                        className="min-h-[100px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full font-bold gap-2" disabled={isLoading}>
                {isLoading ? 'Submitting...' : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Log for Review
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
