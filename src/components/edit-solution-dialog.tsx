'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { editSolutionAction } from '@/app/solution-actions';
import { toast } from 'sonner';
import { Edit, Loader2, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditSolutionDialogProps {
  solution: {
    id: string;
    content: string;
  };
  triggerClassName?: string;
}

export function EditSolutionDialog({ solution, triggerClassName }: EditSolutionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(solution.content);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadingSteps = [
    { threshold: 10, text: 'Preparing workspace...' },
    { threshold: 35, text: 'Running parallel evaluations via Llama, Gemma, and Qwen...' },
    { threshold: 65, text: 'Compiling consensus ratings & executing backups...' },
    { threshold: 85, text: 'Re-analyzing strengths & weaknesses feedback...' },
    { threshold: 95, text: 'Finalizing new Consensus report...' },
  ];

  // Sync content when dialog opens or when solution changes
  useEffect(() => {
    if (open) {
      setContent(solution.content);
    }
  }, [open, solution.content]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            return prev;
          }
          const increment = prev < 55 ? 2.5 : prev < 80 ? 1 : 0.4;
          const nextVal = prev + increment;
          
          const currentStep = loadingSteps.find(step => nextVal <= step.threshold) || loadingSteps[loadingSteps.length - 1];
          setLoadingStep(currentStep.text);

          return nextVal;
        });
      }, 350);
    } else {
      setProgress(0);
      setLoadingStep('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (content.length < 30) {
      toast.error('Solution description must be at least 30 characters long.');
      return;
    }

    setLoading(true);
    setProgress(5);
    setLoadingStep('Initiating evaluate sequence...');

    const formData = new FormData();
    formData.append('id', solution.id);
    formData.append('content', content);

    startTransition(async () => {
      const result = await editSolutionAction(formData);
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      } else {
        setProgress(100);
        setLoadingStep('Success! Refreshing evaluation report...');
        toast.success('Solution updated and re-evaluated!');
        
        setTimeout(() => {
          setLoading(false);
          setOpen(false);
          router.refresh();
        }, 1000);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!loading) setOpen(val);
    }}>
      <DialogTrigger render={
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 border-border text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5 text-xs px-3 font-medium cursor-pointer transition-colors shadow-xs",
            triggerClassName
          )}
        >
          <Edit className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          Edit Solution
        </Button>
      } />
      <DialogContent className="border-border bg-card text-foreground sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden p-6 shadow-2xl">
        <DialogHeader className="flex-shrink-0 pb-3 border-b border-border/60">
          <DialogTitle className="font-display text-lg font-bold flex items-center gap-2">
            <Edit className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            Edit Solution & Re-Evaluate
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Updating your solution will re-run the parallel AI consensus engine and update all analytics.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <BrainCircuit className="h-10 w-10 text-violet-600 dark:text-violet-400 animate-pulse" />
            <div className="space-y-2 w-full max-w-md">
              <Progress value={progress} className="h-2 bg-muted" />
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>{loadingStep}</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden pt-4 space-y-4">
            <div className="flex flex-col flex-1 min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="solution-content" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Solution Description <span className="text-destructive">*</span>
                </Label>
                <span className={cn(
                  "text-[11px] font-mono",
                  content.trim().length < 30 ? "text-amber-500 font-semibold" : "text-muted-foreground"
                )}>
                  {content.trim().length} chars {content.trim().length < 30 && '(min 30 required)'}
                </span>
              </div>
              <Textarea
                id="solution-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Describe your solution in detail..."
                className="flex-1 min-h-[160px] max-h-[45vh] overflow-y-auto bg-background border-border text-foreground focus-visible:ring-violet-500/50 resize-y p-3.5 text-sm leading-relaxed rounded-lg shadow-xs font-sans"
              />
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t border-border mt-auto flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || content.trim().length < 30}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer px-4 shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Re-Evaluating...
                  </>
                ) : (
                  'Save & Re-Evaluate'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
