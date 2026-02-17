'use client';

import { useState } from 'react';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    router.push('/admin');
    return null;
  }

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Admin Portal Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-signin">Email</Label>
            <Input
              id="email-signin"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signin">Password</Label>
            <Input
              id="password-signin"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <Button onClick={handleSignIn}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
