import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get in Touch',
  description: 'Contact the Kennesaw Mountain High School Beta Club leadership regarding membership, sponsorships, or service hour inquiries.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
