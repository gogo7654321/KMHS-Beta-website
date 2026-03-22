import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get in Touch',
  description: 'Contact Kennesaw Mountain High School Beta leadership regarding community partnerships, service opportunities, or student membership.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
