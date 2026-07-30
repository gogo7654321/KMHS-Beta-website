'use client';

import React, { useState, useEffect } from 'react';

export default function PrivacyPolicyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16 md:px-6">
      <h1 className="font-headline text-4xl font-bold mb-8 text-primary uppercase tracking-tight">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
        <p className="italic">Last Updated: {mounted ? new Date().toLocaleDateString() : 'Loading date...'}</p>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
          <p>The Kennesaw Mountain High School (KMHS) Beta Club Chapter operates this portal to facilitate club management and service tracking. We respect the privacy of our student members and visitors.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">2. Information Collection</h2>
          <p>We collect information necessary for chapter operations, including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Member Profiles:</strong> Name, school-affiliated email, and grade level.</li>
            <li><strong>Service Records:</strong> Descriptions and durations of volunteer activities.</li>
            <li><strong>Public Submissions:</strong> Photos and stories provided for the blog or gallery.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">3. Google AdSense & Cookies</h2>
          <p>This website may display advertisements served by Google AdSense. Google uses cookies to serve ads based on your visit to this site and other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" className="text-primary hover:underline">Google Ad Settings</a>.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">4. Use of Data</h2>
          <p>Collected data is used strictly to verify service hour requirements, manage event RSVPs, and showcase chapter impact. We do not sell student data to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">5. Educational Compliance</h2>
          <p>As an organization within Kennesaw Mountain High School, we strive to comply with all student privacy regulations and school board policies regarding digital platforms.</p>
        </section>
      </div>
    </div>
  );
}
