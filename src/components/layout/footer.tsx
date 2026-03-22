import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { Button } from '../ui/button';
import Image from 'next/image';
import { placeholderImages } from '@/lib/data';

export function Footer() {
  const betaLogo = placeholderImages.find(p => p.id === 'beta-logo');

  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/30">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
             {betaLogo && <Image src={betaLogo.imageUrl} alt="Beta Club Logo" width={45} height={45} className="h-10 w-auto" />}
            <div className="text-center sm:text-left">
              <p className="font-headline text-lg font-bold text-primary">Kennesaw Mountain High School Beta</p>
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} All rights reserved.</p>
              <div className="flex gap-3 mt-1 justify-center sm:justify-start">
                <Link href="/privacy" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 sm:items-end">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10">
                <Link href="https://www.instagram.com/kmhsbetaclub" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
                </Link>
              </Button>
            </div>
            <div className="text-center sm:text-right">
              <a href="mailto:kmhsbeta@studizilla.com" className="text-sm text-muted-foreground transition-colors hover:text-primary font-medium">
                kmhsbeta@studizilla.com
              </a>
              <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-tighter">Website by Neil Mendpara</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
