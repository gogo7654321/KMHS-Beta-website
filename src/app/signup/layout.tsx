import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join',
  description: 'Create your KMHS Beta student member or officer account.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
