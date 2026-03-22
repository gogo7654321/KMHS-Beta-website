import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources & Bylaws',
  description: 'Helpful resources, club documentation, and the official chapter bylaws for Kennesaw Mountain High School Beta members.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
