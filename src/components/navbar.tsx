import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LightbulbIcon, LayoutDashboard, Globe, Settings, ChevronDown, User } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.name || '';
  const avatarSeed = encodeURIComponent(userName || user?.email || 'user');
  const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${avatarSeed}&backgroundColor=7c3aed&textColor=ffffff&radius=50`;

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
          {/* Community visible to everyone */}
          <Link href="/community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1">
            <Globe className="h-4 w-4" />
            Community
          </Link>
          <div className="h-4 w-[1px] bg-border" />

          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-4 w-[1px] bg-border" />
              <ThemeToggle />

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-violet-500/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt="User avatar"
                    className="h-8 w-8 rounded-full ring-1 ring-border"
                  />
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg text-foreground">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{userName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                    render={<Link href={`/profile/${user.id}`} />}
                  >
                    <User className="h-4 w-4" />
                    Your Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                    render={<Link href="/account" />}
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                    render={<Link href="/dashboard" />}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
