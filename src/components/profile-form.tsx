'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Lock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfileAction } from '@/app/account-actions';

interface ProfileFormProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateProfileAction({ name, bio, location });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Profile updated successfully');
      }
    });
  };

  const avatarUrl = user.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=7c3aed&textColor=ffffff&radius=50`;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <Card className="bg-zinc-950/60 backdrop-blur-md border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-violet-500" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
          </div>
          <div className="flex-grow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border focus-visible:ring-violet-500/50"
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={user.email}
                    readOnly
                    className="bg-background/50 border-border text-zinc-500 pl-9"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-none"
                placeholder="Tell us about yourself"
                rows={3}
              />
              <div className="text-xs text-zinc-500 text-right">
                {bio.length} / 280
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-background/50 border-border focus-visible:ring-violet-500/50 pl-9"
                    placeholder="City, Country"
                  />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              </div>
              
              <div className="space-y-2 flex flex-col justify-end pb-2">
                <span className="text-sm text-zinc-400">
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
