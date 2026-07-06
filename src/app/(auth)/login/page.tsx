'use client';

import { useState, useTransition } from 'react';
import { loginAction, guestLoginAction } from '@/app/auth-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';
import { Lightbulb, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = () => {
    setError(null);
    startTransition(async () => {
      const result = await guestLoginAction();
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Successfully logged in as guest!');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Successfully logged in!');
      }
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/10 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 filter blur-[120px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2 mb-8">
        <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-2 text-white shadow-md shadow-violet-500/20">
          <Lightbulb className="h-6 w-6" />
        </div>
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Idea Checker
        </span>
      </Link>

      <Card className="w-full max-w-md border-border bg-zinc-950/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription className="text-zinc-500">
            Log in to manage your problems and evaluate multi-solutions.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-xs text-rose-400 font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-background/50 border-border focus-visible:ring-violet-500/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-background/50 border-border focus-visible:ring-violet-500/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md transition-all duration-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>

            <div className="relative flex py-1 items-center w-full">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase">Or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleGuestLogin}
              className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white transition-all duration-200"
            >
              Continue as Guest
            </Button>

            <div className="text-sm text-center text-zinc-500">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-violet-400 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
