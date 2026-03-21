import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Member Login',
  description: 'Access the KMHS Beta chapter portal to log service hours and RSVP for events.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
