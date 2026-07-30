'use client';

import React, { useState, useEffect } from 'react';

export default function TermsOfServicePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 md:px-6">
      <h1 className="font-headline text-4xl font-bold mb-8 text-primary uppercase tracking-tight">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
        <p className="italic">Last Updated: {mounted ? new Date().toLocaleDateString() : 'Loading date...'}</p>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By using the KMHS Beta Club portal, you agree to these terms and the student code of conduct established by Kennesaw Mountain High School and the National Beta Club.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">2. Integrity in Reporting</h2>
          <p>Service and leadership are the pillars of our club. Users agree that all service hour logs submitted through this portal will be accurate and truthful. Falsifying records is grounds for immediate chapter dismissal and school disciplinary action.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">3. Content Ownership</h2>
          <p>Content submitted to the blog or gallery remains the property of the student author, but by submitting, you grant the KMHS Beta Club a non-exclusive right to display that content publicly to promote the club's mission.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">4. Proper Use</h2>
          <p>This portal is intended for official club business. Any attempt to disrupt the service, scrape data, or access unauthorized administrative areas is strictly prohibited.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">5. Termination</h2>
          <p>The chapter leadership and faculty advisors reserve the right to suspend or terminate portal access for any user who violates these terms or no longer meets the club's academic and service requirements.</p>
        </section>
      </div>
    </div>
  );
}
