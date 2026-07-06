'use client';

import { useState, useTransition } from 'react';
import { toggleProblemVisibilityAction } from '@/app/problem-actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Globe, Lock, Loader2 } from 'lucide-react';

interface VisibilityToggleProps {
  problemId: string;
  initialIsPublic: boolean;
}

export function VisibilityToggle({ problemId, initialIsPublic }: VisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextState = !isPublic;
    
    startTransition(async () => {
      try {
        const result = await toggleProblemVisibilityAction(problemId, nextState);
        
        if (result.error) {
          toast.error(result.error);
          return;
        }

        setIsPublic(nextState);
        toast.success(
          nextState
            ? 'Problem context is now Public! It will appear on the Community Board.'
            : 'Problem context is now Private.'
        );
      } catch (err: any) {
        console.error(err);
        toast.error('An unexpected error occurred.');
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggle}
      disabled={isPending}
      className={`text-xs font-semibold px-3.5 py-1.5 h-auto transition-all duration-300 flex items-center gap-1.5 ${
        isPublic
          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPublic ? (
        <Globe className="h-3.5 w-3.5" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      )}
      <span>{isPublic ? 'Public Share: On' : 'Public Share: Off'}</span>
    </Button>
  );
}
