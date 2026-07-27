'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Globe, 
  LayoutDashboard, 
  User, 
  Settings, 
  LogIn, 
  UserPlus, 
  HomeIcon,
  Sparkles,
  LightbulbIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface MobileNavProps {
  user: {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  } | null;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer automatically on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const drawerContent = isOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background animate-fade-in overflow-y-auto min-h-screen">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/10 rounded-full filter blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none -z-10" />

      {/* Mobile Drawer Top Bar */}
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between px-6 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-2">
          <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-2 text-white shadow-md">
            <LightbulbIcon className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Idea Checker
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Close Menu"
            className="hover:bg-accent text-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Drawer Body Content */}
      <div className="flex flex-col flex-grow px-6 py-6 space-y-6">
        {/* User profile card if logged in */}
        {user && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-xs">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=user`}
              alt="User avatar"
              className="h-11 w-11 rounded-full ring-2 ring-violet-500/50"
            />
            <div className="flex flex-col min-w-0">
              <p className="text-base font-semibold text-foreground truncate">
                {user.name || 'Account'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="space-y-2 flex-grow">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
              pathname === '/' 
                ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <Sparkles className="h-5 w-5 text-violet-500" />
            Evaluate Idea
          </Link>

          <Link
            href="/home"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
              pathname === '/home' 
                ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <HomeIcon className="h-5 w-5 text-indigo-400" />
            Homepage
          </Link>

          <Link
            href="/community"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
              pathname === '/community' 
                ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <Globe className="h-5 w-5 text-cyan-400" />
            Community Ideas
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                  pathname === '/dashboard' 
                    ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <LayoutDashboard className="h-5 w-5 text-emerald-400" />
                Dashboard
              </Link>

              <Link
                href={`/profile/${user.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                  pathname.startsWith('/profile') 
                    ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <User className="h-5 w-5 text-indigo-400" />
                Your Profile
              </Link>

              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
                  pathname === '/account' 
                    ? 'bg-violet-500/10 text-violet-500 font-semibold' 
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Settings className="h-5 w-5 text-slate-400" />
                Account Settings
              </Link>
            </>
          ) : (
            <div className="pt-4 space-y-3">
              <Link href="/login" onClick={() => setIsOpen(false)} className="block">
                <Button variant="outline" className="w-full justify-center gap-2 py-6 text-base font-medium rounded-xl">
                  <LogIn className="h-5 w-5" />
                  Log In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="block">
                <Button className="w-full justify-center gap-2 py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-600/20">
                  <UserPlus className="h-5 w-5" />
                  Create Free Account
                </Button>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer note inside mobile drawer */}
        <div className="pt-6 border-t border-border/60 text-center text-xs text-muted-foreground">
          Idea Checker — Multi-Model AI Idea Validation
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="md:hidden">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
        className="hover:bg-accent text-foreground focus:outline-none"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Render overlay at root document level via Portal */}
      {mounted && drawerContent && createPortal(drawerContent, document.body)}
    </div>
  );
}
