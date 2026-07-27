import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';

interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
  isOwner: boolean;
}

export function ProfileView({ user, isOwner }: ProfileViewProps) {
  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=7c3aed&textColor=ffffff&radius=50`;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card className="bg-card/80 dark:bg-zinc-950/60 backdrop-blur-md border-border relative overflow-hidden shadow-xs hover:shadow-md">
      {isOwner && (
        <div className="absolute top-6 right-6 z-10">
          <Link href="/account">
            <Button variant="outline" size="sm" className="bg-card border-border text-foreground hover:bg-accent cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      )}
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <img src={avatarUrl} alt={user.name || user.email} className="w-24 h-24 rounded-full object-cover border-2 border-border" />
          
          <div className="flex-1 space-y-2 mt-2">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {user.name || 'Anonymous User'}
            </h2>
            {user.bio ? (
              <p className="text-muted-foreground max-w-xl leading-relaxed">
                {user.bio}
              </p>
            ) : (
              <p className="text-muted-foreground italic text-sm">No bio provided</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 text-foreground">
            <div className="bg-muted p-2 rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm truncate">{user.email}</span>
          </div>

          {user.location && (
            <div className="flex items-center gap-3 text-foreground">
              <div className="bg-muted p-2 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm truncate">{user.location}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-foreground">
            <div className="bg-muted p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm truncate">Joined {memberSince}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
