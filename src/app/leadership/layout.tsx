import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet the Officers',
  description: 'Meet the student officers and faculty advisors dedicated to the Kennesaw Mountain High School Beta mission of service, character, and leadership.',
};

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
