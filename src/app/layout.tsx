import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: {
    default: 'Kennesaw Mountain High School Beta Club | Service & Leadership',
    template: '%s | Kennesaw Mountain High School Beta'
  },
  description: 'The official National Beta Club chapter at Kennesaw Mountain High School. Fostering service, character, and academic achievement in Kennesaw, Georgia and Cobb County.',
  keywords: ['Kennesaw Mountain High School', 'KMHS', 'Beta Club', 'Kennesaw GA', 'Cobb County Schools', 'Service Hours', 'High School Volunteering', 'Kennesaw Student Leadership'],
  authors: [{ name: 'Kennesaw Mountain Beta' }],
  creator: 'Kennesaw Mountain High School',
  icons: {
    icon: [
      { url: '/kmhs%20beta%20club%20logo.png' },
      { url: '/kmhs%20beta%20club%20logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/kmhs%20beta%20club%20logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/kmhs%20beta%20club%20logo.png',
    apple: '/kmhs%20beta%20club%20logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kmhsbeta.com',
    siteName: 'Kennesaw Mountain High School Beta Club',
    title: 'Kennesaw Mountain High School Beta Club',
    description: 'Lead by Serving Others at Kennesaw Mountain High School.',
    images: [{ url: '/kmhs%20beta%20club%20logo.png', width: 800, height: 600, alt: 'KMHS Beta Logo' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700;900&family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body text-foreground antialiased'
        )}
      >
        {/* Google Analytics Tag */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C5B5LH4Y20"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-C5B5LH4Y20');
          `}
        </Script>
        <FirebaseClientProvider>
          <div className="relative flex min-h-dvh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
