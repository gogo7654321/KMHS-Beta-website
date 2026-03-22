import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meet the Leadership',
  description: 'Meet the student officers and faculty advisors dedicated to the Kennesaw Mountain High School Beta mission of service and character.',
};

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}