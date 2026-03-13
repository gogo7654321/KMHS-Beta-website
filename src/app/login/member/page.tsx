
'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function MemberLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/portal');
    }
  }, [user, router]);

  if (isUserLoading || user) {
    return <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">Loading...</div>;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect handled by useEffect above
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-background px-4">
      <div className="mb-6 w-full max-w-[400px]">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/login">
            <ChevronLeft className="h-4 w-4" />
            Back to selection
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-[400px] border-2 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Member Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the portal.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signin">Email</Label>
              <Input
                id="email-signin"
                type="email"
                placeholder="student@kmhs.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signin">Password</Label>
              <Input
                id="password-signin"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link href="/signup/member" className="text-primary hover:underline font-semibold">Sign Up</Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
