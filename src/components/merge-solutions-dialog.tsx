'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GitMerge, Loader2, CheckSquare, Square, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Solution {
  id: string;
  content: string;
  score: number | null;
  isMerged: boolean;
}

interface MergeSolutionsDialogProps {
  problemId: string;
  solutions: Solution[];
}

export function MergeSolutionsDialog({ problemId, solutions }: MergeSolutionsDialogProps) {
  const router = useRouter();
  const [mergeMode, setMergeMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const mergeable = solutions.filter(s => !s.isMerged);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const handleMerge = async () => {
    if (selected.size < 2) {
      toast.error('Select at least 2 solutions to merge');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/merge-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, solutionIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Merge failed');
      toast.success(`Merged! AI score: ${data.score}/100`);
      setMergeMode(false);
      setSelected(new Set());
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to merge');
    } finally {
      setLoading(false);
    }
  };

  if (!mergeMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMergeMode(true)}
        className="gap-1.5 text-xs border-zinc-800 text-zinc-400 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/5"
      >
        <GitMerge className="h-3.5 w-3.5" />
        Merge Solutions
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Mode header */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/8 border border-violet-500/20">
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-bold text-violet-300">Merge Mode</span>
          <span className="text-xs text-zinc-500">Select 2–4 solutions to combine with AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(
            'font-mono text-xs',
            selected.size >= 2 ? 'bg-violet-500/15 text-violet-300 border-violet-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          )}>
            {selected.size}/4 selected
          </Badge>
          <button onClick={() => { setMergeMode(false); setSelected(new Set()); }} className="text-zinc-500 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Solution checkboxes */}
      <div className="space-y-2">
        {mergeable.map(s => {
          const isSelected = selected.has(s.id);
          const isDisabled = !isSelected && selected.size >= 4;
          return (
            <button
              key={s.id}
              onClick={() => !isDisabled && toggleSelect(s.id)}
              disabled={isDisabled}
              className={cn(
                'w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all',
                isSelected ? 'border-violet-500/40 bg-violet-500/8' : 'border-zinc-800 bg-zinc-950/40',
                isDisabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSelected
                  ? <CheckSquare className="h-4 w-4 text-violet-400" />
                  : <Square className="h-4 w-4 text-zinc-600" />}
              </div>
              <div className="flex-grow min-w-0 space-y-1">
                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">{s.content}</p>
                {s.score !== null && (
                  <span className={cn(
                    'text-[10px] font-mono font-bold',
                    s.score >= 70 ? 'text-emerald-400' : s.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                  )}>
                    Score: {s.score}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Merge button */}
      <Button
        onClick={handleMerge}
        disabled={selected.size < 2 || loading}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold gap-2"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Merging & Evaluating... (30–60s)</>
        ) : (
          <><Sparkles className="h-4 w-4" />Merge {selected.size} Solutions with AI</>
        )}
      </Button>
    </div>
  );
}
