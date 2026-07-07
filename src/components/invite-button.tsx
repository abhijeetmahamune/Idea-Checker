'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface InviteButtonProps {
  inviteCode: string;
  inviteLink: string;
}

export function InviteButton({ inviteCode, inviteLink }: InviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await navigator.clipboard.writeText(`${origin}${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-2 py-1.5 rounded-lg transition-all"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {inviteCode}
    </button>
  );
}
