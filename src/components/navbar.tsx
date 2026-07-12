import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LightbulbIcon, LayoutDashboard, LogOut, Globe } from 'lucide-react';
import { signOut } from '@/app/auth-actions';
import { ThemeToggle } from '@/components/theme-toggle';

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-2 text-white shadow-md shadow-violet-500/20">
            <LightbulbIcon className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Idea Checker
          </span>
        </Link>

        {/* Navigation & Actions */}
        <nav className="flex items-center space-x-2">
          {user ? (
            <>
              <Link href="/community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1">
                <Globe className="h-4 w-4" />
                Community
              </Link>
              <div className="h-4 w-[1px] bg-border" />
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-4 w-[1px] bg-border" />
              <span className="hidden sm:inline text-xs text-muted-foreground max-w-[120px] truncate">
                {user.email}
              </span>
              <ThemeToggle />
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hover:bg-accent hover:text-accent-foreground">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
