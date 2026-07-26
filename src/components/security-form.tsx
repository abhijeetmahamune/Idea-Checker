'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { changePasswordAction } from '@/app/account-actions';

export function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const getPasswordStrength = () => {
    const len = newPassword.length;
    if (len === 0) return { label: '', color: 'bg-zinc-800', level: 0 };
    if (len < 8) return { label: 'Weak', color: 'bg-red-500', level: 1 };
    if (len < 12) return { label: 'Fair', color: 'bg-amber-500', level: 2 };
    return { label: 'Strong', color: 'bg-green-500', level: 3 };
  };

  const strength = getPasswordStrength();

  return (
    <Card className="bg-zinc-950/60 backdrop-blur-md border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-500" />
          Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-background/50 border-border focus-visible:ring-violet-500/50 max-w-md"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-background/50 border-border focus-visible:ring-violet-500/50 max-w-md"
          />
          {newPassword.length > 0 && (
            <div className="flex items-center gap-3 pt-1 max-w-md">
              <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-zinc-800">
                <div className={`h-full w-1/3 ${strength.level >= 1 ? strength.color : 'bg-transparent'}`} />
                <div className={`h-full w-1/3 ${strength.level >= 2 ? strength.color : 'bg-transparent'}`} />
                <div className={`h-full w-1/3 ${strength.level >= 3 ? strength.color : 'bg-transparent'}`} />
              </div>
              <span className={`text-xs ${
                strength.level === 1 ? 'text-red-500' :
                strength.level === 2 ? 'text-amber-500' :
                'text-green-500'
              }`}>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 pb-4">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-background/50 border-border focus-visible:ring-violet-500/50 max-w-md"
          />
        </div>

        <Button
          onClick={handleUpdate}
          disabled={isPending}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
        >
          {isPending ? 'Updating...' : 'Update Password'}
        </Button>
      </CardContent>
    </Card>
  );
}
