
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';

/**
 * GET /api/events/feed
 * Generates an iCalendar (.ics) feed of all club events.
 * This URL can be added to Google Calendar, Apple Calendar, etc.
 * The calendar will automatically refresh periodically to show new events.
 */
export async function GET() {
  // Initialize Firebase for the edge/server environment
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);

  try {
    // Fetch all events, ordered by date
    const eventsQuery = query(collection(db, 'events'), orderBy('dateTime', 'desc'));
    const snapshot = await getDocs(eventsQuery);
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // ICAL format construction
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KMHS Beta//Events Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:KMHS Beta Events',
      'X-WR-TIMEZONE:America/New_York',
    ];

    events.forEach((event: any) => {
      const startDate = new Date(event.dateTime);
      // Format: YYYYMMDDTHHMMSSZ
      const formattedStart = format(startDate, "yyyyMMdd'T'HHmmss'Z'");
      
      // Default end time to 1 hour after start if not provided
      let endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      if (event.endTime) {
          try {
              const [hours, minutes] = event.endTime.split(':');
              endDate = new Date(startDate);
              endDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          } catch (e) {
              console.error("Failed to parse end time for ics", e);
          }
      }
      const formattedEnd = format(endDate, "yyyyMMdd'T'HHmmss'Z'");

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${event.id}@kmhsbeta.com`);
      icsContent.push(`DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`);
      icsContent.push(`DTSTART:${formattedStart}`);
      icsContent.push(`DTEND:${formattedEnd}`);
      icsContent.push(`SUMMARY:${event.title}`);
      icsContent.push(`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`);
      icsContent.push(`LOCATION:${event.location}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    // Return the .ics content with correct headers for subscription
    return new NextResponse(icsContent.join('\r\n'), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="kmhs-beta-events.ics"',
        // Cache-Control ensures clients know it's dynamic but allows some caching
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Failed to generate calendar feed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
