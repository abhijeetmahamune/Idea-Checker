'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

interface CreateWorkspaceDialogProps {
  problemId: string;
  existingWorkspaceId?: string;
  existingInviteCode?: string;
}

export function CreateWorkspaceDialog({ problemId, existingWorkspaceId, existingInviteCode }: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ workspaceId: string; inviteCode: string } | null>(
    existingWorkspaceId && existingInviteCode
      ? { workspaceId: existingWorkspaceId, inviteCode: existingInviteCode }
      : null
  );
  const [copied, setCopied] = useState(false);

  const inviteLink = created
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/workspace/join/${created.inviteCode}`
    : '';

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Enter a workspace name');
    setLoading(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 409) throw new Error(data.error);

      // 409 = already exists
      if (res.status === 409) {
        setCreated({ workspaceId: data.workspaceId, inviteCode: '' });
        toast.info('Workspace already exists — redirecting');
        router.push(`/workspace/${data.workspaceId}`);
        return;
      }

      setCreated({ workspaceId: data.workspaceId, inviteCode: data.inviteCode });
      toast.success('Workspace created!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-zinc-800 text-zinc-400 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/5"
          >
            <Users className="h-3.5 w-3.5" />
            {existingWorkspaceId ? 'Open Workspace' : 'Create Workspace'}
          </Button>
        }
      />

      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            {created ? 'Workspace Ready' : 'Create Team Workspace'}
          </DialogTitle>
        </DialogHeader>

        {!created ? (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Create a shared workspace for your team to collaborate on this problem together. Members can chat, propose solutions, and use the AI assistant.
            </p>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hackathon Team Alpha"
              className="bg-zinc-900 border-zinc-800 text-white"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold gap-2"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating...</> : 'Create Workspace'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-400 mb-1">✓ Workspace is ready</p>
              <p className="text-xs text-zinc-400">Share the invite link below with your team members.</p>
            </div>

            {/* Invite link */}
            {created.inviteCode && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Invite Link</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs font-mono"
                  />
                  <Button size="sm" variant="outline" onClick={copyLink} className="flex-shrink-0 border-zinc-800 gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span>Invite code:</span>
                  <code className="text-violet-400 font-mono font-bold bg-violet-500/10 px-1.5 py-0.5 rounded">{created.inviteCode}</code>
                </div>
              </div>
            )}

            <Button
              onClick={() => { setOpen(false); router.push(`/workspace/${created.workspaceId}`); }}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Workspace
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
