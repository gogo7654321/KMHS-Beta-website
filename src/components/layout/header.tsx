
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, User as UserIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { navLinks, placeholderImages } from '@/lib/data';
import { useUser, useAuth } from '@/firebase';
import { useState } from 'react';

function Logos() {
  const betaLogo = placeholderImages.find(p => p.id === 'beta-logo');

  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Back to homepage">
      {betaLogo && (
          <Image src={betaLogo.imageUrl} alt="Beta Club Logo" width={45} height={45} priority className="h-10 w-auto" />
      )}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="font-headline text-xl font-bold text-primary">
          KMHS Beta
        </span>
      </div>
    </Link>
  );
}

function UserNav() {
  const { user } = useUser();
  const auth = useAuth();
  const defaultAvatar = placeholderImages.find(p => p.id === 'default-avatar');

  if (!user) {
    return (
      <Button asChild variant="default" size="sm" className="font-bold gap-2">
        <Link href="/login">
          <LogIn className="h-4 w-4" />
          Log In
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL ?? defaultAvatar?.imageUrl ?? ''} alt={user.displayName ?? ''} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() ?? <UserIcon />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Admin</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin">Admin Portal</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin">Manage Account</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => auth.signOut()}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Logos />
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} asChild variant="ghost" className={cn(
              'font-semibold text-lg transition-colors',
              pathname === link.href ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <UserNav />
        </nav>
        <div className="md:hidden">
           <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background">
              <div className="flex flex-col p-6">
                <div className="mb-8 flex items-center justify-between">
                    <Logos />
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                </div>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'text-xl font-medium transition-colors hover:text-primary',
                        pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                   <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className='text-xl font-medium transition-colors text-muted-foreground hover:text-primary'
                    >
                      Log In
                    </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
