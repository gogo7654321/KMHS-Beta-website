// Membership application (external Google Form) + open/close window.
// Everything about the application CTA is configured here so the deadline logic
// lives in one place.

export const APPLICATION_URL = 'https://forms.gle/CvsoeBcX43u9xkUA8';

// Deadline label shown to users.
export const APPLICATION_DEADLINE_LABEL = 'Monday, Aug 31 · 11:59 PM';

// Applications auto-close Monday, Aug 31, 2026 at 11:59 PM (America/New_York,
// EDT = UTC-4). After this moment the Apply buttons + countdown stop rendering
// everywhere — the CTAs cleanly disappear on their own.
export const APPLICATION_CLOSE = new Date('2026-08-31T23:59:00-04:00');

export function areApplicationsOpen(now: Date = new Date()): boolean {
  return now.getTime() < APPLICATION_CLOSE.getTime();
}
